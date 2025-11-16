import { StandardResponse, StatusCode } from "./response";

export interface InstanceStateDiskUsage {
  usage?: number;
  usage_peak?: number;
  read?: number;
  write?: number;
  total?: number;
}

export interface InstanceStateMemory {
  usage?: number;
  usage_peak?: number;
  total?: number;
  swap_usage?: number;
  swap_usage_peak?: number;
}

export interface InstanceStateNetworkAddress {
  family: "inet" | "inet6" | string;
  address: string;
  scope?: string;
}

export interface InstanceStateNetworkInterface {
  addresses?: InstanceStateNetworkAddress[];
  host_name?: string;
  hwaddr?: string;
  mtu?: number;
  state?: string;
  type?: string;
}

export interface InstanceState {
  status: string;
  status_code: StatusCode;
  memory?: InstanceStateMemory;
  disk?: Record<string, InstanceStateDiskUsage>;
  network?: Record<string, InstanceStateNetworkInterface>;
  cpu?: {
    usage?: number;
  };
  pid?: number;
  processes?: number;
}

export interface InstanceSnapshot {
  name: string;
  created_at?: string;
  stateful?: boolean;
  size?: number;
  description?: string;
}

export interface Instance {
  name: string;
  description?: string;
  type: "container" | "virtual-machine" | string;
  status: string;
  status_code: StatusCode;
  architecture?: string;
  config: Record<string, string>;
  expanded_config: Record<string, string>;
  devices: Record<string, Record<string, string>>;
  expanded_devices: Record<string, Record<string, string>>;
  created_at?: string;
  last_used_at?: string;
  location?: string;
  project?: string;
  profiles?: string[];
  state?: InstanceState;
  snapshots?: InstanceSnapshot[];
}

export type InstancesMetadata = Instance[];

export type InstancesResponse = StandardResponse<InstancesMetadata>;
