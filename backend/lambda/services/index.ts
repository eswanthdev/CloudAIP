import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { listServices } from './handlers/list-services.js';
import { getService } from './handlers/get-service.js';
import { createService } from './handlers/create-service.js';
import { updateService } from './handlers/update-service.js';
import { deleteService } from './handlers/delete-service.js';
import { error } from '/opt/nodejs/src/response';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext?.http?.method || (event as any).httpMethod;
    const path = event.requestContext?.http?.path || (event as any).path;

    if (method === 'GET' && path === '/services') {
      return await listServices(event);
    }
    if (method === 'POST' && path === '/services') {
      return await createService(event);
    }
    if (method === 'GET' && path.startsWith('/services/')) {
      return await getService(event);
    }
    if (method === 'PATCH' && path.startsWith('/services/')) {
      return await updateService(event);
    }
    if (method === 'DELETE' && path.startsWith('/services/')) {
      return await deleteService(event);
    }

    return error(404, 'Route not found');
  } catch (err) {
    console.error('Unhandled error in services handler:', err);
    return error(500, 'Internal server error');
  }
};
