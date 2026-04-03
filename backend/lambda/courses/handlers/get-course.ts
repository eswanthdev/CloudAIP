import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';

interface ModuleItem {
  moduleId: string;
  title: string;
  description?: string;
  order: number;
  lessons: LessonItem[];
  [key: string]: any;
}

interface LessonItem {
  lessonId: string;
  title: string;
  description?: string;
  type?: string;
  duration?: number;
  order: number;
  isFree?: boolean;
  moduleId: string;
  [key: string]: any;
}

export const getCourse = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const courseId = event.pathParameters?.courseId;
  if (!courseId) {
    return error(400, 'Course ID is required');
  }

  // Query ALL items with PK=COURSE#{courseId} - returns METADATA, MODULE#, and LESSON# items
  const result = await docClient.send(
    new QueryCommand({
      TableName: MAIN_TABLE,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': `COURSE#${courseId}` },
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return error(404, 'Course not found');
  }

  // Separate items by type
  let courseMetadata: Record<string, any> | null = null;
  const modules: Map<string, ModuleItem> = new Map();
  const courseLessons: LessonItem[] = [];

  for (const item of result.Items) {
    const sk = item.sk as string;

    if (sk === 'METADATA') {
      courseMetadata = item;
    } else if (sk.startsWith('MODULE#')) {
      // SK format: MODULE#{order}#{moduleId}
      const parts = sk.replace('MODULE#', '').split('#');
      const order = parseInt(parts[0], 10);
      const moduleId = parts[1];

      modules.set(moduleId, {
        ...item,
        moduleId,
        order,
        lessons: [],
      });
    } else if (sk.startsWith('LESSON#')) {
      // SK format: LESSON#{moduleId}#{order}#{lessonId}
      const parts = sk.replace('LESSON#', '').split('#');
      const moduleId = parts[0];
      const order = parseInt(parts[1], 10);
      const lessonId = parts[2];

      courseLessons.push({
        ...item,
        lessonId,
        moduleId,
        order,
      });
    }
  }

  if (!courseMetadata) {
    return error(404, 'Course not found');
  }

  // Assign lessons to their modules
  for (const lesson of courseLessons) {
    const module = modules.get(lesson.moduleId);
    if (module) {
      module.lessons.push(lesson);
    }
  }

  // Sort modules by order
  const sortedModules = Array.from(modules.values()).sort((a, b) => a.order - b.order);

  // Sort lessons within each module by order
  for (const module of sortedModules) {
    module.lessons.sort((a, b) => a.order - b.order);
  }

  const course = {
    ...courseMetadata,
    modules: sortedModules,
  };

  return success(200, { course });
};
