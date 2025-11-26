"use client";

import { Button } from "@/app/_components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/_components/ui/tabs";
import { useState, useMemo, use, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import ImageSelector, { SelectableImage } from "./imageSelector";
import InstanceProperties from "@/app/(main)/instances/_components/properties";
import InstanceDevices from "./devices";
import type { Device } from "@/app/(main)/instances/_lib/instances.d";

import GeneralConfiguration from "./general-configuration";
import { useProfiles } from "@/app/(main)/_hooks/profiles";
import ProjectsContext from "@/app/(main)/_context/projects";
import { Spinner } from "@/app/_components/ui/spinner";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { mutate } from "swr";

// Helper function to convert instance config to YAML
function toYaml(obj: Record<string, unknown>, indent = 0): string {
  const pad = "  ".repeat(indent);
  let result = "";
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "object" && !Array.isArray(value)) {
      const nested = toYaml(value as Record<string, unknown>, indent + 1);
      if (nested.trim()) {
        result += `${pad}${key}:\n${nested}`;
      } else {
        result += `${pad}${key}: {}\n`;
      }
    } else if (Array.isArray(value)) {
      result += `${pad}${key}:\n`;
      value.forEach((item) => {
        if (typeof item === "string") {
          result += `${pad}  - ${item}\n`;
        } else {
          result += `${pad}  - ${JSON.stringify(item)}\n`;
        }
      });
    } else {
      result += `${pad}${key}: ${JSON.stringify(value)}\n`;
    }
  }
  return result;
}

// Helper function to parse YAML to object (simple parser for our use case)
function fromYaml(yaml: string): Record<string, unknown> {
  const lines = yaml.split("\n");
  const result: Record<string, unknown> = {};
  
  // First pass: identify all top-level keys and their values
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith("#")) {
      i++;
      continue;
    }

    // Match a key-value pair
    const keyMatch = line.match(/^([^:\s]+):\s*(.*)$/);
    if (!keyMatch) {
      i++;
      continue;
    }

    const key = keyMatch[1];
    const valueStr = keyMatch[2].trim();

    if (valueStr) {
      // Inline value
      try {
        result[key] = JSON.parse(valueStr);
      } catch {
        result[key] = valueStr;
      }
      i++;
    } else {
      // Check if this is an array or object
      i++;
      if (i < lines.length && lines[i].trim().startsWith("-")) {
        // Array
        const arr: unknown[] = [];
        while (i < lines.length && lines[i].trim().startsWith("-")) {
          const itemMatch = lines[i].match(/^\s*-\s*(.*)$/);
          if (itemMatch) {
            const itemValue = itemMatch[1].trim();
            try {
              arr.push(JSON.parse(itemValue));
            } catch {
              arr.push(itemValue);
            }
          }
          i++;
        }
        result[key] = arr;
      } else {
        // Nested object - parse indented lines
        const obj: Record<string, unknown> = {};
        while (i < lines.length) {
          const nestedLine = lines[i];
          if (!nestedLine.trim()) {
            i++;
            continue;
          }
          // Check if still indented (belongs to this object)
          if (!nestedLine.startsWith("  ") && nestedLine.trim()) {
            break;
          }
          const nestedMatch = nestedLine.match(/^\s+([^:\s]+):\s*(.*)$/);
          if (nestedMatch) {
            const nestedKey = nestedMatch[1];
            const nestedValue = nestedMatch[2].trim();
            try {
              obj[nestedKey] = JSON.parse(nestedValue);
            } catch {
              obj[nestedKey] = nestedValue;
            }
          }
          i++;
        }
        result[key] = obj;
      }
    }
  }

  return result;
}

const sourceSchema = z
  .object({
    type: z.enum(["image", "none"]),
    fingerprint: z.string().optional(),
    alias: z.string().optional(),
    server: z.string().optional(),
    mode: z.literal("pull").optional(),
    protocol: z.enum(["simplestreams", "oci"]).optional(),
  })
  .refine(
    (data) => {
      if (data.type === "none") {
        return true;
      }
      if (data.fingerprint) {
        return true;
      }
      return Boolean(data.mode && data.server && data.alias && data.protocol);
    },
    {
      message: "Select an image to continue",
      path: ["alias"],
    }
  );

