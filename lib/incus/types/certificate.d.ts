import { StandardResponse } from "./response";

export interface AddCertificateBody {
  certificate?: string;
  description?: string;
  name?: string;
  projects?: string[];
  restricted?: boolean;
  type: string;
}

export interface AddCertificateBodyPublic extends AddCertificateBody {
  token: boolean;
  trust_token: string;
}

export interface Certificate {
  name: string;
  type: string;
  restricted: boolean;
  projects: string[];
  description: string;
  fingerprint: string;
}
export type CertificateResponse = StandardResponse<Certificate>;
