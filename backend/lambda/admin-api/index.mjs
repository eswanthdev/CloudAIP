import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const TABLE_NAME = process.env.TABLE_NAME;

const VALID_STATUSES = new Set(['new', 'contacted', 'qualified', 'converted', 'lost']);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

// ---------------------------------------------------------------------------
// GET /api/leads
// ---------------------------------------------------------------------------

async function getLeads(event) {
  const qs = event.queryStringParameters || {};
  const status = qs.status || 'new';
  const limit = Math.min(Math.max(parseInt(qs.limit, 10) || 50, 1), 200);

  let exclusiveStartKey;
  if (qs.lastKey) {
    try {
      exclusiveStartKey = JSON.parse(Buffer.from(qs.lastKey, 'base64url').toString('utf-8'));
    } catch {
      return response(400, { success: false, error: 'Invalid pagination token.' });
    }
  }

  const params = {
    TableName: TABLE_NAME,
    IndexName: 'StatusIndex',
    KeyConditionExpression: '#s = :status',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':status': status },
    Limit: limit,
    ScanIndexForward: false, // newest first
  };

  if (exclusiveStartKey) {
    params.ExclusiveStartKey = exclusiveStartKey;
  }

  const result = await docClient.send(new QueryCommand(params));

  const responseBody = {
    success: true,
    leads: result.Items || [],
    count: result.Count || 0,
  };

  if (result.LastEvaluatedKey) {
    responseBody.lastKey = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64url');
  }

  return response(200, responseBody);
}

// ---------------------------------------------------------------------------
// PUT /api/leads/{leadId}
// ---------------------------------------------------------------------------

async function updateLead(event) {
  const leadId = event.pathParameters?.leadId;
  if (!leadId) {
    return response(400, { success: false, error: 'leadId is required.' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return response(400, { success: false, error: 'Invalid JSON body.' });
  }

  const { status, notes, createdAt } = body;

  if (!createdAt) {
    return response(400, { success: false, error: 'createdAt is required to identify the lead.' });
  }

  if (!status) {
    return response(400, { success: false, error: 'status is required.' });
  }

  if (!VALID_STATUSES.has(status)) {
    return response(400, {
      success: false,
      error: `Invalid status. Must be one of: ${[...VALID_STATUSES].join(', ')}`,
    });
  }

  const now = new Date().toISOString();

  const updateExprParts = ['#s = :status', '#u = :updatedAt'];
  const exprAttrNames = { '#s': 'status', '#u': 'updatedAt' };
  const exprAttrValues = { ':status': status, ':updatedAt': now };

  if (notes !== undefined) {
    updateExprParts.push('#n = :notes');
    exprAttrNames['#n'] = 'notes';
    exprAttrValues[':notes'] = notes;
  }

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { leadId, createdAt },
      UpdateExpression: `SET ${updateExprParts.join(', ')}`,
      ExpressionAttributeNames: exprAttrNames,
      ExpressionAttributeValues: exprAttrValues,
      ReturnValues: 'ALL_NEW',
      ConditionExpression: 'attribute_exists(leadId)',
    }),
  );

  return response(200, {
    success: true,
    lead: result.Attributes,
  });
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const handler = async (event) => {
  try {
    const method = event.requestContext?.http?.method || event.httpMethod;
    const path = event.requestContext?.http?.path || event.path;

    // Route: GET /api/leads
    if (method === 'GET' && path === '/api/leads') {
      return await getLeads(event);
    }

    // Route: PUT /api/leads/{leadId}
    if (method === 'PUT' && path.startsWith('/api/leads/')) {
      return await updateLead(event);
    }

    return response(404, { success: false, error: 'Not found.' });
  } catch (err) {
    console.error('Unhandled error:', err);

    // DynamoDB condition check failure (item not found)
    if (err.name === 'ConditionalCheckFailedException') {
      return response(404, { success: false, error: 'Lead not found.' });
    }

    return response(500, {
      success: false,
      error: 'An internal error occurred. Please try again later.',
    });
  }
};
