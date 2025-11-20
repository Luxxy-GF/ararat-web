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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import type { Device } from "@/app/(main)/instances/_lib/instances.d";

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
  { value: "disk", label: "Disk" },
  { value: "nic", label: "Network" },
  { value: "gpu", label: "GPU" },
  { value: "proxy", label: "Proxy" },
];

export default function Devices({
  devices,
  inheritedDevices = {},
  onDevicesChange,
  readonly = false,
}: DevicesProps) {
  const [localDevices, setLocalDevices] = React.useState<
    Record<string, Device>
  >(devices);
  const [newDeviceName, setNewDeviceName] = React.useState("");
  const [newDeviceType, setNewDeviceType] = React.useState<string>("disk");

  // Sync local state with prop changes
  React.useEffect(() => {
    setLocalDevices(devices);
  }, [devices]);

  // Combine inherited and local devices for display
  const allDevices = React.useMemo(() => {
    return { ...inheritedDevices, ...localDevices };
  }, [inheritedDevices, localDevices]);

  const handleAddDevice = () => {
    if (!newDeviceName || !newDeviceType) return;
    
    const updatedDevices = {
      ...localDevices,
      [newDeviceName]: {
        type: newDeviceType,
      },
    };
    
    setLocalDevices(updatedDevices);
    onDevicesChange?.(updatedDevices);
    setNewDeviceName("");
    setNewDeviceType("disk");
  };

  const handleRemoveDevice = (deviceName: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [deviceName]: _, ...rest } = localDevices;
    setLocalDevices(rest);
    onDevicesChange?.(rest);
  };

  const isInherited = (deviceName: string) => {
    return deviceName in inheritedDevices && !(deviceName in devices);
  };

  const isOverridden = (deviceName: string) => {
    return deviceName in inheritedDevices && deviceName in localDevices;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {Object.entries(allDevices).map(([name, device]) => {
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
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDevice(name)}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                {Object.entries(device).map(([key, value]) => {
                  if (key === "type") return null;
                  return (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-mono">{value}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!readonly && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Add Device</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Device name"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                className="flex-1"
              />
              <Select value={newDeviceType} onValueChange={setNewDeviceType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {DEVICE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddDevice}
                disabled={!newDeviceName || !newDeviceType}
                size="sm"
              >
                <IconPlus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
