"use client";

import {
  useConfigurableOptions,
  useServerConfiguration,
} from "@/lib/swr/incus/server";
import { ConfigurableOptions, Server } from "@/lib/incus/types/server";
import dynamic from "next/dynamic";
import React, { createContext } from "react";
import { Spinner } from "../ui/spinner";
import { ErrorResponse } from "@/lib/incus/types/response";
import { KeyedMutator } from "swr";

export const ServerConfigurationContext = createContext({
  data: undefined as Server | undefined,
  isLoading: true,
  isValidating: true,
  error: undefined as ErrorResponse<unknown> | undefined,
  mutate: undefined as KeyedMutator<Server> | undefined,
});

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

export const ConfigurableOptionsContext = createContext({
  data: undefined as ConfigurableOptions | undefined,
  isLoading: true,
  isValidating: true,
  error: undefined as ErrorResponse<unknown> | undefined,
  mutate: undefined as KeyedMutator<ConfigurableOptions> | undefined,
});

export function ConfigurableOptionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isValidating, data, error, mutate } =
    useConfigurableOptions();
  return (
    <ConfigurableOptionsContext.Provider
      value={{ isLoading, isValidating, data, error, mutate }}
    >
      {children}
    </ConfigurableOptionsContext.Provider>
  );
}
