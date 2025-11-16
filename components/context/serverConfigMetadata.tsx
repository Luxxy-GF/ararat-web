"use client";

import { useServerConfigurationMetadata } from "@/lib/swr/incus/server";
import { ServerConfigurationMetadata } from "@/types/incus/server";
import { createContext } from "react";

export const ServerConfigMetadataContext = createContext({
  data: null as ServerConfigurationMetadata | null,
  isLoading: true,
  isValidating: true,
  error: null as Error | null,
});

export default function ServerConfigMetadataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, isLoading, isValidating, error } =
    useServerConfigurationMetadata();
  return (
    <ServerConfigMetadataContext.Provider
      value={{
        data: data,
        isLoading: isLoading,
        isValidating: isValidating,
        error: error,
      }}
    >
      {children}
    </ServerConfigMetadataContext.Provider>
  );
}
