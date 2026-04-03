export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
  message?: string;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    stack?: string;
  };
  timestamp: string;
}

export interface ApiValidationError extends ApiError {
  error: {
    code: "VALIDATION_ERROR";
    message: string;
    details: Record<string, string[]>;
  };
}

export interface SortOptions {
  field: string;
  order: "asc" | "desc";
}

export interface FilterOptions {
  search?: string;
  sort?: SortOptions;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}
