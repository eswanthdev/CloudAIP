import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

export function success<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  meta?: Record<string, unknown>
): Response {
  const body: SuccessResponse<T> = { success: true, data };
  if (message) body.message = message;
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

export function error(
  res: Response,
  message: string,
  statusCode = 500,
  details?: unknown
): Response {
  const body: ErrorResponse = { success: false, error: message };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
}
