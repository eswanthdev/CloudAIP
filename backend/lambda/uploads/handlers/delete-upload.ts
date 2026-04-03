import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.UPLOADS_BUCKET || '';

export const deleteUpload = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const user = getUserFromEvent(event);
  if (!user || user.role !== 'admin') {
    return error(403, 'Admin access required');
  }

  if (!BUCKET_NAME) {
    return error(500, 'Upload bucket not configured');
  }

  const path = event.requestContext?.http?.path || (event as any).path;
  // Path: /uploads/{key} - key can contain slashes, so we take everything after /uploads/
  const key = decodeURIComponent(path.split('/uploads/')[1] || '');

  if (!key) {
    return error(400, 'File key is required');
  }

  // Prevent deletion of critical paths
  if (key === '/' || key === '' || key.includes('..')) {
    return error(400, 'Invalid file key');
  }

  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );

    return success(200, { message: 'File deleted successfully', key });
  } catch (err: any) {
    console.error('Failed to delete S3 object:', err);
    return error(500, 'Failed to delete file');
  }
};
