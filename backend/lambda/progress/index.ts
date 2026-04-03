import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { updateProgress } from './handlers/update-progress.js';
import { getCourseProgress } from './handlers/get-course-progress.js';
import { getProgressSummary } from './handlers/get-progress-summary.js';
import { error } from '/opt/nodejs/src/response';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext?.http?.method || (event as any).httpMethod;
    const path = event.requestContext?.http?.path || (event as any).path;

    if (method === 'PUT' && path === '/progress') {
      return await updateProgress(event);
    }
    if (method === 'GET' && path === '/progress/summary') {
      return await getProgressSummary(event);
    }
    if (method === 'GET' && path.startsWith('/progress/courses/')) {
      return await getCourseProgress(event);
    }

    return error(404, 'Route not found');
  } catch (err) {
    console.error('Unhandled error in progress handler:', err);
    return error(500, 'Internal server error');
  }
};
