"use client";

import * as React from "react";
import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/_components/ui/tabs";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useConfigurableOptions } from "@/app/_hooks/server";
import type { Device } from "@/app/(main)/instances/_lib/instances.d";
import type { ConfigOption } from "@/app/_lib/server.d";

/**
 * Props for the Devices component
 */
export interface DevicesProps {
  /** Local devices that can be modified */
  devices: Record<string, Device>;
  /** Devices inherited from profiles (read-only, shown with dashed border) */
  inheritedDevices?: Record<string, Device>;
  /** Callback when local devices change */
  onDevicesChange?: (devices: Record<string, Device>) => void;
  /** Whether the component is in read-only mode */
  readonly?: boolean;
}

/**
 * Supported device types according to Incus API
 * @see https://linuxcontainers.org/incus/docs/main/reference/devices/
 */
const DEVICE_TYPES = [
  { value: "disk", label: "Disks", icon: "💾" },
  { value: "nic_bridged", label: "Networks", icon: "🌐" },
  { value: "gpu_physical", label: "GPUs", icon: "🎮" },
  { value: "proxy", label: "Proxies", icon: "🔄" },
];

interface DeviceEditorProps {
  deviceType: string;
  devices: Record<string, Device>;
  inheritedDevices: Record<string, Device>;
  deviceConfig?: { keys: Array<Record<string, ConfigOption>> };
  onAddDevice: (name: string, device: Device) => void;
  onRemoveDevice: (name: string) => void;
  readonly?: boolean;
}

function DeviceEditor({
  deviceType,
  devices,
  inheritedDevices,
  deviceConfig,
  onAddDevice,
  onRemoveDevice,
  readonly,
}: DeviceEditorProps) {
  const [newDeviceName, setNewDeviceName] = React.useState("");
  const [deviceProperties, setDeviceProperties] = React.useState<
    Record<string, string>
  >({});

  // Filter devices by type
  const filteredDevices = React.useMemo(() => {
    const allDevices = { ...inheritedDevices, ...devices };
    return Object.entries(allDevices).filter(
      ([, device]) => device.type === deviceType
    );
  }, [devices, inheritedDevices, deviceType]);

  const isInherited = (deviceName: string) => {
    return deviceName in inheritedDevices && !(deviceName in devices);
  };

  const isOverridden = (deviceName: string) => {
    return deviceName in inheritedDevices && deviceName in devices;
  };

  const handleAddDevice = () => {
    if (!newDeviceName) return;

    const newDevice: Device = {
      type: deviceType,
      ...deviceProperties,
    };

    onAddDevice(newDeviceName, newDevice);
    setNewDeviceName("");
    setDeviceProperties({});
  };

  const handlePropertyChange = (key: string, value: string) => {
    setDeviceProperties((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Get configuration fields for this device type
  const configFields = React.useMemo(() => {
    if (!deviceConfig?.keys) return [];
    const fields: Array<{ key: string; config: ConfigOption }> = [];
    deviceConfig.keys.forEach((keyObj) => {
      Object.entries(keyObj).forEach(([key, config]) => {
        fields.push({ key, config });
      });
    });
    return fields;
  }, [deviceConfig]);

  return (
    <div className="flex flex-col gap-4">
      {/* Existing Devices */}
      <div className="flex flex-col gap-2">
        {filteredDevices.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            No {deviceType} devices configured
          </div>
        ) : (
          filteredDevices.map(([name, device]) => {
            const inherited = isInherited(name);
            const overridden = isOverridden(name);

            return (
              <Card key={name} className={inherited ? "border-dashed" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {name}
                        {inherited && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (inherited)
                          </span>
                        )}
                        {overridden && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (overridden)
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Type: {device.type}
                      </CardDescription>
                    </div>
                    {!readonly && !inherited && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveDevice(name)}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  {Object.entries(device).map(([key, value]) => {
                    if (key === "type") return null;
                    return (
                      <div key={key} className="flex justify-between gap-4">
                        <span className="text-muted-foreground">{key}:</span>
                        <span className="font-mono text-right break-all">
                          {value}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add New Device */}
      {!readonly && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Add {deviceType} Device
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`${deviceType}-name`}>Device Name</Label>
              <Input
                id={`${deviceType}-name`}
                placeholder="Enter device name"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
              />
            </div>

            {/* Show key configuration fields if available */}
            {configFields.length > 0 && (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                <div className="text-xs font-medium text-muted-foreground">
                  Configuration Options
                </div>
                {configFields.slice(0, 10).map(({ key, config }) => (
                  <div key={key} className="space-y-1">
                    <Label
                      htmlFor={`${deviceType}-${key}`}
                      className="text-xs"
                    >
                      {key}
                      {config.required === "yes" && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </Label>
                    {config.shortdesc && (
                      <p className="text-xs text-muted-foreground">
                        {config.shortdesc}
                      </p>
                    )}
                    <Input
                      id={`${deviceType}-${key}`}
                      placeholder={config.default || ""}
                      value={deviceProperties[key] || ""}
                      onChange={(e) =>
                        handlePropertyChange(key, e.target.value)
                      }
                      className="text-xs"
                    />
                  </div>
                ))}
                {configFields.length > 10 && (
                  <p className="text-xs text-muted-foreground">
                    Showing 10 of {configFields.length} available options
                  </p>
                )}
              </div>
            )}

            <Button
              onClick={handleAddDevice}
              disabled={!newDeviceName}
              className="w-full"
              size="sm"
            >
              <IconPlus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Devices({
  devices,
  inheritedDevices = {},
  onDevicesChange,
  readonly = false,
}: DevicesProps) {
  const [localDevices, setLocalDevices] = React.useState<
    Record<string, Device>
  >(devices);
  const { data: configurableOptions } = useConfigurableOptions();

  // Sync local state with prop changes
  React.useEffect(() => {
    setLocalDevices(devices);
  }, [devices]);

  const handleAddDevice = (name: string, device: Device) => {
    const updatedDevices = {
      ...localDevices,
      [name]: device,
    };

    setLocalDevices(updatedDevices);
    onDevicesChange?.(updatedDevices);
  };

  const handleRemoveDevice = (deviceName: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [deviceName]: _, ...rest } = localDevices;
    setLocalDevices(rest);
    onDevicesChange?.(rest);
  };

  return (
    <Tabs defaultValue="disk" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        {DEVICE_TYPES.map((type) => (
          <TabsTrigger key={type.value} value={type.value}>
            <span className="mr-1">{type.icon}</span>
            {type.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {DEVICE_TYPES.map((type) => (
        <TabsContent key={type.value} value={type.value} className="mt-4">
          <DeviceEditor
            deviceType={type.value}
            devices={localDevices}
            inheritedDevices={inheritedDevices}
            deviceConfig={configurableOptions?.configs?.devices?.[type.value]}
            onAddDevice={handleAddDevice}
            onRemoveDevice={handleRemoveDevice}
            readonly={readonly}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
