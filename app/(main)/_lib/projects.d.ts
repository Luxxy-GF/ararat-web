import { StandardResponse } from "../../../app/_lib/response";

export interface Project {
  name: string;
  description?: string;
  config: Record<string, string>;
  used_by?: string[];
  status?: string;
  features?: Record<string, boolean>;
  locations?: string[];
}

export type ProjectsMetadata = Project[];

export type ProjectsResponse = StandardResponse<ProjectsMetadata>;
