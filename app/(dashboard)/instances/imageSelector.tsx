"use client";

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
import { useEffect, useMemo, useState } from "react";

type RemoteServer = {
  server: string;
  protocol?: string;
};

type Image = {
  local: boolean;
  identifier: string;
  arch?: string;
  os?: string;
  release?: string;
  variant?: string;
};

export default function ImageSelector() {
  const { data: localImagesData, isLoading, isValidating } = useImages();
  const [userAddedRemoteServers, setUserAddedRemoteServers] = useState<
    RemoteServer[]
  >([]);
  const [addingRemote, setAddingRemote] = useState<boolean>(false);
  const [remoteProtocol, setRemoteProtocol] = useState<string>("simplestreams");
  const [remoteURL, setRemoteURL] = useState<string>("");
  const [ociImage, setOciImage] = useState<string>("");
  const [loadingRemotes, setLoadingRemotes] = useState<boolean>(false);
  const [remoteImages, setRemoteImages] = useState<Image[]>([]);
  const [stringFilter, setStringFilter] = useState<string>("");

  const localImages = useMemo(() => {
    if (!localImagesData) return [];
    return localImagesData.map((image) => ({
      local: true,
      identifier: image.fingerprint,
      arch: image.architecture,
      os: image.properties.os,
      release: image.properties.release,
      variant: image.properties.variant,
    }));
  }, [localImagesData]);

  const derivedRemoteServers = useMemo(() => {
    if (!localImagesData) return [];
    return localImagesData.reduce<RemoteServer[]>((acc, image) => {
      if (image.update_source && image.update_source.server) {
        const exists = acc.some(
          (item) => item.server === image.update_source?.server
        );
        if (!exists) {
          acc.push({
            server: image.update_source.server,
            protocol: image.update_source.protocol,
          });
        }
      }
      return acc;
    }, []);
  }, [localImagesData]);

  const remoteServers = useMemo(() => {
    return [...derivedRemoteServers, ...userAddedRemoteServers];
  }, [derivedRemoteServers, userAddedRemoteServers]);

  const images = [...localImages, ...remoteImages];
  useEffect(() => {
    remoteServers.forEach(async (remote) => {
      setLoadingRemotes(true);
      if (remote.protocol == "simplestreams") {
        try {
          const res = await fetch(remote.server + "/streams/v1/index.json");
          const data = await res.json();
          const imagesPath = data.index.images.path;
          const imagesRes = await fetch(remote.server + "/" + imagesPath);
          const imagesData = await imagesRes.json();
          const theseImages = imagesData.products;
          Object.keys(theseImages).map((key) => {
            console.log(key, theseImages[key]);
            const image = {
              local: false,
              identifier:
                theseImages[key].aliases.split(",")[0] ||
                theseImages[key].aliases,
              arch: theseImages[key].arch,
              os: theseImages[key].os,
              release: theseImages[key].release,
              variant: theseImages[key].variant,
            };
            setRemoteImages((prevImages) => [...prevImages, image]);
          });
        } catch {}
      }
      setLoadingRemotes(false);
    });
  }, [remoteServers]);
  return (
    <div className="mt-2">
      {isLoading && <Spinner />}
      {!isLoading && images ? (
        <>
          <div className="flex">
            <p className="font-medium text-md my-auto">Image</p>
            <Input
              placeholder="Search images..."
              value={stringFilter}
              onChange={(e) => setStringFilter(e.currentTarget.value)}
              className="h-auto  ml-auto w-64 mr-4"
            />
            <Dialog open={addingRemote} onOpenChange={setAddingRemote}>
              <DialogTrigger asChild>
                <Button size="sm" className="my-auto">
                  Add Remote{" "}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Remote</DialogTitle>
                  <DialogDescription>
                    Add a remote server to fetch images or an OCI image
                  </DialogDescription>
                </DialogHeader>
                <Label htmlFor="protocol">Remote Server</Label>

                <div className="flex gap-2 -mt-2" id="protocol">
                  <Select
                    value={remoteProtocol}
                    onValueChange={setRemoteProtocol}
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
                    placeholder="Remote URL"
                    value={remoteURL}
                    onChange={(e) => setRemoteURL(e.target.value)}
                  />
                </div>
                {remoteProtocol == "oci" ? (
                  <>
                    <Label htmlFor="ociImage">OCI Image</Label>
                    <Input
                      value={ociImage}
                      onChange={(e) => setOciImage(e.target.value)}
                      className="-mt-2"
                      id="ociImage"
                      placeholder="OCI Image"
                    />
                  </>
                ) : null}
                <DialogFooter>
                  <Button
                    disabled={remoteProtocol === "oci" ? !ociImage : !remoteURL}
                    onClick={() => {
                      if (
                        remoteProtocol === "simplestreams" ||
                        remoteProtocol === "incus"
                      ) {
                        setUserAddedRemoteServers((prev) => [
                          ...prev,
                          { server: remoteURL, protocol: remoteProtocol },
                        ]);
                      } else if (remoteProtocol === "oci") {
                        setRemoteImages((prev) => [
                          {
                            local: false,
                            identifier: ociImage,
                            os: ociImage,
                          },
                          ...prev,
                        ]);
                      }
                      setAddingRemote(false);
                    }}
                  >
                    {remoteProtocol === "oci"
                      ? "Add OCI Image"
                      : "Add Remote Server"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <DataTable
            className={`${
              isValidating || loadingRemotes ? "animate-pulse" : ""
            } mt-2 mb-auto`}
            stringFilter={stringFilter}
            cols={[
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
                header: "Source",
                accessorKey: "local",
                cell: ({ getValue }) => (getValue() ? "Local" : "Remote"),
              },
              {
                header: "Select",
                id: "select",
                cell: () => (
                  <Button size="sm" variant="outline">
                    Select
                  </Button>
                ),
              },
            ]}
            data={images}
          />
        </>
      ) : null}
    </div>
  );
}
