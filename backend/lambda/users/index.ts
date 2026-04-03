import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { listUsers } from './handlers/list-users.js';
import { getUser } from './handlers/get-user.js';
import { updateUser } from './handlers/update-user.js';
import { deleteUser } from './handlers/delete-user.js';
import { error } from '/opt/nodejs/src/response';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext?.http?.method || (event as any).httpMethod;
    const path = event.requestContext?.http?.path || (event as any).path;

    // GET /users - list all users
    if (method === 'GET' && path === '/users') {
      return await listUsers(event);
    }

    // GET /users/{userId} - get specific user
    if (method === 'GET' && path.match(/^\/users\/[^/]+$/)) {
      return await getUser(event);
    }

    // PATCH /users/{userId} - update user
    if (method === 'PATCH' && path.match(/^\/users\/[^/]+$/)) {
      return await updateUser(event);
    }

    // DELETE /users/{userId} - soft delete user
    if (method === 'DELETE' && path.match(/^\/users\/[^/]+$/)) {
      return await deleteUser(event);
    }

    return error(404, 'Route not found');
  } catch (err) {
    console.error('Unhandled error in users handler:', err);
    return error(500, 'Internal server error');
  }
};
