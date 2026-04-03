import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title is too long')
    .trim(),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase alphanumeric with hyphens'
    )
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description is too long')
    .trim(),
  shortDescription: z
    .string()
    .min(10, 'Short description must be at least 10 characters')
    .max(300, 'Short description is too long')
    .trim(),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(100)
    .trim(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  price: z.number().min(0, 'Price must be non-negative'),
  currency: z.string().length(3).default('USD'),
  thumbnailUrl: z.string().url().optional(),
  duration: z
    .string()
    .min(1, 'Duration is required')
    .max(50)
    .trim(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  prerequisites: z.array(z.string().max(200)).max(10).default([]),
  learningOutcomes: z.array(z.string().max(500)).max(20).default([]),
  isPublished: z.boolean().default(false),
});

export const updateCourseSchema = createCourseSchema.partial();

export const createModuleSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title is too long')
    .trim(),
  description: z
    .string()
    .max(2000, 'Description is too long')
    .default('')
    .trim(),
  order: z.number().int().min(0).optional(),
});

export const updateModuleSchema = createModuleSchema.partial();

export const createLessonSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title is too long')
    .trim(),
  description: z
    .string()
    .max(2000, 'Description is too long')
    .default('')
    .trim(),
  type: z.enum(['video', 'text', 'quiz', 'assignment']),
  order: z.number().int().min(0).optional(),
  duration: z
    .string()
    .max(50)
    .default('0m')
    .trim(),
  videoKey: z.string().max(500).optional(),
  content: z.string().max(50000).optional(),
  isFreePreview: z.boolean().default(false),
});

export const updateLessonSchema = createLessonSchema.partial();

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
