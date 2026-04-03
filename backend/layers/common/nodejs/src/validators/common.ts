import { z } from 'zod';

export const objectIdSchema = z
  .string()
  .min(1, 'ID is required')
  .max(64, 'ID is too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'ID contains invalid characters');

export const paginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 20;
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 1) return 20;
      if (num > 100) return 100;
      return num;
    }),
  cursor: z.string().optional(),
  sort: z
    .enum(['ASC', 'DESC', 'asc', 'desc'])
    .optional()
    .default('DESC')
    .transform((val) => val.toUpperCase() as 'ASC' | 'DESC'),
});

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email is too long')
  .transform((val) => val.toLowerCase().trim());

export const slugSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase alphanumeric with hyphens'
  );

export function parseBody<T>(body: string | undefined, schema: z.ZodType<T>): T {
  if (!body) {
    throw new z.ZodError([
      {
        code: 'custom',
        message: 'Request body is required',
        path: [],
      },
    ]);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new z.ZodError([
      {
        code: 'custom',
        message: 'Invalid JSON in request body',
        path: [],
      },
    ]);
  }

  return schema.parse(parsed);
}

export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }
  return formatted;
}
