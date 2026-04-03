import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { docClient, ACTIVITY_TABLE, LEADS_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

const sesClient = new SESClient({});
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

const createRequestSchema = z.object({
  serviceId: z.string().min(1, 'serviceId is required'),
  serviceName: z.string().max(200).optional(),
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email').max(320),
  company: z.string().min(1, 'Company is required').max(300),
  phone: z.string().max(50).optional(),
  message: z.string().min(1, 'Message is required').max(5000),
  budget: z.string().max(200).optional(),
});

export const createRequest = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  // Auth is optional (guest or logged in)
  const user = getUserFromEvent(event);

  let body: unknown;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error(400, 'Invalid JSON body');
  }

  const validation = createRequestSchema.safeParse(body);
  if (!validation.success) {
    const messages = validation.error.errors.map((e) => e.message);
    return error(400, messages.join(', '));
  }

  const data = validation.data;
  const requestId = randomUUID();
  const now = new Date().toISOString();
  const userId = user?.userId || 'guest';

  const requestItem = {
    pk: `USER#${userId}`,
    sk: `SVCREQ#${now}#${requestId}`,
    requestId,
    userId,
    serviceId: data.serviceId,
    serviceName: data.serviceName || '',
    name: data.name,
    email: data.email.toLowerCase().trim(),
    company: data.company,
    phone: data.phone || '',
    message: data.message,
    budget: data.budget || '',
    status: 'new',
    createdAt: now,
    updatedAt: now,
    entityType: 'SERVICE_REQUEST',
    svcReqStatusKey: 'SVCREQ#STATUS#new',
  };

  // Create service request in ActivityTable
  await docClient.send(
    new PutCommand({
      TableName: ACTIVITY_TABLE,
      Item: requestItem,
    })
  );

  // Also create a lead in LeadsTable
  const leadItem = {
    leadId: randomUUID(),
    name: data.name,
    email: data.email.toLowerCase().trim(),
    company: data.company,
    message: data.message,
    spendRange: data.budget || null,
    contactMethod: null,
    status: 'new',
    source: 'service-request',
    serviceId: data.serviceId,
    serviceName: data.serviceName || '',
    createdAt: now,
    updatedAt: now,
    ttl: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60,
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: LEADS_TABLE,
        Item: leadItem,
      })
    );
  } catch (err) {
    console.error('Failed to create lead:', err);
  }

  // Send SES notification to admin (best effort)
  if (SES_FROM_EMAIL && ADMIN_EMAIL) {
    try {
      await sesClient.send(
        new SendEmailCommand({
          Source: SES_FROM_EMAIL,
          Destination: { ToAddresses: [ADMIN_EMAIL] },
          Message: {
            Subject: {
              Data: `New Service Request: ${data.name} - ${data.serviceName || data.serviceId}`,
              Charset: 'UTF-8',
            },
            Body: {
              Text: {
                Data: [
                  'New Service Request from CloudAIP',
                  '-----------------------------------',
                  `Name: ${data.name}`,
                  `Email: ${data.email}`,
                  `Company: ${data.company}`,
                  `Service: ${data.serviceName || data.serviceId}`,
                  `Budget: ${data.budget || 'Not specified'}`,
                  `Message: ${data.message}`,
                  '',
                  `Request ID: ${requestId}`,
                  `Received: ${now}`,
                ].join('\n'),
                Charset: 'UTF-8',
              },
            },
          },
        })
      );
    } catch (err) {
      console.error('Failed to send admin notification:', err);
    }
  }

  return success(201, {
    serviceRequest: {
      requestId,
      serviceId: data.serviceId,
      status: 'new',
      createdAt: now,
    },
    message: 'Service request submitted successfully. We will be in touch shortly.',
  });
};
