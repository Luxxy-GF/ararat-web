import { ProjectsResponse } from "@/types/incus/projects";
import useSWR from "swr";

const fetcher = (...args: Parameters<typeof fetch>) =>
  fetch(...args)
    .then((res) => res.json())
    .then((data: ProjectsResponse) => data.metadata);

export function useProjects() {
  return useSWR("/1.0/projects?recursion=1", fetcher);
}
