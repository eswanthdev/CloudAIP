import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { docClient, ACTIVITY_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

const sesClient = new SESClient({});
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL || '';

const updateRequestSchema = z.object({
  status: z.enum(['new', 'in_progress', 'contacted', 'completed', 'cancelled']).optional(),
  adminNotes: z.string().max(5000).optional(),
  assignedTo: z.string().max(200).optional(),
});

export const updateRequest = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const user = getUserFromEvent(event);
  if (!user || user.role !== 'admin') {
    return error(403, 'Admin access required');
  }

  const path = event.requestContext?.http?.path || (event as any).path;
  const requestId = path.split('/service-requests/')[1];

  if (!requestId) {
    return error(400, 'Request ID is required');
  }

  let body: unknown;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error(400, 'Invalid JSON body');
  }

  const validation = updateRequestSchema.safeParse(body);
  if (!validation.success) {
    const messages = validation.error.errors.map((e) => e.message);
    return error(400, messages.join(', '));
  }

  const data = validation.data;

  // Find the request by requestId
  const findResult = await docClient.send(
    new QueryCommand({
      TableName: ACTIVITY_TABLE,
      IndexName: 'GSI7-EntityTypeIndex',
      KeyConditionExpression: 'entityType = :et',
      FilterExpression: 'requestId = :rid',
      ExpressionAttributeValues: {
        ':et': 'SERVICE_REQUEST',
        ':rid': requestId,
      },
      Limit: 1,
    })
  );

  if (!findResult.Items || findResult.Items.length === 0) {
    return error(404, 'Service request not found');
  }

  const existingRequest = findResult.Items[0];
  const now = new Date().toISOString();

  // Build dynamic update expression
  const expressionParts: string[] = ['#updatedAt = :updatedAt'];
  const exprAttrNames: Record<string, string> = { '#updatedAt': 'updatedAt' };
  const exprAttrValues: Record<string, any> = { ':updatedAt': now };

  if (data.status) {
    expressionParts.push('#status = :status');
    expressionParts.push('svcReqStatusKey = :srsk');
    exprAttrNames['#status'] = 'status';
    exprAttrValues[':status'] = data.status;
    exprAttrValues[':srsk'] = `SVCREQ#STATUS#${data.status}`;
  }

  if (data.adminNotes !== undefined) {
    expressionParts.push('adminNotes = :adminNotes');
    exprAttrValues[':adminNotes'] = data.adminNotes;
  }

  if (data.assignedTo !== undefined) {
    expressionParts.push('assignedTo = :assignedTo');
    exprAttrValues[':assignedTo'] = data.assignedTo;
  }

  const updateResult = await docClient.send(
    new UpdateCommand({
      TableName: ACTIVITY_TABLE,
      Key: { pk: existingRequest.pk, sk: existingRequest.sk },
      UpdateExpression: `SET ${expressionParts.join(', ')}`,
      ExpressionAttributeNames: exprAttrNames,
      ExpressionAttributeValues: exprAttrValues,
      ReturnValues: 'ALL_NEW',
    })
  );

  // Send email notification on status change (best effort)
  if (data.status && existingRequest.email && SES_FROM_EMAIL) {
    try {
      await sesClient.send(
        new SendEmailCommand({
          Source: SES_FROM_EMAIL,
          Destination: { ToAddresses: [existingRequest.email] },
          Message: {
            Subject: {
              Data: `CloudAIP Service Request Update - ${data.status.replace(/_/g, ' ')}`,
              Charset: 'UTF-8',
            },
            Body: {
              Text: {
                Data: [
                  `Hello ${existingRequest.name},`,
                  '',
                  `Your service request (${requestId}) has been updated.`,
                  `New status: ${data.status.replace(/_/g, ' ')}`,
                  '',
                  'Thank you for choosing CloudAIP.',
                ].join('\n'),
                Charset: 'UTF-8',
              },
            },
          },
        })
      );
    } catch (err) {
      console.error('Failed to send status notification:', err);
    }
  }

  return success(200, { serviceRequest: updateResult.Attributes });
};
