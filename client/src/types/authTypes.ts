export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}
