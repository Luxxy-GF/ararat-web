export interface StoragePool {
  name: string;
  description: string;
  driver: string;
  status: string;
  locations: string[];
  config: Record<string, string>;
  managed: boolean;
  used_by: string[];
}

export interface StorageVolume {
  name: string;
  description: string;
  type: string;
  content_type: string;
  config: Record<string, string>;
  location: string;
  used_by: string[];
}
