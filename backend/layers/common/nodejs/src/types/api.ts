export interface APIGatewayProxyEventV2 {
  version: string;
  routeKey: string;
  rawPath: string;
  rawQueryString: string;
  headers: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  pathParameters?: Record<string, string>;
  body?: string;
  isBase64Encoded: boolean;
  requestContext: {
    accountId: string;
    apiId: string;
    authorizer?: {
      lambda?: Record<string, string>;
      jwt?: {
        claims: Record<string, string>;
        scopes: string[];
      };
    };
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
  stageVariables?: Record<string, string>;
}

export interface HandlerResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export interface AuthContext {
  userId: string;
  role: string;
  email?: string;
}

export interface LambdaAuthorizerEventV2 {
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

export interface SimpleAuthorizerResponse {
  isAuthorized: boolean;
  context?: Record<string, string>;
}
