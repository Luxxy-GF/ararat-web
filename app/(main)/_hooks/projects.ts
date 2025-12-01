import useSWR from 'swr';
import { getProjects } from '@/app/(main)/_lib/projects';

export function useProjects() {
  return useSWR('/1.0/projects?recursion=1', getProjects);
}
