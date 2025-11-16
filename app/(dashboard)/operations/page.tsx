"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef, Row } from "@tanstack/react-table";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import DataTable from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type IncusOperation = {
  id: string;
  class?: string;
  description?: string;
  status: string;
  status_code?: number;
  created_at?: string;
  updated_at?: string;
  metadata?: unknown;
};

type OperationListMetadata = {
  running?: string[];
  pending?: string[];
  success?: string[];
  failure?: string[];
  cancelling?: string[];
};

type OperationsResponse = {
  metadata: IncusOperation[] | OperationListMetadata | IncusOperation;
};

type OperationDetailResponse = {
  metadata: IncusOperation;
};

const STATUS_STYLES: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  running: {
    label: "Running",
    className: "border-blue-500/40 bg-blue-500/10 text-blue-100",
  },
  pending: {
    label: "Pending",
    className: "border-zinc-600 bg-zinc-900 text-zinc-200",
  },
  cancelling: {
    label: "Cancelling",
    className: "border-blue-300/40 bg-blue-300/10 text-blue-100",
  },
  success: {
    label: "Success",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
  },
  failure: {
    label: "Failure",
    className: "border-red-500/40 bg-red-500/10 text-red-100",
  },
};

async function cancelOperation(id: string) {
  const res = await fetch(`/1.0/operations/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Unable to cancel ${id}: ${res.status}`);
  }
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function ChangesPreview({ metadata }: { metadata: unknown }) {
  if (!metadata || metadata === "—") {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  if (typeof metadata === "string") {
    return (
      <span className="text-sm text-muted-foreground break-words">
        {metadata}
      </span>
    );
  }
  if (typeof metadata === "object") {
    return (
      <div className="space-y-1 text-xs text-zinc-300">
        {Object.entries(metadata as Record<string, unknown>).map(
          ([key, value]) => (
            <div key={key} className="flex gap-2">
              <span className="text-muted-foreground">{key}</span>
              <span className="break-words">
                {typeof value === "string"
                  ? value
                  : Array.isArray(value)
                  ? value.join(", ")
                  : JSON.stringify(value)}
              </span>
            </div>
          )
        )}
      </div>
    );
  }
  return <span className="text-sm text-muted-foreground">{String(metadata)}</span>;
}

export default function OperationsPage() {
  const [operations, setOperations] = useState<IncusOperation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [filter, setFilter] = useState("");
  const [selectedOperations, setSelectedOperations] = useState<IncusOperation[]>(
    []
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();

  const resolveOperations = useCallback(
    async (payload: OperationsResponse): Promise<IncusOperation[]> => {
      const raw = payload?.metadata;
      if (Array.isArray(raw)) {
        return raw as IncusOperation[];
      }
      if (raw && typeof raw === "object") {
        if ("id" in raw && "status" in raw) {
          return [raw as IncusOperation];
        }
        const list = raw as OperationListMetadata;
        const buckets = [
          ...(list.running ?? []),
          ...(list.pending ?? []),
          ...(list.success ?? []),
          ...(list.failure ?? []),
          ...(list.cancelling ?? []),
        ] as (string | IncusOperation)[];
        const flattenedObjects = buckets.filter(
          (entry): entry is IncusOperation =>
            typeof entry === "object" &&
            entry !== null &&
            "status" in entry &&
            "id" in entry
        );
        if (flattenedObjects.length) {
          return flattenedObjects;
        }
        const stringPaths = buckets.filter(
          (entry): entry is string => typeof entry === "string"
        );
        const uniquePaths = Array.from(new Set(stringPaths));
        if (!uniquePaths.length) return [];
        const details = await Promise.all(
          uniquePaths.map(async (path) => {
            const detailRes = await fetch(path, { cache: "no-store" });
            if (!detailRes.ok) {
              throw new Error(
                `Unable to fetch operation ${path}: ${detailRes.status}`
              );
            }
            const detailJson =
              (await detailRes.json()) as OperationDetailResponse;
            return detailJson.metadata;
          })
        );
        return details;
      }
      return [];
    },
    []
  );
  const fetchOperations = useCallback(async () => {
    setIsUpdating(true);
    try {
      const response = await fetch("/1.0/operations?recursion=1", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const json = (await response.json()) as OperationsResponse;
      const parsed = await resolveOperations(json);
      setOperations(
        parsed.sort((a, b) => {
          const dateA = new Date(a.created_at ?? a.updated_at ?? 0).getTime();
          const dateB = new Date(b.created_at ?? b.updated_at ?? 0).getTime();
          return dateB - dateA;
        })
      );
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load operations",
        description:
          error instanceof Error ? error.message : "Unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
      window.setTimeout(() => setIsUpdating(false), 800);
    }
  }, [resolveOperations, toast]);

  useEffect(() => {
    fetchOperations();
    const interval = window.setInterval(fetchOperations, 5000);
    return () => window.clearInterval(interval);
  }, [fetchOperations]);

useEffect(() => {
  setSelectedOperations((prev) => (prev.length ? [] : prev));
}, [operations]);

  const columns = useMemo<ColumnDef<object, unknown>[]>(
    () => [
      {
        header: "Operation ID",
        accessorKey: "id",
        cell: ({ row }: { row: Row<object> }) => {
          const operation = row.original as IncusOperation;
          return <div className="font-mono text-xs">{operation.id}</div>;
        },
      },
      {
        header: "Type",
        accessorKey: "class",
        cell: ({ row }: { row: Row<object> }) => {
          const operation = row.original as IncusOperation;
          return operation.class ?? "—";
        },
      },
      {
        header: "Description",
        accessorKey: "description",
        cell: ({ row }: { row: Row<object> }) => {
          const operation = row.original as IncusOperation;
          return operation.description ?? "—";
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }: { row: Row<object> }) => {
          const operation = row.original as IncusOperation;
          const statusKey = operation.status?.toLowerCase() ?? "";
          const statusMeta = STATUS_STYLES[statusKey] ?? {
            label: operation.status || "Unknown",
            className: "border-zinc-600 bg-zinc-900 text-zinc-300",
          };
          return (
            <Badge
              variant="outline"
              className={cn(
                "border px-2 py-0.5 text-xs font-medium",
                statusMeta.className
              )}
            >
              {statusMeta.label}
            </Badge>
          );
        },
      },
      {
        header: "Creation Time",
        accessorKey: "created_at",
        cell: ({ row }: { row: Row<object> }) => {
          const operation = row.original as IncusOperation;
          return (
            <span className="text-sm text-zinc-300">
              {formatDateTime(operation.created_at)}
            </span>
          );
        },
      },
      {
        header: "Changes",
        id: "changes",
        cell: ({ row }: { row: Row<object> }) => {
          const operation = row.original as IncusOperation;
          return <ChangesPreview metadata={operation.metadata} />;
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="text-2xl font-semibold">Operations</p>
          <p className="text-sm text-muted-foreground">
            Live tasks and background operations running on Incus.
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <Badge
            variant="outline"
            className={cn(
              "border-white/20 text-xs uppercase tracking-wide",
              isUpdating ? "text-blue-200" : "text-emerald-200"
            )}
          >
            {isUpdating ? "Updating…" : "Live"}
          </Badge>
          <Input
            placeholder="Search operations…"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="w-full sm:w-64"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">
          {selectedOperations.length
            ? `${selectedOperations.length} selected`
            : "Select operations to manage them"}
        </p>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!selectedOperations.length || isCancelling}
            onClick={async () => {
              if (!selectedOperations.length) return;
              setActionError(null);
              setIsCancelling(true);
              try {
                await Promise.all(
                  selectedOperations.map((operation) =>
                    cancelOperation(operation.id)
                  )
                );
                await fetchOperations();
              } catch (error) {
                setActionError(
                  error instanceof Error
                    ? error.message
                    : "Unable to cancel operations."
                );
              } finally {
                setIsCancelling(false);
              }
            }}
          >
            {isCancelling ? (
              <Spinner className="mr-2 size-3" />
            ) : null}
            Cancel
          </Button>
        </div>
      </div>
      {actionError ? (
        <Alert variant="destructive">
          <AlertTitle>Cancel action failed</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : operations.length ? (
        <DataTable
          enableSelection
          data={operations}
          cols={columns}
          stringFilter={filter}
          className=""
          onSelectionChange={(rows) => {
            const next = rows.map((row) => row.original as IncusOperation);
            setSelectedOperations((prev) => {
              if (
                prev.length === next.length &&
                prev.every((item, index) => item.id === next[index]?.id)
              ) {
                return prev;
              }
              return next;
            });
          }}
        />
      ) : (
        <div className="flex h-48 items-center justify-center rounded-md border border-white/5">
          <p className="text-sm text-muted-foreground">
            No operations are currently running.
          </p>
        </div>
      )}
    </div>
  );
}
