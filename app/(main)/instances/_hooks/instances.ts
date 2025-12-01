import type { InstancesResponse } from '../_lib/instances.d';
import useSWR from 'swr';

const fetcher = (...args: Parameters<typeof fetch>) =>
  fetch(...args)
    .then((res) => res.json())
    .then((data: InstancesResponse) => data.metadata);

const buildInstancesPath = (project?: string | null) => {
  const params = new URLSearchParams({ recursion: '2' });
  if (project === 'all') {
    params.set('all-projects', 'true');
  } else if (project) {
    params.set('project', project);
  }
  return `/1.0/instances?${params.toString()}`;
};

export function useInstances(project?: string | null) {
  return useSWR(buildInstancesPath(project), fetcher);
}
