"use client";

import { useProfiles } from "../../_hooks/profiles";

export default function InstanceDevices({ profiles }: { profiles: string[] }) {
  const { data } = useProfiles(profiles);
  return <div>Instance Devices Component</div>;
}
