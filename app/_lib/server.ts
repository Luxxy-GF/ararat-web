import { jsonFetcher } from "./fetcher";
import type { ConfigurableOptions, Server, ConfigOption } from "./server.d";

export async function getServerConfiguration() {
  return jsonFetcher("/1.0").then((data) => data.metadata as Server);
}

export async function getConfigurableOptions() {
  return jsonFetcher("/1.0/metadata/configuration").then((data) => {
    const config = data.metadata as ConfigurableOptions;
    processConfigurableOptions(config);
    return config;
  });
}

function processConfigurableOptions(config: ConfigurableOptions) {
  type OptionKeyGroup = Record<string, ConfigOption>;
  type OptionCategory = { keys?: OptionKeyGroup[] };
  type ConfigsShape = {
    instance?: Record<string, OptionCategory>;
    devices?: Record<string, OptionCategory>;
  };

  // Helper to process a single option
  const processOption = (option: ConfigOption) => {
    const textToCheck = [option.condition, option.shortdesc, option.longdesc]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    // NOTE: The following logic uses string matching on description fields to infer
    // supported instance types. This is brittle and may break if the description
    // formatting changes. If the API ever provides explicit metadata for supported types,
    // use that instead of this heuristic. See CodeQL warning for details.
    option.supported_types = ["container", "virtual-machine"];

    if (
      textToCheck.includes("(only for containers)") ||
      textToCheck.includes("(container only)") ||
      textToCheck.includes("containers only")
    ) {
      option.supported_types = ["container"];
    } else if (
      textToCheck.includes("(only for virtual machines)") ||
      textToCheck.includes("(vm only)") ||
      textToCheck.includes("virtual machines only") ||
      textToCheck.includes("vms only") ||
      textToCheck.includes("for vms")
    ) {
      option.supported_types = ["virtual-machine"];
    }

    // Determine required types
    option.required_for = [];
    if (option.required) {
      const req = option.required.toLowerCase();
      if (req === "yes" || req === "true") {
        option.required_for = ["container", "virtual-machine"];
      } else if (req.includes("container")) {
        option.required_for = ["container"];
      } else if (req.includes("virtual machine") || req.includes("vm")) {
        option.required_for = ["virtual-machine"];
      }
    }
  };

  const configs = config.configs as ConfigsShape;

  const traverseCategories = (collection?: Record<string, OptionCategory>) => {
    if (!collection) return;
    Object.values(collection).forEach((category) => {
      category.keys?.forEach((keyObj) => {
        Object.values(keyObj).forEach((opt) => processOption(opt));
      });
    });
  };

  // Traverse the structure
  // 1. Instance configs (flat objects with keys array)
  traverseCategories(configs.instance);

  // 2. Device configs (nested under devices -> type -> keys)
  traverseCategories(configs.devices);

  // Process other top-level configs if they follow the same pattern
  // For now, focusing on instance and devices as requested
}
