import useSWR from "swr";
import { jsonFetcher } from "@/app/_lib/fetcher";

export interface NetworkAddress {
  family: string;
  address: string;
  netmask: string;
}

export interface Network {
  name: string;
  description: string;
  type: string;
  config: Record<string, string>;
  managed: boolean;
  status: string;
  locations?: string[];
  used_by?: string[];
}

export function useNetworks(project?: string | null) {
  const projectParam =
    project && project !== "all" ? `?project=${project}` : "";

  const fetcher = async (url: string): Promise<Network[]> => {
    const res = await jsonFetcher(url);
    // jsonFetcher returns StandardResponse | ErrorResponse; we need the metadata field
    // Assuming the successful shape has { metadata: T }
    // Cast defensively; caller handles undefined data if shape unexpected.
    return (res as any)?.metadata ?? [];
  };

  const { data, error, isLoading, isValidating, mutate } = useSWR<Network[]>(
    `/1.0/networks?recursion=1${projectParam}`,
    fetcher
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  };
}
