import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { listCourses } from './handlers/list-courses.js';
import { getCourse } from './handlers/get-course.js';
import { createCourse } from './handlers/create-course.js';
import { updateCourse } from './handlers/update-course.js';
import { deleteCourse } from './handlers/delete-course.js';
import { error } from '/opt/nodejs/src/response';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext?.http?.method || (event as any).httpMethod;
    const path = event.requestContext?.http?.path || (event as any).path;

    // GET /courses - list courses (public)
    if (method === 'GET' && path === '/courses') {
      return await listCourses(event);
    }

    // GET /courses/{courseId} - get single course (public)
    if (method === 'GET' && path.match(/^\/courses\/[^/]+$/)) {
      return await getCourse(event);
    }

    // POST /courses - create course (admin)
    if (method === 'POST' && path === '/courses') {
      return await createCourse(event);
    }

    // PATCH /courses/{courseId} - update course (admin)
    if (method === 'PATCH' && path.match(/^\/courses\/[^/]+$/)) {
      return await updateCourse(event);
    }

    // DELETE /courses/{courseId} - delete course (admin)
    if (method === 'DELETE' && path.match(/^\/courses\/[^/]+$/)) {
      return await deleteCourse(event);
    }

    return error(404, 'Route not found');
  } catch (err) {
    console.error('Unhandled error in courses handler:', err);
    return error(500, 'Internal server error');
  }
};
