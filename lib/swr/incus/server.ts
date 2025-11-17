import useSWR from "swr";
import {
  getConfigurableOptions,
  getServerConfiguration,
} from "@/lib/incus/server";

export function useServerConfiguration() {
  return useSWR("/1.0", getServerConfiguration);
}
export function useConfigurableOptions() {
  return useSWR("/1.0/metadata/configuration", getConfigurableOptions);
}
