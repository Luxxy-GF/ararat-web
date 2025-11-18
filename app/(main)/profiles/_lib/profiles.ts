import { jsonFetcher } from "@/app/_lib/fetcher";
import type { Profile } from "./profiles.d";

export async function getProfiles() {
  return jsonFetcher("/1.0/profiles?recursion=1").then(
    (data) => data.metadata as Profile[]
  );
}
