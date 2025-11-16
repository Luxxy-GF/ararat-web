export interface IncusOperation {
  id: string;
  class?: string;
  description?: string;
  status: string;
  status_code?: number;
  created_at?: string;
  updated_at?: string;
  metadata?: unknown;
}
