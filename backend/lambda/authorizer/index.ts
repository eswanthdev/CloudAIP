import jwt from 'jsonwebtoken';

interface AuthorizerEvent {
  version: string;
  type: string;
  routeArn: string;
  identitySource: string;
  routeKey: string;
  rawPath: string;
  rawQueryString: string;
  headers: Record<string, string>;
  requestContext: {
    accountId: string;
    apiId: string;
    domainName: string;
    domainPrefix: string;
    http: {
      method: string;
      path: string;
      protocol: string;
      sourceIp: string;
      userAgent: string;
    };
    requestId: string;
    routeKey: string;
    stage: string;
    time: string;
    timeEpoch: number;
  };
}

interface SimpleAuthorizerResponse {
  isAuthorized: boolean;
  context?: Record<string, string>;
}

interface TokenPayload {
  userId: string;
  role: string;
  email?: string;
  type: string;
  iat: number;
  exp: number;
}

function extractBearerToken(event: AuthorizerEvent): string | null {
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

export const handler = async (
  event: AuthorizerEvent
): Promise<SimpleAuthorizerResponse> => {
  const token = extractBearerToken(event);

  if (!token) {
    return { isAuthorized: false };
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET environment variable is not set');
    return { isAuthorized: false };
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as TokenPayload;

    if (decoded.type !== 'access') {
      console.warn('Token type is not access:', decoded.type);
      return { isAuthorized: false };
    }

    if (!decoded.userId || !decoded.role) {
      console.warn('Token missing required claims');
      return { isAuthorized: false };
    }

    return {
      isAuthorized: true,
      context: {
        userId: decoded.userId,
        role: decoded.role,
        email: decoded.email || '',
      },
    };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      console.info('Token expired');
    } else if (err instanceof jwt.JsonWebTokenError) {
      console.warn('Invalid token:', (err as Error).message);
    } else {
      console.error('Unexpected error verifying token:', err);
    }

    return { isAuthorized: false };
  }
};
