import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { createRequest } from './handlers/create-request.js';
import { listRequests } from './handlers/list-requests.js';
import { getRequest } from './handlers/get-request.js';
import { updateRequest } from './handlers/update-request.js';
import { error } from '/opt/nodejs/src/response';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext?.http?.method || (event as any).httpMethod;
    const path = event.requestContext?.http?.path || (event as any).path;

    if (method === 'POST' && path === '/service-requests') {
      return await createRequest(event);
    }
    if (method === 'GET' && path === '/service-requests') {
      return await listRequests(event);
    }
    if (method === 'PATCH' && path.startsWith('/service-requests/')) {
      return await updateRequest(event);
    }
    if (method === 'GET' && path.startsWith('/service-requests/')) {
      return await getRequest(event);
    }

    return error(404, 'Route not found');
  } catch (err) {
    console.error('Unhandled error in service-requests handler:', err);
    return error(500, 'Internal server error');
  }
};
