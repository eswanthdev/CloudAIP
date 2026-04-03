import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { createIntent } from './handlers/create-intent.js';
import { webhook } from './handlers/webhook.js';
import { listPayments } from './handlers/list-payments.js';
import { getPayment } from './handlers/get-payment.js';
import { error } from '/opt/nodejs/src/response';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext?.http?.method || (event as any).httpMethod;
    const path = event.requestContext?.http?.path || (event as any).path;

    if (method === 'POST' && path === '/payments/create-intent') {
      return await createIntent(event);
    }
    if (method === 'POST' && path === '/payments/webhook') {
      return await webhook(event);
    }
    if (method === 'GET' && path === '/payments') {
      return await listPayments(event);
    }
    if (method === 'GET' && path.startsWith('/payments/')) {
      return await getPayment(event);
    }

    return error(404, 'Route not found');
  } catch (err) {
    console.error('Unhandled error in payments handler:', err);
    return error(500, 'Internal server error');
  }
};
