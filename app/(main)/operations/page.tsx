'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ColumnDef, Row } from '@tanstack/react-table';

import { Alert, AlertDescription, AlertTitle } from '@/app/_components/ui/alert';
import { Badge } from '@/app/_components/ui/badge';
import DataTable from '@/app/_components/ui/data-table';
import { Input } from '@/app/_components/ui/input';
import { Skeleton } from '@/app/_components/ui/skeleton';
import { cn } from '@/app/_components/ui/lib/utils';
import { Button } from '@/app/_components/ui/button';
import { Spinner } from '@/app/_components/ui/spinner';
import { cancelOperation, fetchOperationsList } from '@/app/(main)/operations/_lib/operations';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/app/_components/ui/sheet';
import type { IncusOperation } from '@/app/(main)/operations/_lib/operations.d';

const STATUS_STYLES: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  running: {
    label: 'Running',
    className: 'border-blue-500/40 bg-blue-500/10 text-blue-100',
  },
  pending: {
    label: 'Pending',
    className: 'border-zinc-600 bg-zinc-900 text-zinc-200',
  },
  cancelling: {
    label: 'Cancelling',
    className: 'border-blue-300/40 bg-blue-300/10 text-blue-100',
  },
  success: {
    label: 'Success',
    className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100',
  },
  failure: {
    label: 'Failure',
    className: 'border-red-500/40 bg-red-500/10 text-red-100',
  },
};

function formatDateTime(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function OperationsPage() {
  const [operations, setOperations] = useState<IncusOperation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedOperations, setSelectedOperations] = useState<IncusOperation[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [inspectorOperation, setInspectorOperation] = useState<IncusOperation | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const fetchOperations = useCallback(async () => {
    try {
      const parsed = await fetchOperationsList();
      setOperations(
        parsed.sort((a, b) => {
          const dateA = new Date(a.created_at ?? a.updated_at ?? 0).getTime();
          const dateB = new Date(b.created_at ?? b.updated_at ?? 0).getTime();
          return dateB - dateA;
        })
      );
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  const columns = useMemo<ColumnDef<object, unknown>[]>(
    () => [
      {
        header: 'Operation ID',
        accessorKey: 'id',
        cell: ({ row }: { row: Row<object> }) => {
          const operation = row.original as IncusOperation;
          return <div className="font-mono text-xs truncate max-w-[200px]">{operation.id}</div>;
        },
      },
      {
        header: 'Type',
        accessorKey: 'class',
        cell: ({ row }: { row: Row<object> }) => {
          const operation = row.original as IncusOperation;
          return operation.class ?? '—';
        },
      },
      {
        header: 'Description',
        accessorKey: 'description',
        cell: ({ row }: { row: Row<object> }) => {
          const operation = row.original as IncusOperation;
          return operation.description ?? '—';
        },
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }: { row: Row<object> }) => {
          const operation = row.original as IncusOperation;
          const statusKey = operation.status?.toLowerCase() ?? '';
          const statusMeta = STATUS_STYLES[statusKey] ?? {
            label: operation.status || 'Unknown',
            className: 'border-zinc-600 bg-zinc-900 text-zinc-300',
          };
          return (
            <Badge
              variant="outline"
              className={cn('border px-2 py-0.5 text-xs font-medium', statusMeta.className)}
            >
              {statusMeta.label}
            </Badge>
          );
        },
      },
      {
        header: 'Creation Time',
        accessorKey: 'created_at',
        cell: ({ row }: { row: Row<object> }) => {
          const operation = row.original as IncusOperation;
          return (
            <span className="text-sm text-zinc-300">{formatDateTime(operation.created_at)}</span>
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
          <p className="text-sm text-muted-foreground">Live tasks and background operations</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {selectedOperations.length ? (
            <Button
              variant="outline"
              size="sm"
              disabled={isCancelling}
              onClick={async () => {
                if (!selectedOperations.length) return;
                setActionError(null);
                setIsCancelling(true);
                try {
                  await Promise.all(
                    selectedOperations.map((operation) => cancelOperation(operation.id))
                  );
                  await fetchOperations();
                } catch (error) {
                  setActionError(
                    error instanceof Error ? error.message : 'Unable to cancel operations.'
                  );
                } finally {
                  setIsCancelling(false);
                }
              }}
            >
              {isCancelling ? <Spinner className="mr-2 size-3" /> : null}
              Cancel Selected
            </Button>
          ) : (
            <Input
              placeholder="Search operations…"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="w-full sm:w-64"
            />
          )}
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
          <p className="text-sm text-muted-foreground">No operations are currently running.</p>
        </div>
      )}
      <Sheet
        open={isInspectorOpen}
        onOpenChange={(open) => {
          setIsInspectorOpen(open);
          if (!open) setInspectorOperation(null);
        }}
      >
        <SheetContent className="sm:max-w-md">
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
          {operation.class ?? 'Operation'} · {operation.status}
        </SheetDescription>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
        <MetadataSection title="Metadata" metadata={operation.metadata} />
      </div>
    </>
  );
}

function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return (
    !!obj &&
    typeof obj === 'object' &&
    Object.prototype.toString.call(obj) === '[object Object]'
  );
}

function MetadataSection({ title, metadata }: { title: string; metadata: unknown }) {
  if (
    !metadata ||
    (isPlainObject(metadata) && Object.keys(metadata).length === 0)
  ) {
    return null;
  }

  const entries = (
    isPlainObject(metadata)
      ? Object.entries(metadata)
      : [['value', metadata]]
  ) as [string, unknown][];

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase text-muted-foreground">{title}</p>
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

function KeyValueCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 rounded-md border border-white/5 bg-zinc-900/70 px-3 py-2">
      <p className="text-[10px] font-medium uppercase text-muted-foreground tracking-wide">
        {label}
      </p>
      <div className="text-xs text-white wrap-break-word">{children}</div>
    </div>
  );
}

function renderValue(value: unknown): React.ReactNode {
  if (value === null || typeof value === 'undefined') return '—';
  if (typeof value === 'string' || typeof value === 'number') return value.toString();
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    return (
      <ul className="list-disc pl-4 space-y-1">
        {value.map((item, idx) => (
          <li key={idx} className="wrap-break-word">
            {renderValue(item)}
          </li>
        ))}
      </ul>
    );
  }
  if (isPlainObject(value)) {
    return (
      <div className="space-y-2 pl-1">
        {Object.entries(value).map(([k, v]) => (
          <KeyValueCard key={`nested-${k}`} label={k}>
            {renderValue(v)}
          </KeyValueCard>
        ))}
      </div>
    );
  }
  return <span>{String(value)}</span>;
}
