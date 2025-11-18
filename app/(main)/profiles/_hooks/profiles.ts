import { getProfiles } from "../_lib/profiles";
import useSWR from "swr";

export function useProfiles() {
  return useSWR("/1.0/profiles?recursion=1", getProfiles);
}
