import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

const createServiceSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  shortDescription: z.string().max(500).optional(),
  category: z.string().min(1).max(100),
  icon: z.string().max(500).optional(),
  image: z.string().max(500).optional(),
  features: z.array(z.string()).optional().default([]),
  pricing: z.string().max(200).optional(),
  isPublished: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
  order: z.number().int().min(0).optional().default(0),
});

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export const createService = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const user = getUserFromEvent(event);
  if (!user || user.role !== 'admin') {
    return error(403, 'Admin access required');
  }

  let body: unknown;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error(400, 'Invalid JSON body');
  }

  const validation = createServiceSchema.safeParse(body);
  if (!validation.success) {
    const messages = validation.error.errors.map((e) => e.message);
    return error(400, messages.join(', '));
  }

  const data = validation.data;
  const serviceId = randomUUID();
  const slug = generateSlug(data.title);
  const now = new Date().toISOString();
  const paddedOrder = String(data.order).padStart(5, '0');

  const serviceItem = {
    pk: `SERVICE#${serviceId}`,
    sk: 'METADATA',
    serviceId,
    title: data.title,
    description: data.description,
    shortDescription: data.shortDescription || '',
    category: data.category,
    icon: data.icon || '',
    image: data.image || '',
    features: data.features,
    pricing: data.pricing || '',
    slug,
    isPublished: data.isPublished,
    isFeatured: data.isFeatured,
    order: data.order,
    entityType: 'SERVICE',
    serviceEntityType: 'SERVICE',
    serviceOrder: paddedOrder,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: MAIN_TABLE,
      Item: serviceItem,
    })
  );

  return success(201, { service: serviceItem });
};
