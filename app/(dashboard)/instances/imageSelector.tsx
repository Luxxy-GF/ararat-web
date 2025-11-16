"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Row } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import DataTable from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useImages } from "@/lib/swr/incus/images";
import { ProjectContext } from "@/components/context/projects";

type RemoteProtocol = "simplestreams";

type RemoteServer = {
  server: string;
  protocol: RemoteProtocol;
};

type ImageKind = "container" | "virtual-machine";

type SimplestreamItem = {
  ftype?: string;
  path?: string;
};

type SimplestreamProduct = {
  aliases?: string | { name: string }[];
  arch?: string;
  os?: string;
  release?: string;
  variant?: string;
  versions?: Record<
    string,
    {
      items?: Record<string, SimplestreamItem>;
    }
  >;
};

export type SelectableImage = {
  id: string;
  local: boolean;
  label: string;
  os?: string;
  release?: string;
  variant?: string;
  arch?: string;
  types: ImageKind[];
  fingerprint?: string;
  remote?: {
    server: string;
    alias: string;
    protocol: "simplestreams" | "oci";
  };
};

export default function ImageSelector({
  selectedImage,
  onSelect,
}: {
  selectedImage: SelectableImage | null;
  onSelect: (image: SelectableImage) => void;
}) {
  const { currentProject } = use(ProjectContext);
  const {
    data: localImagesData,
    isLoading,
    isValidating,
  } = useImages(currentProject);
  const [userAddedRemoteServers, setUserAddedRemoteServers] = useState<
    RemoteServer[]
  >([]);
  const [remoteImages, setRemoteImages] = useState<SelectableImage[]>([]);
  const [loadingRemotes, setLoadingRemotes] = useState(false);
  const [addingRemote, setAddingRemote] = useState(false);
  const [remoteProtocol, setRemoteProtocol] =
    useState<"simplestreams" | "oci">("simplestreams");
  const [remoteURL, setRemoteURL] = useState("");
  const [ociImage, setOciImage] = useState("");
  const [stringFilter, setStringFilter] = useState("");
  const fetchedRemotesRef = useRef(new Set<string>());

  const localImages = useMemo<SelectableImage[]>(() => {
    if (!localImagesData) return [];
    return localImagesData.map((image) => ({
      id: `local-${image.fingerprint}`,
      local: true,
      label: image.aliases?.[0]?.name ?? image.fingerprint,
      os: image.properties.os,
      release: image.properties.release,
      variant: image.properties.variant,
      arch: image.architecture,
      types: image.type ? [image.type as ImageKind] : [],
      fingerprint: image.fingerprint,
    }));
  }, [localImagesData]);

  const derivedRemoteServers = useMemo<RemoteServer[]>(() => {
    if (!localImagesData) return [];
    const map = new Map<string, RemoteServer>();
    localImagesData.forEach((image) => {
      const server = image.update_source?.server;
      if (!server) return;
      const normalized = normalizeRemoteURL(server);
      if (!normalized || map.has(normalized)) return;
      map.set(normalized, {
        server: normalized,
        protocol: "simplestreams",
      });
    });
    return Array.from(map.values());
  }, [localImagesData]);

  const remoteServers = useMemo(() => {
    const map = new Map<string, RemoteServer>();
    [...derivedRemoteServers, ...userAddedRemoteServers].forEach((remote) => {
      const normalized = normalizeRemoteURL(remote.server);
      if (!normalized || map.has(normalized)) return;
      map.set(normalized, { server: normalized, protocol: "simplestreams" });
    });
    return Array.from(map.values());
  }, [derivedRemoteServers, userAddedRemoteServers]);

  useEffect(() => {
    const serversToFetch = remoteServers.filter(
      (remote) => !fetchedRemotesRef.current.has(remote.server)
    );
    if (!serversToFetch.length) return;
    let cancelled = false;
    const fetchRemotes = async () => {
      setLoadingRemotes(true);
      try {
        for (const remote of serversToFetch) {
          try {
            const remoteImagesForServer = await fetchSimplestreamImages(remote);
            if (cancelled) return;
            fetchedRemotesRef.current.add(remote.server);
            setRemoteImages((prev) =>
              mergeImageLists(prev, remoteImagesForServer)
            );
          } catch (error) {
            console.error("Unable to fetch remote images", remote.server, error);
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingRemotes(false);
        }
      }
    };
    fetchRemotes();
    return () => {
      cancelled = true;
    };
  }, [remoteServers]);

  const images = useMemo(
    () => [...localImages, ...remoteImages],
    [localImages, remoteImages]
  );
  const selectedImageId = selectedImage?.id ?? null;

  const handleSelect = useCallback(
    (image: SelectableImage) => {
      onSelect(image);
    },
    [onSelect]
  );

  const handleRowClick = useCallback(
    (row: Row<object>) => {
      handleSelect(row.original as SelectableImage);
    },
    [handleSelect]
  );

  const handleAddRemote = () => {
    const normalized = normalizeRemoteURL(remoteURL);
    if (!normalized) return;
    if (remoteProtocol === "simplestreams") {
      setUserAddedRemoteServers((prev) => {
        if (prev.some((remote) => remote.server === normalized)) return prev;
        return [...prev, { server: normalized, protocol: "simplestreams" }];
      });
    } else if (remoteProtocol === "oci" && ociImage) {
      const ociEntry = buildOciImage(normalized, ociImage);
      setRemoteImages((prev) => mergeImageLists(prev, [ociEntry]));
    }
    setRemoteURL("");
    setOciImage("");
    setAddingRemote(false);
  };

  const columns = useMemo(
    () => [
      {
        header: "Image",
        accessorKey: "label",
        cell: ({ row }: { row: Row<object> }) => {
          const image = row.original as SelectableImage;
          return (
            <div className="flex flex-col">
              <span className="font-medium break-all whitespace-normal">
                {image.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {image.local
                  ? "Local image"
                  : `Remote: ${formatSource(image.remote?.server)}`}
              </span>
            </div>
          );
        },
      },
      {
        header: "OS",
        accessorKey: "os",
      },
      {
        header: "Release",
        accessorKey: "release",
      },
      {
        header: "Variant",
        accessorKey: "variant",
      },
      {
        header: "Architecture",
        accessorKey: "arch",
      },
      {
        header: "Type",
        id: "types",
        cell: ({ row }: { row: Row<object> }) => {
          const image = row.original as SelectableImage;
          return image.types.length
            ? image.types
                .map((type) =>
                  type === "virtual-machine" ? "Virtual Machine" : "Container"
                )
                .join(", ")
            : "—";
        },
      },
      {
        header: "",
        id: "actions",
        cell: ({ row }: { row: Row<object> }) => {
          const image = row.original as SelectableImage;
          const isSelected = selectedImageId === image.id;
          return (
            <Button
              size="sm"
              variant={isSelected ? "default" : "outline"}
              onClick={(event) => {
                event.stopPropagation();
                handleSelect(image);
              }}
            >
              {isSelected ? "Selected" : "Use"}
            </Button>
          );
        },
      },
    ],
    [handleSelect, selectedImageId]
  );

  return (
    <div className="mt-2 space-y-4">
      {isLoading ? <Spinner className="mx-auto my-6" /> : null}
      {!isLoading ? (
        <>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <p className="font-medium text-md my-auto">Available Images</p>
              <span className="text-xs text-muted-foreground">
                {currentProject === "all"
                  ? "All Projects"
                  : `Project: ${currentProject}`}
              </span>
            </div>
            <Input
              placeholder="Search images..."
              value={stringFilter}
              onChange={(event) => setStringFilter(event.currentTarget.value)}
              className="h-auto w-full flex-1 min-w-48 sm:w-64"
            />
            <Dialog open={addingRemote} onOpenChange={setAddingRemote}>
              <DialogTrigger asChild>
                <Button size="sm" className="my-auto">
                  Add Remote
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Remote</DialogTitle>
                  <DialogDescription>
                    Add a Simplestreams server or OCI image to pull from.
                  </DialogDescription>
                </DialogHeader>
                <Label htmlFor="remoteProtocol">Remote Type</Label>
                <div className="flex gap-2 -mt-2" id="remoteProtocol">
                  <Select
                    value={remoteProtocol}
                    onValueChange={(value) =>
                      setRemoteProtocol(value as "simplestreams" | "oci")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Remote Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simplestreams">
                        Simplestreams
                      </SelectItem>
                      <SelectItem value="oci">OCI</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="https://images.example.com"
                    value={remoteURL}
                    onChange={(event) => setRemoteURL(event.target.value)}
                  />
                </div>
                {remoteProtocol === "oci" ? (
                  <>
                    <Label htmlFor="ociImage">OCI Image</Label>
                    <Input
                      id="ociImage"
                      value={ociImage}
                      onChange={(event) => setOciImage(event.target.value)}
                      placeholder="library/ubuntu:latest"
                      className="-mt-2"
                    />
                  </>
                ) : null}
                <DialogFooter>
                  <Button
                    disabled={
                      !remoteURL ||
                      (remoteProtocol === "oci" && !ociImage.trim().length)
                    }
                    onClick={handleAddRemote}
                  >
                    {remoteProtocol === "oci"
                      ? "Add OCI Image"
                      : "Add Remote Server"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            {selectedImage ? (
              <>
                <p className="font-medium">{selectedImage.label}</p>
                <p className="text-muted-foreground">
                  {selectedImage.remote
                    ? `Remote ${selectedImage.remote.protocol.toUpperCase()} source`
                    : "Local cached image"}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                Select an image to define the instance base.
              </p>
            )}
          </div>
          <DataTable
            className={`mt-2 max-h-[60vh] overflow-auto ${
              isValidating || loadingRemotes ? "animate-pulse" : ""
            }`}
            stringFilter={stringFilter}
            cols={columns}
            data={images}
            onRowClick={handleRowClick}
          />
        </>
      ) : null}
    </div>
  );
}

function normalizeRemoteURL(url: string) {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function mergeImageLists(
  current: SelectableImage[],
  incoming: SelectableImage[]
) {
  const map = new Map<string, SelectableImage>();
  current.forEach((image) => map.set(image.id, image));
  incoming.forEach((image) => map.set(image.id, image));
  return Array.from(map.values());
}

async function fetchSimplestreamImages(remote: RemoteServer) {
  const base = remote.server;
  const indexRes = await fetch(`${base}/streams/v1/index.json`);
  if (!indexRes.ok) {
    throw new Error(`Unable to fetch index from ${base}`);
  }
  const indexJson = await indexRes.json();
  const imagesPath =
    indexJson.index?.images?.path ?? "streams/v1/images.json";
  const path = imagesPath.startsWith("http")
    ? imagesPath
    : `${base}/${imagesPath.replace(/^\//, "")}`;
  const imagesRes = await fetch(path);
  if (!imagesRes.ok) {
    throw new Error(`Unable to fetch images from ${base}`);
  }
  const imagesJson = await imagesRes.json();
  const products = (imagesJson.products ??
    {}) as Record<string, SimplestreamProduct>;
  const remoteImages: SelectableImage[] = [];
  Object.entries(products).forEach(([key, product]) => {
    const alias = extractPrimaryAlias(product.aliases) ?? key;
    const versionKey = selectLatestVersion(product.versions);
    const versionItems: Record<string, SimplestreamItem> | undefined =
      versionKey ? product.versions?.[versionKey]?.items : undefined;
    const types = deriveImageTypes(versionItems);
    remoteImages.push({
      id: `remote-${base}-${alias}-${product.arch ?? ""}-${product.variant ?? ""}`,
      local: false,
      label: alias,
      os: product.os,
      release: product.release,
      variant: product.variant,
      arch: product.arch,
      types,
      remote: {
        server: base,
        alias,
        protocol: "simplestreams",
      },
    });
  });
  return remoteImages;
}

function extractPrimaryAlias(aliases?: unknown) {
  if (!aliases) return undefined;
  if (Array.isArray(aliases)) {
    return aliases[0]?.name;
  }
  if (typeof aliases === "string") {
    return aliases.split(",")[0];
  }
  return undefined;
}

function selectLatestVersion(versions?: Record<string, unknown>) {
  if (!versions) return null;
  return Object.keys(versions).sort().at(-1) ?? null;
}

function deriveImageTypes(items?: Record<string, SimplestreamItem>) {
  if (!items) return [];
  const values = Object.values(items);
  const types = new Set<ImageKind>();
  const containerMatch = values.some((item) =>
    ["squashfs", "lxd", "rootfs"].some((token) =>
      (item.ftype ?? "").includes(token) || (item.path ?? "").includes(token)
    )
  );
  if (containerMatch) {
    types.add("container");
  }
  const vmMatch = values.some((item) =>
    ["disk", "qcow", "uefi"].some((token) =>
      (item.ftype ?? "").includes(token) || (item.path ?? "").includes(token)
    )
  );
  if (vmMatch) {
    types.add("virtual-machine");
  }
  return Array.from(types);
}

function buildOciImage(server: string, alias: string): SelectableImage {
  const trimmedAlias = alias.trim();
  return {
    id: `oci-${server}-${trimmedAlias}`,
    local: false,
    label: trimmedAlias,
    os: trimmedAlias,
    types: ["virtual-machine"],
    remote: {
      server,
      alias: trimmedAlias,
      protocol: "oci",
    },
  };
}

function formatSource(server?: string) {
  if (!server) return "Remote";
  try {
    const parsed = new URL(server);
    return parsed.hostname;
  } catch {
    return server;
  }
}
