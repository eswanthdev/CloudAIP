import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

const createCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  subtitle: z.string().max(300).optional(),
  description: z.string().min(1, 'Description is required').max(5000),
  shortDescription: z.string().max(500).optional(),
  category: z.string().min(1, 'Category is required').max(100),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  price: z.number().min(0).optional().default(0),
  currency: z.string().max(3).optional().default('USD'),
  thumbnailUrl: z.string().url().optional(),
  previewVideoUrl: z.string().url().optional(),
  duration: z.number().min(0).optional(),
  isPublished: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  prerequisites: z.array(z.string().max(200)).max(10).optional().default([]),
  learningOutcomes: z.array(z.string().max(300)).max(20).optional().default([]),
  instructorId: z.string().optional(),
  instructorName: z.string().max(200).optional(),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

export const createCourse = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const authUser = getUserFromEvent(event);
  if (!authUser || authUser.role !== 'admin') {
    return error(403, 'Admin access required');
  }

  let body: unknown;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error(400, 'Invalid JSON body');
  }

  const validation = createCourseSchema.safeParse(body);
  if (!validation.success) {
    const messages = validation.error.errors.map((e) => e.message);
    return error(400, messages.join(', '));
  }

  const data = validation.data;
  const courseId = randomUUID();
  const now = new Date().toISOString();
  const slug = slugify(data.title) + '-' + courseId.slice(0, 8);

  const courseItem = {
    pk: `COURSE#${courseId}`,
    sk: 'METADATA',
    courseId,
    slug,
    title: data.title,
    subtitle: data.subtitle || null,
    description: data.description,
    shortDescription: data.shortDescription || null,
    category: data.category,
    difficulty: data.difficulty,
    price: data.price,
    currency: data.currency,
    thumbnailUrl: data.thumbnailUrl || null,
    previewVideoUrl: data.previewVideoUrl || null,
    duration: data.duration || 0,
    isPublished: data.isPublished,
    isFeatured: data.isFeatured,
    tags: data.tags,
    prerequisites: data.prerequisites,
    learningOutcomes: data.learningOutcomes,
    instructorId: data.instructorId || authUser.userId,
    instructorName: data.instructorName || null,
    enrollmentCount: 0,
    averageRating: 0,
    ratingCount: 0,
    moduleCount: 0,
    lessonCount: 0,
    entityType: 'COURSE',
    createdAt: now,
    updatedAt: now,
    createdBy: authUser.userId,
  };

  await docClient.send(
    new PutCommand({
      TableName: MAIN_TABLE,
      Item: courseItem,
      ConditionExpression: 'attribute_not_exists(pk)',
    })
  );

  return success(201, { course: courseItem });
};
