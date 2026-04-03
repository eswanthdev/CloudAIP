import type { APIGatewayProxyEventV2 } from './types/api';
import { verifyAccessToken, type AccessTokenPayload } from './jwt';

export interface AuthContext {
  userId: string;
  role: string;
  email?: string;
}

export function extractTokenFromEvent(
  event: APIGatewayProxyEventV2
): string | null {
  const authHeader =
    event.headers?.authorization || event.headers?.Authorization;
  if (!authHeader) {
    return null;
  }

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}

export function getUserFromEvent(
  event: APIGatewayProxyEventV2
): AuthContext | null {
  // First check if the authorizer already decoded the token (set by Lambda authorizer)
  const requestContext = event.requestContext as Record<string, unknown>;
  const authorizer = requestContext?.authorizer as
    | Record<string, unknown>
    | undefined;
  const lambda = authorizer?.lambda as Record<string, string> | undefined;

  if (lambda?.userId) {
    return {
      userId: lambda.userId,
      role: lambda.role || 'student',
      email: lambda.email,
    };
  }

  // Fallback: decode the token directly
  const token = extractTokenFromEvent(event);
  if (!token) {
    return null;
  }

  try {
    const decoded: AccessTokenPayload = verifyAccessToken(token);
    return {
      userId: decoded.userId,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

export function requireAuth(event: APIGatewayProxyEventV2): AuthContext {
  const user = getUserFromEvent(event);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export function requireAdmin(event: APIGatewayProxyEventV2): AuthContext {
  const user = requireAuth(event);
  if (user.role !== 'admin') {
    throw new Error('Forbidden: admin access required');
  }
  return user;
}
