import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { createModule } from './handlers/create-module.js';
import { updateModule } from './handlers/update-module.js';
import { deleteModule } from './handlers/delete-module.js';
import { error } from '/opt/nodejs/src/response';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext?.http?.method || (event as any).httpMethod;
    const path = event.requestContext?.http?.path || (event as any).path;

    // POST /courses/{courseId}/modules - create module
    if (method === 'POST' && path.match(/^\/courses\/[^/]+\/modules$/)) {
      return await createModule(event);
    }

    // PATCH /modules/{moduleId} - update module
    if (method === 'PATCH' && path.match(/^\/modules\/[^/]+$/)) {
      return await updateModule(event);
    }

    // DELETE /modules/{moduleId} - delete module
    if (method === 'DELETE' && path.match(/^\/modules\/[^/]+$/)) {
      return await deleteModule(event);
    }

    return error(404, 'Route not found');
  } catch (err) {
    console.error('Unhandled error in modules handler:', err);
    return error(500, 'Internal server error');
  }
};
