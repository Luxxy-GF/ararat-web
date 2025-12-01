// list of valid status codes

export type StatusCode =
  | 100
  | 101
  | 102
  | 103
  | 104
  | 105
  | 106
  | 107
  | 108
  | 109
  | 110
  | 111
  | 112
  | 113
  | 200
  | 400
  | 401;

export interface StandardResponse<T> {
  type: 'sync';
  status: string;
  status_code: StatusCode;
  metadata: T;
}

export interface BackgroundOperationResponse {
  type: 'async';
  status: string;
  status_code: number;
  operation: string;
  metadata: {
    id: string;
    class: 'websocket' | 'task' | 'token';
    created_at: string;
    updated_at: string;
    status: string;
    status_code: StatusCode;
    resources: object;
  };
}

export interface ErrorResponse<T> {
  type: 'error';
  error: string;
  error_code: number;
  metadata: T;
}
