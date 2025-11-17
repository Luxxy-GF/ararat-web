import { jsonFetcher } from "./fetcher";
import { ConfigurableOptions, Server } from "./types/server";

export async function getServerConfiguration() {
  return jsonFetcher("/1.0").then((data) => data.metadata as Server);
}

export async function getConfigurableOptions() {
  return jsonFetcher("/1.0/metadata/configuration").then(
    (data) => data.metadata as ConfigurableOptions
  );
}
