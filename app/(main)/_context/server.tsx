"use client";
import type { ConfigurableOptions } from "@/app/_lib/server.d";
import { ErrorResponse } from "@/app/_lib/response";
import { KeyedMutator } from "swr";
import { createContext } from "react";
import { useConfigurableOptions } from "@/app/_hooks/server";

const ConfigurableOptionsContext = createContext({
  data: undefined as ConfigurableOptions | undefined,
  isLoading: true,
  isValidating: true,
  error: undefined as ErrorResponse<unknown> | undefined,
  mutate: undefined as KeyedMutator<ConfigurableOptions> | undefined,
});

export default ConfigurableOptionsContext;

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
