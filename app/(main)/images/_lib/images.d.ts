import { StandardResponse } from '../../../_lib/response';

export interface Image {
  aliases: {
    name: string;
    description?: string;
  }[];
  architecture: string;
  auto_update: boolean;
  cached: boolean;
  created_at: string;
  expires_at: string;
  filename: string;
  fingerprint: string;
  last_used_at: string;
  profiles: string[];
  project: string;
  properties: {
    os: string;
    release: string;
    variant: string;
  };
  public: boolean;
  size: number;
  type: string;
  update_source?: {
    alias: string;
    certificate: string;
    image_type: string;
    protocol: string;
    server: string;
  };
  uploaded_at: string;
}

export type ImagesMetadata = Image[];

export type ImagesResponse = StandardResponse<ImagesMetadata>;
