import { jsonFetcher } from '../../_lib/fetcher';
import type { ProjectsMetadata } from './projects.d';

export async function getProjects() {
  return jsonFetcher('/1.0/projects?recursion=1').then((data) => data.metadata as ProjectsMetadata);
}
