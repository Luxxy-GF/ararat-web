import type { IncusOperation } from '@/app/(main)/operations/_lib/operations.d';

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

export async function cancelOperation(id: string) {
  const res = await fetch(`/1.0/operations/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Unable to cancel ${id}: ${res.status}`);
  }
}

export async function fetchOperationsList(): Promise<IncusOperation[]> {
  const response = await fetch('/1.0/operations?recursion=1', {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  const json = (await response.json()) as OperationsResponse;
  return resolveOperations(json);
}

async function resolveOperations(payload: OperationsResponse): Promise<IncusOperation[]> {
  const raw = payload?.metadata;
  if (Array.isArray(raw)) {
    return raw as IncusOperation[];
  }
  if (raw && typeof raw === 'object') {
    if ('id' in raw && 'status' in raw) {
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
        typeof entry === 'object' && entry !== null && 'status' in entry && 'id' in entry
    );
    if (flattenedObjects.length) {
      return flattenedObjects;
    }
    const stringPaths = buckets.filter((entry): entry is string => typeof entry === 'string');
    const uniquePaths = Array.from(new Set(stringPaths));
    if (!uniquePaths.length) return [];
    const details = await Promise.all(
      uniquePaths.map(async (path) => {
        const detailRes = await fetch(path, { cache: 'no-store' });
        if (!detailRes.ok) {
          throw new Error(`Unable to fetch operation ${path}: ${detailRes.status}`);
        }
        const detailJson = (await detailRes.json()) as OperationDetailResponse;
        return detailJson.metadata;
      })
    );
    return details;
  }
  return [];
}
