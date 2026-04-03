import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens'),
  description: z.string().min(1, 'Description is required'),
  shortDescription: z.string().min(1).max(500),
  thumbnail: z.string().url().optional(),
  category: z.enum([
    'cloud-computing',
    'devops',
    'cybersecurity',
    'data-engineering',
    'ai-ml',
    'software-development',
  ]),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  price: z.number().int().min(0, 'Price must be non-negative'),
  duration: z.number().min(0),
  tags: z.array(z.string()).optional().default([]),
});

export const updateCourseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens')
    .optional(),
  description: z.string().min(1).optional(),
  shortDescription: z.string().min(1).max(500).optional(),
  thumbnail: z.string().url().optional(),
  category: z
    .enum([
      'cloud-computing',
      'devops',
      'cybersecurity',
      'data-engineering',
      'ai-ml',
      'software-development',
    ])
    .optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  price: z.number().int().min(0).optional(),
  duration: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
});
