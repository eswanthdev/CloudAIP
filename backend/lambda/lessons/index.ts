import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { createLesson } from './handlers/create-lesson.js';
import { updateLesson } from './handlers/update-lesson.js';
import { deleteLesson } from './handlers/delete-lesson.js';
import { getVideoUrl } from './handlers/get-video-url.js';
import { error } from '/opt/nodejs/src/response';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext?.http?.method || (event as any).httpMethod;
    const path = event.requestContext?.http?.path || (event as any).path;

    // POST /modules/{moduleId}/lessons - create lesson
    if (method === 'POST' && path.match(/^\/modules\/[^/]+\/lessons$/)) {
      return await createLesson(event);
    }

    // PATCH /lessons/{lessonId} - update lesson
    if (method === 'PATCH' && path.match(/^\/lessons\/[^/]+$/)) {
      return await updateLesson(event);
    }

    // DELETE /lessons/{lessonId} - delete lesson
    if (method === 'DELETE' && path.match(/^\/lessons\/[^/]+$/)) {
      return await deleteLesson(event);
    }

    // GET /lessons/{lessonId}/video-url - get presigned video URL
    if (method === 'GET' && path.match(/^\/lessons\/[^/]+\/video-url$/)) {
      return await getVideoUrl(event);
    }

    return error(404, 'Route not found');
  } catch (err) {
    console.error('Unhandled error in lessons handler:', err);
    return error(500, 'Internal server error');
  }
};
