import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import Stripe from 'stripe';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE, ACTIVITY_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

const createIntentSchema = z.object({
  type: z.enum(['course', 'service']),
  courseId: z.string().optional(),
  serviceId: z.string().optional(),
  amount: z.number().positive().optional(),
}).refine(
  (data) => {
    if (data.type === 'course') return !!data.courseId;
    if (data.type === 'service') return !!data.serviceId;
    return false;
  },
  { message: 'courseId required for course type, serviceId required for service type' }
);

export const createIntent = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const user = getUserFromEvent(event);
  if (!user) {
    return error(401, 'Authentication required');
  }

  let body: unknown;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error(400, 'Invalid JSON body');
  }

  const validation = createIntentSchema.safeParse(body);
  if (!validation.success) {
    const messages = validation.error.errors.map((e) => e.message);
    return error(400, messages.join(', '));
  }

  const data = validation.data;
  let amount: number;
  let itemName: string;
  let itemId: string;

  if (data.type === 'course') {
    // Get course from MainTable to verify price
    const courseResult = await docClient.send(
      new GetCommand({
        TableName: MAIN_TABLE,
        Key: { pk: `COURSE#${data.courseId}`, sk: 'METADATA' },
      })
    );

    if (!courseResult.Item) {
      return error(404, 'Course not found');
    }

    amount = data.amount || courseResult.Item.price || 0;
    itemName = courseResult.Item.title || 'Course';
    itemId = data.courseId!;

    if (amount <= 0) {
      return error(400, 'Invalid course price');
    }
  } else {
    // Get service from MainTable
    const serviceResult = await docClient.send(
      new GetCommand({
        TableName: MAIN_TABLE,
        Key: { pk: `SERVICE#${data.serviceId}`, sk: 'METADATA' },
      })
    );

    if (!serviceResult.Item) {
      return error(404, 'Service not found');
    }

    amount = data.amount || 0;
    itemName = serviceResult.Item.title || 'Service';
    itemId = data.serviceId!;

    if (amount <= 0) {
      return error(400, 'Amount is required for service payments');
    }
  }

  // Create Stripe PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    metadata: {
      userId: user.userId,
      type: data.type,
      itemId,
      itemName,
    },
    description: `CloudAIP - ${itemName}`,
  });

  const paymentId = randomUUID();
  const now = new Date().toISOString();

  // Store payment record in ActivityTable
  const paymentItem = {
    pk: `USER#${user.userId}`,
    sk: `PAYMENT#${now}#${paymentId}`,
    paymentId,
    userId: user.userId,
    type: data.type,
    courseId: data.courseId || null,
    serviceId: data.serviceId || null,
    itemName,
    amount,
    currency: 'usd',
    status: 'pending',
    stripePaymentIntentId: paymentIntent.id,
    createdAt: now,
    updatedAt: now,
    entityType: 'PAYMENT',
    paymentStatusKey: 'PAYMENT#STATUS#pending',
  };

  await docClient.send(
    new PutCommand({
      TableName: ACTIVITY_TABLE,
      Item: paymentItem,
    })
  );

  return success(201, {
    clientSecret: paymentIntent.client_secret,
    paymentId,
    amount,
    currency: 'usd',
  });
};
