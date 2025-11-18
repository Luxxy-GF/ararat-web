import { Device } from "./instances";

export interface Profile {
  name: string;
  description?: string;
  config: Record<string, string>;
  devices: Device[];
}
