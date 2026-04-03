import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { register } from './handlers/register.js';
import { login } from './handlers/login.js';
import { refreshToken } from './handlers/refresh-token.js';
import { logout } from './handlers/logout.js';
import { forgotPassword } from './handlers/forgot-password.js';
import { resetPassword } from './handlers/reset-password.js';
import { verifyEmail } from './handlers/verify-email.js';
import { getMe } from './handlers/me.js';
import { error } from '/opt/nodejs/src/response';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext?.http?.method || (event as any).httpMethod;
    const path = event.requestContext?.http?.path || (event as any).path;

    if (method === 'POST' && path === '/auth/register') {
      return await register(event);
    }
    if (method === 'POST' && path === '/auth/login') {
      return await login(event);
    }
    if (method === 'POST' && path === '/auth/refresh') {
      return await refreshToken(event);
    }
    if (method === 'POST' && path === '/auth/logout') {
      return await logout(event);
    }
    if (method === 'POST' && path === '/auth/forgot-password') {
      return await forgotPassword(event);
    }
    if (method === 'POST' && path.startsWith('/auth/reset-password/')) {
      return await resetPassword(event);
    }
    if (method === 'GET' && path.startsWith('/auth/verify-email/')) {
      return await verifyEmail(event);
    }
    if (method === 'GET' && path === '/auth/me') {
      return await getMe(event);
    }

    return error(404, 'Route not found');
  } catch (err) {
    console.error('Unhandled error in auth handler:', err);
    return error(500, 'Internal server error');
  }
};
