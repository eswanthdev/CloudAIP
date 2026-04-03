import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE, ACTIVITY_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

const generateSchema = z.object({
  courseId: z.string().min(1, 'courseId is required'),
});

function generateCertificateNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CLOUDAIP-${result}`;
}

function buildCertificateHtml(
  userName: string,
  courseName: string,
  certificateNumber: string,
  issuedAt: string
): string {
  const formattedDate = new Date(issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Georgia', serif; background: #f5f5f5; }
    .certificate {
      width: 800px; height: 600px; margin: 40px auto; padding: 40px;
      background: linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%);
      border: 3px solid #6366f1;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      text-align: center;
      position: relative;
    }
    .certificate::before {
      content: ''; position: absolute; top: 10px; left: 10px;
      right: 10px; bottom: 10px; border: 1px solid #c7d2fe;
    }
    .logo { font-size: 28px; color: #6366f1; font-weight: bold; margin-bottom: 10px; }
    .title { font-size: 36px; color: #1e1b4b; margin: 20px 0 10px; }
    .subtitle { font-size: 16px; color: #6b7280; margin-bottom: 30px; }
    .recipient { font-size: 32px; color: #1e1b4b; font-style: italic; margin: 10px 0; border-bottom: 2px solid #6366f1; display: inline-block; padding-bottom: 5px; }
    .course { font-size: 20px; color: #4f46e5; margin: 20px 0; }
    .details { font-size: 14px; color: #6b7280; margin-top: 30px; }
    .cert-number { font-size: 12px; color: #9ca3af; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="logo">CloudAIP</div>
    <div class="title">Certificate of Completion</div>
    <div class="subtitle">This certifies that</div>
    <div class="recipient">${escapeHtml(userName)}</div>
    <div class="subtitle">has successfully completed</div>
    <div class="course">${escapeHtml(courseName)}</div>
    <div class="details">Issued on ${formattedDate}</div>
    <div class="cert-number">Certificate No: ${certificateNumber}</div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const generateCertificate = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const user = getUserFromEvent(event);
  if (!user) {
    return error(401, 'Authentication required');
  }

  let body: unknown;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error(400, 'Invalid JSON body');
  }

  const validation = generateSchema.safeParse(body);
  if (!validation.success) {
    const messages = validation.error.errors.map((e) => e.message);
    return error(400, messages.join(', '));
  }

  const { courseId } = validation.data;

  // Verify enrollment is completed
  const enrollmentResult = await docClient.send(
    new GetCommand({
      TableName: ACTIVITY_TABLE,
      Key: { pk: `USER#${user.userId}`, sk: `ENROLL#${courseId}` },
    })
  );

  if (!enrollmentResult.Item) {
    return error(404, 'Enrollment not found');
  }

  if (enrollmentResult.Item.status !== 'completed') {
    return error(400, 'Course must be completed before generating a certificate');
  }

  // Check if certificate already exists for this user+course via GSI8-CertUserIndex
  const existingCert = await docClient.send(
    new QueryCommand({
      TableName: MAIN_TABLE,
      IndexName: 'GSI8-CertUserIndex',
      KeyConditionExpression: 'certUserId = :uid',
      FilterExpression: 'courseId = :cid',
      ExpressionAttributeValues: {
        ':uid': user.userId,
        ':cid': courseId,
      },
    })
  );

  if (existingCert.Items && existingCert.Items.length > 0) {
    return error(409, 'Certificate already exists for this course');
  }

  // Get user profile for name
  const userResult = await docClient.send(
    new GetCommand({
      TableName: MAIN_TABLE,
      Key: { pk: `USER#${user.userId}`, sk: 'PROFILE' },
    })
  );

  const userName = userResult.Item
    ? `${userResult.Item.firstName || ''} ${userResult.Item.lastName || ''}`.trim()
    : user.email || 'Student';

  // Get course name
  const courseResult = await docClient.send(
    new GetCommand({
      TableName: MAIN_TABLE,
      Key: { pk: `COURSE#${courseId}`, sk: 'METADATA' },
    })
  );

  const courseName = courseResult.Item?.title || enrollmentResult.Item.courseName || 'Unknown Course';

  const certId = randomUUID();
  const certificateNumber = generateCertificateNumber();
  const now = new Date().toISOString();

  const certificateHtml = buildCertificateHtml(userName, courseName, certificateNumber, now);

  const certItem = {
    pk: `CERT#${certId}`,
    sk: 'METADATA',
    certId,
    certificateNumber,
    certUserId: user.userId,
    userName,
    courseId,
    courseName,
    issuedAt: now,
    createdAt: now,
    entityType: 'CERTIFICATE',
    htmlContent: certificateHtml,
  };

  await docClient.send(
    new PutCommand({
      TableName: MAIN_TABLE,
      Item: certItem,
    })
  );

  return success(201, {
    certificate: {
      certId,
      certificateNumber,
      userName,
      courseName,
      issuedAt: now,
    },
  });
};
