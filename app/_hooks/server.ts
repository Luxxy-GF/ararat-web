import useSWR from "swr";
import { getConfigurableOptions, getServerConfiguration } from "../_lib/server";

export function useServerConfiguration() {
  return useSWR("/1.0", getServerConfiguration);
}
export function useConfigurableOptions() {
  return useSWR("/1.0/metadata/configuration", getConfigurableOptions);
}
