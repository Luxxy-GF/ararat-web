import { jsonFetcher } from "./fetcher";
import type { ConfigurableOptions, Server } from "./server.d";

export async function getServerConfiguration() {
  return jsonFetcher("/1.0").then((data) => data.metadata as Server);
}

export async function getConfigurableOptions() {
  return jsonFetcher("/1.0/metadata/configuration").then(
    (data) => data.metadata as ConfigurableOptions
  );
}
