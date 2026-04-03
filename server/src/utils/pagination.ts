export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(
  page?: string | number,
  limit?: string | number
): PaginationParams {
  const parsedPage = Math.max(1, Number(page) || 1);
  const parsedLimit = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (parsedPage - 1) * parsedLimit;

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip,
  };
}

export function paginationMeta(total: number, params: PaginationParams) {
  return {
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit),
    hasNextPage: params.page < Math.ceil(total / params.limit),
    hasPrevPage: params.page > 1,
  };
}
