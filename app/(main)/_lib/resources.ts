import { jsonFetcher } from "@/app/_lib/fetcher";
import type { ResourcesResponse } from "./resources.d";

// Fetches /1.0/resources and returns the metadata (flattened) for convenience.
export async function getResources() {
  return jsonFetcher("/1.0/resources").then((data) => {
    // data.metadata contains the full object; we only type GPU portion currently.
    return data.metadata as ResourcesResponse;
  });
}