const formSchema = z.object({
  // only letters, numbers, and dashes. cannot start with digit or dash. name must not end with dash
  name: z
    .string()
    .min(3, "Instance name must be at least 3 characters long")
    .max(50, "Instance name must be at most 50 characters long")
    .regex(
      /^[a-zA-Z][a-zA-Z0-9-]*[a-zA-Z0-9]$/,
      "Instance name must start with a letter and can only contain letters, numbers, and dashes. It cannot end with a dash."
    ),
  description: z.string().optional(),
  ephemeral: z.boolean().optional(),
  source: sourceSchema,
});

// Helper to check if root disk is valid
function isValidRootDisk(
  devices: Record<string, Device>,
  inheritedDevices: Record<string, Device>
): boolean {
  const allDevices = { ...inheritedDevices, ...devices };
  const rootDisk = Object.values(allDevices).find(
    (device) => device.type === "disk" && device.path === "/"
  );
  return rootDisk !== undefined && !!rootDisk.pool;
}

// Create instance API call
async function createInstance(
  payload: Record<string, unknown>,
  project: string | null
): Promise<{ operation?: string; error?: string }> {
  const params = new URLSearchParams();
  if (project && project !== "all") {
    params.set("project", project);
  }
  const url = `/1.0/instances${params.toString() ? `?${params.toString()}` : ""}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (data.type === "error") {
    return { error: data.error || data.metadata?.error || "Failed to create instance" };
  }
  return { operation: data.operation };
}

export default function CreateInstance({ className }: { className?: string }) {
  const { effectiveProject } = use(ProjectsContext);
  const { resolvedTheme } = useTheme();
  const [profilesSelected, setProfilesSelected] = useState<string[]>([
    "default",
  ]);
  const [instanceType, setInstanceType] = useState<
    "virtual-machine" | "container"
  >("container");
  const [devices, setDevices] = useState<Record<string, Device>>({});
  const [config, setConfig] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [yamlError, setYamlError] = useState<string | null>(null);

  const { data: profiles } = useProfiles();

  // Aggregate inherited devices from profiles
  const inheritedDevices = useMemo(() => {
    if (!profiles) return {};
    const inherited: Record<string, Device> = {};
    const profileMap = new Map(profiles.map((p) => [p.name, p]));

    for (const profileName of profilesSelected) {
      const profile = profileMap.get(profileName);
      if (profile?.devices) {
        Object.entries(profile.devices).forEach(([name, device]) => {
          inherited[name] = device;
        });
      }
    }
    return inherited;
  }, [profiles, profilesSelected]);

  // Correct implementation using useMemo
  const memoizedExpandedConfig = useMemo(() => {
    let result: Record<string, string> = {};
    if (!profiles || profiles.length === 0) return result;

    const profileMap = new Map(profiles.map((p) => [p.name, p]));

    for (const profileName of profilesSelected) {
      const profile = profileMap.get(profileName);
      if (profile?.config) {
        result = { ...result, ...profile.config };
      }
    }

    return result;
  }, [profiles, profilesSelected]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: undefined,
      ephemeral: undefined,
      source: {
        type: "image",
        fingerprint: undefined,
        alias: undefined,
        server: undefined,
        mode: undefined,
        protocol: undefined,
      },
    },
  });

  const [currentTab, setCurrentTab] = useState("properties");
  const sourceType = useWatch({
    control: form.control,
    name: "source.type",
  });
  const selectingImage = sourceType === "image" && currentTab === "source";
  const [selectedImage, setSelectedImage] = useState<SelectableImage | null>(
    null
  );

  const resetSourceFields = () => {
    form.setValue("source.fingerprint", undefined, { shouldDirty: true });
    form.setValue("source.mode", undefined, { shouldDirty: true });
    form.setValue("source.server", undefined, { shouldDirty: true });
    form.setValue("source.alias", undefined, { shouldDirty: true });
    form.setValue("source.protocol", undefined, { shouldDirty: true });
  };

  const handleImageSelect = (image: SelectableImage) => {
    setSelectedImage(image);
    resetSourceFields();
    if (image.local && image.fingerprint) {
      form.setValue("source.fingerprint", image.fingerprint, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else if (image.remote) {
      form.setValue("source.mode", "pull", { shouldDirty: true });
      form.setValue("source.server", image.remote.server, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("source.alias", image.remote.alias, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("source.protocol", image.remote.protocol, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    form.trigger("source");
  };

  // Check if form is valid for submission
  const formValues = useWatch({ control: form.control });
  const hasValidRootDisk = useMemo(
    () => isValidRootDisk(devices, inheritedDevices),
    [devices, inheritedDevices]
  );

  const isFormValid = useMemo(() => {
    // Check form validation state
    const formState = form.formState;
    if (!formState.isValid) return false;

    // Check root disk
    if (!hasValidRootDisk) return false;

    // Check source - either none or valid image selection
    const source = formValues.source;
    if (source?.type === "image") {
      if (!source.fingerprint && !source.alias) return false;
    }

    return true;
  }, [form.formState, formValues, hasValidRootDisk]);

  // Build the instance payload
  const buildPayload = useCallback(() => {
    const values = form.getValues();
    const source: Record<string, unknown> = { type: values.source.type };

    if (values.source.type === "image") {
      if (values.source.fingerprint) {
        source.fingerprint = values.source.fingerprint;
      } else if (values.source.alias) {
        source.alias = values.source.alias;
        source.server = values.source.server;
        source.mode = values.source.mode;
        source.protocol = values.source.protocol;
      }
    }

    const payload: Record<string, unknown> = {
      name: values.name,
      type: instanceType,
      profiles: profilesSelected,
      source,
      devices,
    };

    if (values.description) {
      payload.description = values.description;
    }

    if (values.ephemeral !== undefined) {
      payload.ephemeral = values.ephemeral;
    }

    if (Object.keys(config).length > 0) {
      payload.config = config;
    }

    return payload;
  }, [form, instanceType, profilesSelected, devices, config]);

  // Generate YAML from current state
  const yamlContent = useMemo(() => {
    const payload = buildPayload();
    return toYaml(payload);
  }, [buildPayload]);

  // Handle YAML changes
  const handleYamlChange = useCallback(
    (value: string | undefined) => {
      if (!value) return;
      setYamlError(null);

      try {
        const parsed = fromYaml(value);

        // Update form values from YAML
        if (typeof parsed.name === "string") {
          form.setValue("name", parsed.name, { shouldValidate: true });
        }
        if (typeof parsed.description === "string") {
          form.setValue("description", parsed.description);
        }
        if (typeof parsed.ephemeral === "boolean") {
          form.setValue("ephemeral", parsed.ephemeral);
        }
        if (
          parsed.type === "container" ||
          parsed.type === "virtual-machine"
        ) {
          setInstanceType(parsed.type);
        }
        if (Array.isArray(parsed.profiles)) {
          setProfilesSelected(parsed.profiles as string[]);
        }
        if (parsed.devices && typeof parsed.devices === "object") {
          setDevices(parsed.devices as Record<string, Device>);
        }
        if (parsed.config && typeof parsed.config === "object") {
          setConfig(parsed.config as Record<string, string>);
        }
        if (parsed.source && typeof parsed.source === "object") {
          const source = parsed.source as Record<string, unknown>;
          if (source.type === "none" || source.type === "image") {
            form.setValue("source.type", source.type, { shouldValidate: true });
            if (source.type === "image") {
              if (typeof source.fingerprint === "string") {
                form.setValue("source.fingerprint", source.fingerprint, {
                  shouldValidate: true,
                });
              }
              if (typeof source.alias === "string") {
                form.setValue("source.alias", source.alias, {
                  shouldValidate: true,
                });
              }
              if (typeof source.server === "string") {
                form.setValue("source.server", source.server);
              }
              if (source.mode === "pull") {
                form.setValue("source.mode", source.mode);
              }
              if (
                source.protocol === "simplestreams" ||
                source.protocol === "oci"
              ) {
                form.setValue("source.protocol", source.protocol);
              }
            }
          }
        }
      } catch {
        setYamlError("Invalid YAML syntax");
      }
    },
    [form]
  );

  // Handle form submission
  const handleSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) {
      toast.error("Please fix the form errors before submitting");
      return;
    }

    if (!hasValidRootDisk) {
      toast.error("A valid root disk with a storage pool is required");
      setCurrentTab("devices");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      const result = await createInstance(payload, effectiveProject);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Instance "${form.getValues().name}" creation started`);
        // Invalidate the instances list
        mutate(
          (key) => typeof key === "string" && key.startsWith("/1.0/instances")
        );
        setDialogOpen(false);
        // Reset form
        form.reset();
        setDevices({});
        setConfig({});
        setSelectedImage(null);
        setProfilesSelected(["default"]);
        setInstanceType("container");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create instance"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <DialogTrigger asChild>
              <Button className={className}>Create Instance</Button>
            </DialogTrigger>
            <DialogContent
              className={`max-h-[90vh] w-full flex flex-col transition-all duration-200 ${
                selectingImage
                  ? "sm:max-w-5xl"
                  : currentTab === "devices" ||
                    currentTab === "general" ||
                    currentTab === "yaml"
                  ? "sm:max-w-6xl h-[90vh]"
                  : "sm:max-w-xl"
              }`}
            >
              <DialogHeader className="shrink-0">
                <DialogTitle>Create Instance</DialogTitle>
                <DialogDescription>Create a new instance</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <Tabs
                  className="w-full flex flex-col flex-1 min-h-0"
                  value={currentTab}
                  onValueChange={setCurrentTab}
                >
                  <TabsList
                    className="w-full shrink-0"
                    defaultValue="properties"
                  >
                    <TabsTrigger value="properties">Properties</TabsTrigger>
                    <TabsTrigger value="source">Source</TabsTrigger>
                    <TabsTrigger value="devices">Devices</TabsTrigger>
                    <TabsTrigger value="general">Configuration</TabsTrigger>
                    <TabsTrigger value="yaml">YAML</TabsTrigger>
                  </TabsList>
                  <TabsContent
                    value="properties"
                    className="overflow-auto flex-1 min-h-0 px-1"
                  >
                    <InstanceProperties
                      form={form}
                      profilesSelected={profilesSelected}
                      setProfilesSelected={setProfilesSelected}
                      instanceType={instanceType}
                      setInstanceType={setInstanceType}
                    />
                  </TabsContent>
                  <TabsContent
                    value="source"
                    className="overflow-auto flex-1 min-h-0"
                  >
                    <FormField
                      control={form.control}
                      name="source.type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source Type</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                if (value === "none") {
                                  setSelectedImage(null);
                                  resetSourceFields();
                                }
                              }}
                              value={field.value}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select source type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="image">Image</SelectItem>
                                <SelectItem value="none">None</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {selectingImage ? (
                      <ImageSelector
                        selectedImage={selectedImage}
                        onSelect={handleImageSelect}
                        instanceType={instanceType}
                      />
                    ) : null}
                  </TabsContent>
                  <TabsContent
                    value="devices"
                    className="flex-1 min-h-0 overflow-hidden"
                  >
                    <InstanceDevices
                      profiles={profilesSelected}
                      devices={devices}
                      onDevicesChange={setDevices}
                      instanceType={instanceType}
                    />
                  </TabsContent>
                  <TabsContent
                    value="general"
                    className="flex-1 min-h-0 overflow-hidden"
                  >
                    <GeneralConfiguration
                      config={config}
                      expandedConfig={memoizedExpandedConfig}
                      onConfigChange={setConfig}
                      instanceType={instanceType}
                    />
                  </TabsContent>
                  <TabsContent
                    value="yaml"
                    className="flex-1 min-h-0 overflow-hidden flex flex-col"
                  >
                    <p className="text-sm text-muted-foreground mb-2">
                      Edit the raw YAML configuration. Changes will be synced
                      with the form fields.
                    </p>
                    {yamlError && (
                      <p className="text-sm text-destructive mb-2">
                        {yamlError}
                      </p>
                    )}
                    <div className="flex-1 min-h-0 border rounded-md overflow-hidden">
                      <Editor
                        height="100%"
                        defaultLanguage="yaml"
                        value={yamlContent}
                        onChange={handleYamlChange}
                        theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          lineNumbers: "on",
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize: 2,
                        }}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              <DialogFooter className="shrink-0">
                <Button type="submit" disabled={!isFormValid || isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Creating...
                    </>
                  ) : (
                    "Create Instance"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </form>
        </Form>
      </Dialog>
    </div>
  );
}
