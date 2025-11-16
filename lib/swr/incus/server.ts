import { Server, ServerConfigurationMetadata } from "@/types/incus/server";
import useSWR from "swr";
const fetcher = (...args: Parameters<typeof fetch>) =>
  fetch(...args)
    .then((res) => res.json())
    .then((data) => data.metadata);
export function useServerConfiguration() {
  const { data, error, isLoading, isValidating } = useSWR("/1.0", fetcher);
  return {
    data: data as Server | null,
    isLoading,
    isValidating,
    error,
  };
}

// TODO: Switch fetcher
export function useServerConfigurationMetadata() {
  const { data, error, isLoading, isValidating } = useSWR(
    "/1.0/metadata/configuration",
    fetcher
  );
  return {
    data: (data as ServerConfigurationMetadata | null) ?? null,
    isLoading,
    isValidating,
    error,
  };
}
