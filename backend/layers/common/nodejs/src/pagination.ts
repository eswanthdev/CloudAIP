import type { APIGatewayProxyEventV2 } from './types/api';

export interface PaginationParams {
  limit: number;
  cursor?: string;
  sortDirection: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  items: T[];
  count: number;
  nextCursor?: string;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(
  event: APIGatewayProxyEventV2
): PaginationParams {
  const params = event.queryStringParameters || {};

  let limit = parseInt(params.limit || String(DEFAULT_LIMIT), 10);
  if (isNaN(limit) || limit < 1) {
    limit = DEFAULT_LIMIT;
  }
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  let cursor: string | undefined;
  if (params.cursor) {
    try {
      cursor = params.cursor;
    } catch {
      cursor = undefined;
    }
  }

  const sortDirection =
    params.sort?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  return { limit, cursor, sortDirection };
}

export function decodeCursor(
  cursor: string
): Record<string, unknown> | undefined {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return undefined;
  }
}

export function encodeCursor(
  lastEvaluatedKey: Record<string, unknown>
): string {
  return Buffer.from(JSON.stringify(lastEvaluatedKey)).toString('base64url');
}

export function buildPaginatedResponse<T>(
  items: T[],
  lastEvaluatedKey?: Record<string, unknown>,
  count?: number
): PaginatedResponse<T> {
  const response: PaginatedResponse<T> = {
    items,
    count: count ?? items.length,
  };

  if (lastEvaluatedKey) {
    response.nextCursor = encodeCursor(lastEvaluatedKey);
  }

  return response;
}
