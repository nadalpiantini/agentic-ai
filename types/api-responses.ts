export interface ApiSuccessResponse<T> {
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  error: string;
  code: number;
  details?: unknown;
}
