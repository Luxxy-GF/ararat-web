"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useProjects } from "@/lib/swr/incus/projects";
import { Project } from "@/types/incus/projects";

export const ALL_PROJECTS_VALUE = "all";
const STORAGE_KEY = "ararat-selected-project";

export interface ProjectContextValue {
  projects: Project[];
  currentProject: string;
  effectiveProject: string | null;
  setProject: (name: string) => void;
  isLoading: boolean;
  isValidating: boolean;
  error: Error | null;
}

export const ProjectContext = createContext<ProjectContextValue>({
  projects: [],
  currentProject: ALL_PROJECTS_VALUE,
  effectiveProject: null,
  setProject: () => {},
  isLoading: true,
  isValidating: true,
  error: null,
});

export default function ProjectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, isLoading, isValidating, error } = useProjects();
  const [storedProject, setStoredProject] = useState<string>(() => {
    if (typeof window === "undefined") return ALL_PROJECTS_VALUE;
    return (
      window.localStorage.getItem(STORAGE_KEY) ?? ALL_PROJECTS_VALUE
    );
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

  const value = useMemo<ProjectContextValue>(() => {
    const effectiveProject =
      currentProject === ALL_PROJECTS_VALUE ? null : currentProject;
    return {
      projects: data ?? [],
      currentProject,
      effectiveProject,
      setProject,
      isLoading,
      isValidating,
      error: error ?? null,
    };
  }, [
    currentProject,
    data,
    error,
    isLoading,
    isValidating,
    setProject,
  ]);

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}
