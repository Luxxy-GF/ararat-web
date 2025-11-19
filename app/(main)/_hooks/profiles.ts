import { getProfiles } from "../_lib/profiles";
import useSWR, { mutate } from "swr";

export function useProfiles() {
  const result = useSWR("/1.0/profiles?recursion=1", getProfiles);
  result.data?.map((result) => mutate(`/1.0/profiles/${result.name}`, result));
  return result;
}
