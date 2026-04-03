import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.UPLOADS_BUCKET || '';

export const downloadCertificate = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const user = getUserFromEvent(event);
  if (!user) {
    return error(401, 'Authentication required');
  }

  const path = event.requestContext?.http?.path || (event as any).path;
  // Path: /certificates/{certId}/download
  const match = path.match(/\/certificates\/([^/]+)\/download/);
  const certId = match?.[1];

  if (!certId) {
    return error(400, 'Certificate ID is required');
  }

  const result = await docClient.send(
    new GetCommand({
      TableName: MAIN_TABLE,
      Key: { pk: `CERT#${certId}`, sk: 'METADATA' },
    })
  );

  if (!result.Item) {
    return error(404, 'Certificate not found');
  }

  // Non-admin can only download own certificates
  if (user.role !== 'admin' && result.Item.certUserId !== user.userId) {
    return error(403, 'Access denied');
  }

  // If a PDF has been generated and stored in S3
  if (result.Item.pdfKey && BUCKET_NAME) {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: result.Item.pdfKey,
      ResponseContentDisposition: `attachment; filename="certificate-${result.Item.certificateNumber}.pdf"`,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    return success(200, {
      downloadUrl,
      certificateNumber: result.Item.certificateNumber,
    });
  }

  // If no PDF, return the HTML content for client-side rendering
  if (result.Item.htmlContent) {
    return success(200, {
      htmlContent: result.Item.htmlContent,
      certificateNumber: result.Item.certificateNumber,
      message: 'No PDF available. Use the HTML content to render the certificate.',
    });
  }

  return error(404, 'Certificate file not available');
};
