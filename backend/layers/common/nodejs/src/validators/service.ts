import { z } from 'zod';
import { emailSchema } from './common';

export const createServiceSchema = z.object({
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
  icon: z
    .string()
    .min(1, 'Icon is required')
    .max(100)
    .trim(),
  features: z.array(z.string().max(500)).max(20).default([]),
  pricing: z
    .object({
      type: z.enum(['fixed', 'hourly', 'project', 'custom']),
      amount: z.number().min(0).optional(),
      currency: z.string().length(3).default('USD'),
    })
    .optional(),
  isActive: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

export const updateServiceSchema = createServiceSchema.partial();

export const createServiceRequestSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description is too long')
    .trim(),
  requirements: z.string().max(5000).optional(),
  budget: z.string().max(100).optional(),
  timeline: z.string().max(200).optional(),
});

export const updateServiceRequestSchema = z.object({
  status: z
    .enum([
      'pending',
      'in_review',
      'approved',
      'in_progress',
      'completed',
      'cancelled',
    ])
    .optional(),
  adminNotes: z.string().max(5000).optional(),
});

export const createLeadSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name is too long')
    .trim(),
  email: emailSchema,
  phone: z.string().max(20).optional(),
  company: z.string().max(200).optional(),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(5000, 'Message is too long')
    .trim(),
  source: z
    .string()
    .max(100)
    .default('website')
    .trim(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type CreateServiceRequestInput = z.infer<typeof createServiceRequestSchema>;
export type UpdateServiceRequestInput = z.infer<typeof updateServiceRequestSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
