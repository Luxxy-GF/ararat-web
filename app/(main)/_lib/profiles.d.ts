import type { Device } from '../instances/_lib/instances.d';

export interface Profile {
  name: string;
  description?: string;
  config: Record<string, string>;
  devices: Record<string, Device>;
}
