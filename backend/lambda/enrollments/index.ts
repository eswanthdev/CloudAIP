import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { enroll } from './handlers/enroll.js';
import { listEnrollments } from './handlers/list-enrollments.js';
import { getEnrollment } from './handlers/get-enrollment.js';
import { error } from '/opt/nodejs/src/response';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext?.http?.method || (event as any).httpMethod;
    const path = event.requestContext?.http?.path || (event as any).path;

    if (method === 'POST' && path === '/enrollments') {
      return await enroll(event);
    }
    if (method === 'GET' && path === '/enrollments') {
      return await listEnrollments(event);
    }
    if (method === 'GET' && path.startsWith('/enrollments/')) {
      return await getEnrollment(event);
    }

    return error(404, 'Route not found');
  } catch (err) {
    console.error('Unhandled error in enrollments handler:', err);
    return error(500, 'Internal server error');
  }
};
