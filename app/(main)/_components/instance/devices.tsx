"use client";

import * as React from "react";
import { useProfiles } from "../../_hooks/profiles";
import Devices from "../devices";
import type { Device } from "../../instances/_lib/instances.d";

export interface InstanceDevicesProps {
  profiles: string[];
  devices?: Record<string, Device>;
  onDevicesChange?: (devices: Record<string, Device>) => void;
}

export default function InstanceDevices({
  profiles,
  devices = {},
  onDevicesChange,
}: InstanceDevicesProps) {
  const { data: profilesData, isLoading } = useProfiles(profiles);

  // Aggregate all inherited devices from profiles
  const inheritedDevices = React.useMemo(() => {
    if (!profilesData) return {};
    
    const inherited: Record<string, Device> = {};
    
    // Profiles are applied in order, so later profiles can override earlier ones
    profilesData.forEach((profile) => {
      if (profile.devices) {
        Object.entries(profile.devices).forEach(([name, device]) => {
          inherited[name] = device;
        });
      }
    });
    
    return inherited;
  }, [profilesData]);

  if (isLoading) {
    return <div>Loading devices...</div>;
  }

  return (
    <Devices
      devices={devices}
      inheritedDevices={inheritedDevices}
      onDevicesChange={onDevicesChange}
    />
  );
}
