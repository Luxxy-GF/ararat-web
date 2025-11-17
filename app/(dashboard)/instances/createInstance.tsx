"use client";

import { ServerConfigMetadataContext } from "@/components/context/serverConfigMetadata";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { use, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import ImageSelector, { SelectableImage } from "./imageSelector";

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
  // only letters, numbers, and ashes. cannot start with digit or dash. name must not end with dash
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
export default function CreateInstance({ className }: { className?: string }) {
  const { data } = use(ServerConfigMetadataContext);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
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
  console.log(data?.configs);
  return (
    <div className={className}>
      <Dialog>
        <Form {...form}>
          <form>
            <DialogTrigger asChild>
              <Button
                className={className}
                onClick={() => {
                  console.log(data);
                }}
              >
                Create Instance
              </Button>
            </DialogTrigger>
            <DialogContent
              className={`${
                selectingImage
                  ? "max-h-screen w-full sm:max-w-5xl flex flex-col"
                  : "min-w-xs min-h-0"
              } transition-all duration-200`}
            >
              <DialogHeader className="flex-shrink-0">
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
                    className="w-full flex-shrink-0"
                    defaultValue="properties"
                  >
                    <TabsTrigger value="properties">Properties</TabsTrigger>
                    <TabsTrigger value="source">Source</TabsTrigger>
                  </TabsList>
                  <TabsContent
                    value="properties"
                    className="overflow-auto flex-1 min-h-0"
                  >
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instance Name</FormLabel>
                            <FormControl>
                              <Input
                                required={true}
                                placeholder="example-instance"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instance Description</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="My incredible instance"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                      />
                    ) : null}
                  </TabsContent>
                </Tabs>
              </div>
              <DialogFooter className="flex-shrink-0">
                <Button type="submit" disabled={true}>
                  Create Instance
                </Button>
              </DialogFooter>
            </DialogContent>
          </form>
        </Form>
      </Dialog>
    </div>
  );
}
