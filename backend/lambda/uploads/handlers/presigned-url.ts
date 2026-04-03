import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.UPLOADS_BUCKET || '';
const CDN_URL = process.env.CDN_URL || '';

const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/mp4',
]);

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

const presignedUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1).max(100),
  folder: z.string().min(1).max(100).optional().default('uploads'),
  fileSize: z.number().positive().max(MAX_FILE_SIZE).optional(),
});

export const presignedUrl = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const user = getUserFromEvent(event);
  if (!user || user.role !== 'admin') {
    return error(403, 'Admin access required');
  }

  if (!BUCKET_NAME) {
    return error(500, 'Upload bucket not configured');
  }

  let body: unknown;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error(400, 'Invalid JSON body');
  }

  const validation = presignedUrlSchema.safeParse(body);
  if (!validation.success) {
    const messages = validation.error.errors.map((e) => e.message);
    return error(400, messages.join(', '));
  }

  const { fileName, fileType, folder } = validation.data;

  if (!ALLOWED_CONTENT_TYPES.has(fileType)) {
    return error(400, `File type "${fileType}" is not allowed`);
  }

  // Sanitize filename
  const sanitizedFileName = fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .toLowerCase();

  const key = `${folder}/${randomUUID()}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 min

  const publicUrl = CDN_URL
    ? `${CDN_URL}/${key}`
    : `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;

  return success(200, {
    uploadUrl,
    key,
    publicUrl,
  });
};
