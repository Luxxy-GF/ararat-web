"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  use,
} from "react";
import { useProjects } from "@/app/(main)/_hooks/projects";
import type { Project } from "@/app/(main)/_lib/projects.d";
import { mutate } from "swr";
import IsClientContext from "@/app/_context/isClient";

export const ALL_PROJECTS_VALUE = "all";
const STORAGE_KEY = "ararat-selected-project";

interface ProjectsContextValue {
  projects: Project[];
  currentProject: string;
  effectiveProject: string | null;
  setProject: (projectName: string) => void;
  isLoading: boolean;
  isValidating: boolean;
  error: Error | null;
}

const ProjectsContext = createContext<ProjectsContextValue>({
  projects: [],
  currentProject: ALL_PROJECTS_VALUE,
  effectiveProject: null,
  setProject: () => {},
  isLoading: true,
  isValidating: true,
  error: null,
});
export default ProjectsContext;
export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const isClient = use(IsClientContext);
  const { data, isLoading, isValidating, error } = useProjects();
  useEffect(() => {
    if (data && !isValidating) {
      for (const project of data) {
        mutate(`/1.0/projects/${project.name}`, project);
      }
    }
  }, [data, isValidating]);
  const [storedProject, setStoredProject] = useState<string>(() => {
    if (typeof window === "undefined") return ALL_PROJECTS_VALUE;
    return window.localStorage.getItem(STORAGE_KEY) ?? ALL_PROJECTS_VALUE;
  });

  const currentProject = useMemo(() => {
    if (
      storedProject === ALL_PROJECTS_VALUE ||
      data?.some((project) => project.name === storedProject)
    ) {
      return storedProject;
    }
    return data?.[0]?.name ?? ALL_PROJECTS_VALUE;
  }, [data, storedProject]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, currentProject);
  }, [currentProject]);

  const setProject = useCallback((projectName: string) => {
    setStoredProject(projectName);
  }, []);

  const value = useMemo(() => {
    const effectiveProject =
      currentProject === ALL_PROJECTS_VALUE ? null : currentProject;
    return {
      projects: data ?? [],
      currentProject,
      effectiveProject,
      setProject,
      isLoading: !isClient || isLoading,
      isValidating: !isClient || isValidating,
      error: error ?? null,
    };
  }, [
    currentProject,
    data,
    error,
    isLoading,
    isValidating,
    setProject,
    isClient,
  ]);

  return <ProjectsContext value={value}>{children}</ProjectsContext>;
}
