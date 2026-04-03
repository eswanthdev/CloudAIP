import { z } from 'zod';

export const createServiceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens'),
  description: z.string().min(1, 'Description is required'),
  shortDescription: z.string().min(1).max(500),
  category: z.string().min(1, 'Category is required'),
  icon: z.string().optional(),
  features: z.array(z.string()).optional().default([]),
  pricingType: z.enum(['fixed', 'hourly', 'custom', 'subscription']),
  price: z.number().min(0).optional(),
  order: z.number().int().min(0).optional().default(0),
});

export const createServiceRequestSchema = z.object({
  service: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid service ID'),
  message: z.string().min(1, 'Message is required').max(5000),
  budget: z.string().max(200).optional(),
  timeline: z.string().max(200).optional(),
});

export const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address'),
  company: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  spendRange: z.string().max(100).optional(),
  message: z.string().max(5000).optional(),
  contactMethod: z.string().max(50).optional(),
  source: z.enum(['website', 'referral', 'social', 'paid-ad', 'organic', 'other']).optional().default('website'),
});
