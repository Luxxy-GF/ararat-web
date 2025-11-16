"use client";

import { useServerConfiguration } from "@/lib/swr/incus/server";
import { Server } from "@/types/incus/server";
import dynamic from "next/dynamic";
import React, { createContext } from "react";
import { Spinner } from "../ui/spinner";
import { ThemeProvider } from "next-themes";

export const ServerConfigContext = createContext({
  data: null as Server | null,
  isLoading: true,
  isValidating: true,
  error: null as Error | null,
});

function ServerConfigProviderUndy({ children }: { children: React.ReactNode }) {
  const { isLoading, isValidating, data, error } = useServerConfiguration();

  return (
    <ServerConfigContext.Provider
      value={{ isLoading, isValidating, data, error }}
    >
      {children}
    </ServerConfigContext.Provider>
  );
}

const ServerConfigProvider = dynamic(
  () => Promise.resolve(ServerConfigProviderUndy),
  {
    ssr: false,
    loading: () => (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex h-screen">
          <div className="mx-auto my-auto">
            <Spinner className="size-8 mx-auto" />
            <p className="animate-pulse">Loading Configuration...</p>
          </div>
        </div>
      </ThemeProvider>
    ),
  }
);

export default ServerConfigProvider;
