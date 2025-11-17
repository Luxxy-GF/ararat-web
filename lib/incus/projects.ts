import { jsonFetcher } from "./fetcher";
import { ProjectsMetadata } from "./types/projects";

export async function getProjects() {
  return jsonFetcher("/1.0/projects?recursion=1").then(
    (data) => data.metadata as ProjectsMetadata
  );
}
