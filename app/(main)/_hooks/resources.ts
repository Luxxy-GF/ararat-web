import useSWR from "swr";
import { getResources } from "../_lib/resources";

export function useResources() {
  return useSWR("/1.0/resources", getResources);
}
