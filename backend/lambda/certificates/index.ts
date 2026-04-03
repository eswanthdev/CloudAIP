import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { generateCertificate } from './handlers/generate-certificate.js';
import { listCertificates } from './handlers/list-certificates.js';
import { getCertificate } from './handlers/get-certificate.js';
import { downloadCertificate } from './handlers/download-certificate.js';
import { verifyCertificate } from './handlers/verify-certificate.js';
import { error } from '/opt/nodejs/src/response';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext?.http?.method || (event as any).httpMethod;
    const path = event.requestContext?.http?.path || (event as any).path;

    if (method === 'POST' && path === '/certificates/generate') {
      return await generateCertificate(event);
    }
    if (method === 'GET' && path === '/certificates') {
      return await listCertificates(event);
    }
    if (method === 'GET' && path.startsWith('/certificates/verify/')) {
      return await verifyCertificate(event);
    }
    if (method === 'GET' && path.endsWith('/download')) {
      return await downloadCertificate(event);
    }
    if (method === 'GET' && path.startsWith('/certificates/')) {
      return await getCertificate(event);
    }

    return error(404, 'Route not found');
  } catch (err) {
    console.error('Unhandled error in certificates handler:', err);
    return error(500, 'Internal server error');
  }
};
