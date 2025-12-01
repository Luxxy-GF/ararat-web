import type { InstancesResponse } from '../_lib/instances.d';
import useSWR from 'swr';
import { buildApiPath } from '@/app/_lib/url';

const fetcher = (...args: Parameters<typeof fetch>) =>
  fetch(...args)
    .then((res) => res.json())
    .then((data: InstancesResponse) => data.metadata);

export function useInstances(project?: string | null) {
  const url = buildApiPath('/1.0/instances', {
    project: project ?? null,
    params: { recursion: 2 },
  });
  return useSWR(url, fetcher);
}
