export interface ApiResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': process.env.CLIENT_URL || '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json',
};

export function success(
  statusCode: number,
  data: unknown,
  message?: string
): ApiResponse {
  const body: Record<string, unknown> = {
    success: true,
    data,
  };
  if (message) {
    body.message = message;
  }
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body),
  };
}

export function error(
  statusCode: number,
  message: string,
  errors?: unknown
): ApiResponse {
  const body: Record<string, unknown> = {
    success: false,
    message,
  };
  if (errors) {
    body.errors = errors;
  }
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body),
  };
}
