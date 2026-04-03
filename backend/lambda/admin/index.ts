import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getStats } from './handlers/get-stats.js';
import { getRecentActivity } from './handlers/get-recent-activity.js';
import { error } from '/opt/nodejs/src/response';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext?.http?.method || (event as any).httpMethod;
    const path = event.requestContext?.http?.path || (event as any).path;

    if (method === 'GET' && path === '/admin/stats') {
      return await getStats(event);
    }
    if (method === 'GET' && path === '/admin/recent-activity') {
      return await getRecentActivity(event);
    }

    return error(404, 'Route not found');
  } catch (err) {
    console.error('Unhandled error in admin handler:', err);
    return error(500, 'Internal server error');
  }
};
