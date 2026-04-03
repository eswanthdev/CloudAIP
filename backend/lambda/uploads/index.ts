import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { presignedUrl } from './handlers/presigned-url.js';
import { deleteUpload } from './handlers/delete-upload.js';
import { error } from '/opt/nodejs/src/response';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext?.http?.method || (event as any).httpMethod;
    const path = event.requestContext?.http?.path || (event as any).path;

    if (method === 'POST' && path === '/uploads/presigned-url') {
      return await presignedUrl(event);
    }
    if (method === 'DELETE' && path.startsWith('/uploads/')) {
      return await deleteUpload(event);
    }

    return error(404, 'Route not found');
  } catch (err) {
    console.error('Unhandled error in uploads handler:', err);
    return error(500, 'Internal server error');
  }
};
