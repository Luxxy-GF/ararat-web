import useSWR from "swr";
import { getProjects } from "@/lib/incus/projects";

export function useProjects() {
  return useSWR("/1.0/projects?recursion=1", getProjects);
}
