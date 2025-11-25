import { jsonFetcher } from "./fetcher";
import type { ConfigurableOptions, Server, ConfigOption } from "./server.d";

export async function getServerConfiguration() {
  return jsonFetcher("/1.0").then((data) => data.metadata as Server);
}

export async function getConfigurableOptions() {
  return jsonFetcher("/1.0/metadata/configuration").then(
    (data) => {
      const config = data.metadata as ConfigurableOptions;
      processConfigurableOptions(config);
      return config;
    }
  );
}

function processConfigurableOptions(config: ConfigurableOptions) {
  // Helper to process a single option
  const processOption = (option: ConfigOption) => {
    const textToCheck = [
      option.condition,
      option.shortdesc,
      option.longdesc
    ].filter(Boolean).join(" ").toLowerCase();

    // Determine supported types
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

  // Traverse the structure
  // 1. Instance configs (flat objects with keys array)
  if (config.configs.instance) {
    Object.values(config.configs.instance).forEach((category: any) => {
      if (category.keys) {
        category.keys.forEach((keyObj: any) => {
          Object.values(keyObj).forEach((opt: any) => processOption(opt));
        });
      }
    });
  }

  // 2. Device configs (nested under devices -> type -> keys)
  if (config.configs.devices) {
    Object.values(config.configs.devices).forEach((deviceType: any) => {
      if (deviceType.keys) {
        deviceType.keys.forEach((keyObj: any) => {
          Object.values(keyObj).forEach((opt: any) => processOption(opt));
        });
      }
    });
  }

  // Process other top-level configs if they follow the same pattern
  // For now, focusing on instance and devices as requested
}
