"use client";

import { useServerConfiguration } from "@/app/_hooks/server";
import type { Server } from "@/app/_lib/server.d";
import dynamic from "next/dynamic";
import React, { createContext } from "react";
import { Spinner } from "../../app/_components/ui/spinner";
import { ErrorResponse } from "@/app/_lib/response";
import { KeyedMutator } from "swr";

const ServerConfigurationContext = createContext({
  data: undefined as Server | undefined,
  isLoading: true,
  isValidating: true,
  error: undefined as ErrorResponse<unknown> | undefined,
  mutate: undefined as KeyedMutator<Server> | undefined,
});

export default ServerConfigurationContext;

function ServerConfigProvider({ children }: { children: React.ReactNode }) {
  const { isLoading, isValidating, data, error, mutate } =
    useServerConfiguration();

  return (
    <ServerConfigurationContext.Provider
      value={{ isLoading, isValidating, data, error, mutate }}
    >
      {children}
    </ServerConfigurationContext.Provider>
  );
}

export const ServerConfigurationProvider = dynamic(
  () => Promise.resolve(ServerConfigProvider),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen">
        <div className="mx-auto my-auto">
          <Spinner className="size-8 mx-auto" />
          <p className="animate-pulse">Loading Server Configuration...</p>
        </div>
      </div>
    ),
  }
);
