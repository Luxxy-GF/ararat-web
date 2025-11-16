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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
  const [inspectorOperation, setInspectorOperation] =
    useState<IncusOperation | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
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
          onRowClick={(row) => {
            setInspectorOperation(row.original as IncusOperation);
            setIsInspectorOpen(true);
          }}
        />
      ) : (
        <div className="flex h-48 items-center justify-center rounded-md border border-white/5">
          <p className="text-sm text-muted-foreground">
            No operations are currently running.
          </p>
        </div>
      )}
      <Sheet
        open={isInspectorOpen}
        onOpenChange={(open) => {
          setIsInspectorOpen(open);
          if (!open) setInspectorOperation(null);
        }}
      >
        <SheetContent side="right" className="sm:max-w-md">
          {inspectorOperation ? (
            <OperationInspector operation={inspectorOperation} />
          ) : (
            <div className="p-4 text-sm text-muted-foreground">
              Select an operation to view details.
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function OperationInspector({ operation }: { operation: IncusOperation }) {
  return (
    <>
      <SheetHeader className="px-4 pt-4">
        <SheetTitle>{operation.description ?? operation.id}</SheetTitle>
        <SheetDescription>
          {operation.class ?? "Operation"} · {operation.status}
        </SheetDescription>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
        <MetadataSection title="Metadata" metadata={operation.metadata} />
      </div>
    </>
  );
}

function MetadataSection({
  title,
  metadata,
}: {
  title: string;
  metadata: unknown;
}) {
  if (!metadata || (typeof metadata === "object" && metadata !== null && !Object.keys(metadata as object).length)) {
    return null;
  }

  const entries = (
    typeof metadata === "object" && metadata !== null
      ? Object.entries(metadata as Record<string, unknown>)
      : [["value", metadata]]
  ) as [string, unknown][];

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase text-muted-foreground">
        {title}
      </p>
      <div className="space-y-2 rounded-md border border-white/10 bg-black/30 p-3 text-sm">
        {entries.map(([key, value]) => (
          <KeyValueCard key={`${title}-${key}`} label={key}>
            {renderValue(value)}
          </KeyValueCard>
        ))}
      </div>
    </div>
  );
}

function KeyValueCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1 rounded-md border border-white/5 bg-zinc-900/70 px-3 py-2">
      <p className="text-[10px] font-medium uppercase text-muted-foreground tracking-wide">
        {label}
      </p>
      <div className="text-xs text-white break-words">{children}</div>
    </div>
  );
}

function renderValue(value: unknown): React.ReactNode {
  if (value === null || typeof value === "undefined") return "—";
  if (typeof value === "string" || typeof value === "number")
    return value.toString();
  if (Array.isArray(value)) {
    if (!value.length) return "[]";
    return (
      <ul className="list-disc pl-4 space-y-1">
        {value.map((item, idx) => (
          <li key={idx} className="break-words">
            {renderValue(item)}
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object") {
    return (
      <div className="space-y-2 pl-1">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <KeyValueCard key={`nested-${k}`} label={k}>
            {renderValue(v)}
          </KeyValueCard>
        ))}
      </div>
    );
  }
  return <span>{String(value)}</span>;
}
