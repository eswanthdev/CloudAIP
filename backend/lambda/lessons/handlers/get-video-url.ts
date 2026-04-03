import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { docClient, MAIN_TABLE, ACTIVITY_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

const s3Client = new S3Client({});
const VIDEO_BUCKET = process.env.VIDEO_BUCKET || '';
const PRESIGNED_URL_EXPIRY = 15 * 60; // 15 minutes

async function findLessonById(lessonId: string): Promise<Record<string, any> | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: MAIN_TABLE,
      IndexName: 'GSI3-EntityTypeIndex',
      KeyConditionExpression: 'entityType = :entityType',
      FilterExpression: 'lessonId = :lessonId',
      ExpressionAttributeValues: {
        ':entityType': 'LESSON',
        ':lessonId': lessonId,
      },
      Limit: 1,
    })
  );
  return result.Items?.[0] || null;
}

export const getVideoUrl = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const authUser = getUserFromEvent(event);
  if (!authUser) {
    return error(401, 'Authentication required');
  }

  // Extract lessonId from path: /lessons/{lessonId}/video-url
  const path = event.requestContext?.http?.path || (event as any).path || '';
  const pathParts = path.split('/');
  const lessonId = event.pathParameters?.lessonId || pathParts[pathParts.indexOf('lessons') + 1];

  if (!lessonId) {
    return error(400, 'Lesson ID is required');
  }

  // Find the lesson
  const lesson = await findLessonById(lessonId);
  if (!lesson) {
    return error(404, 'Lesson not found');
  }

  if (!lesson.videoKey) {
    return error(404, 'No video associated with this lesson');
  }

  // Check enrollment unless lesson is free or user is admin
  if (!lesson.isFree && authUser.role !== 'admin') {
    const enrollmentResult = await docClient.send(
      new GetCommand({
        TableName: ACTIVITY_TABLE,
        Key: {
          pk: `USER#${authUser.userId}`,
          sk: `ENROLL#${lesson.courseId}`,
        },
      })
    );

    if (!enrollmentResult.Item) {
      return error(403, 'You must be enrolled in this course to access this video');
    }
  }

  // Generate presigned URL
  const command = new GetObjectCommand({
    Bucket: VIDEO_BUCKET,
    Key: lesson.videoKey,
  });

  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: PRESIGNED_URL_EXPIRY,
  });

  return success(200, {
    url: presignedUrl,
    expiresIn: PRESIGNED_URL_EXPIRY,
    lessonId,
    title: lesson.title,
  });
};
