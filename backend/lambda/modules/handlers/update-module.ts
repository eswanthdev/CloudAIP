import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand, PutCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

function padOrder(order: number): string {
  return String(order).padStart(3, '0');
}

async function findModuleById(moduleId: string): Promise<Record<string, any> | null> {
  // Query GSI3 for entityType=MODULE, then filter by moduleId
  // Or scan with filter - since modules are under COURSE# PKs, we need to find it
  // Use GSI3-EntityTypeIndex to find the module
  const result = await docClient.send(
    new QueryCommand({
      TableName: MAIN_TABLE,
      IndexName: 'GSI3-EntityTypeIndex',
      KeyConditionExpression: 'entityType = :entityType',
      FilterExpression: 'moduleId = :moduleId',
      ExpressionAttributeValues: {
        ':entityType': 'MODULE',
        ':moduleId': moduleId,
      },
      Limit: 1,
    })
  );

  return result.Items?.[0] || null;
}

export const updateModule = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const authUser = getUserFromEvent(event);
  if (!authUser || authUser.role !== 'admin') {
    return error(403, 'Admin access required');
  }

  const moduleId = event.pathParameters?.moduleId;
  if (!moduleId) {
    return error(400, 'Module ID is required');
  }

  let body: { title?: string; description?: string; order?: number };
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error(400, 'Invalid JSON body');
  }

  // Find the existing module
  const existingModule = await findModuleById(moduleId);
  if (!existingModule) {
    return error(404, 'Module not found');
  }

  const now = new Date().toISOString();
  const courseId = existingModule.courseId;
  const currentSk = existingModule.sk;
  const newOrder = body.order;

  // If order changed, we need to delete old SK and create new one
  if (newOrder !== undefined && newOrder !== existingModule.order) {
    const paddedOrder = padOrder(newOrder);
    const newSk = `MODULE#${paddedOrder}#${moduleId}`;

    // Build updated module item
    const updatedModule = {
      ...existingModule,
      sk: newSk,
      title: body.title ?? existingModule.title,
      description: body.description !== undefined ? body.description : existingModule.description,
      order: newOrder,
      updatedAt: now,
    };

    // Delete old item and put new one
    await docClient.send(
      new DeleteCommand({
        TableName: MAIN_TABLE,
        Key: { pk: `COURSE#${courseId}`, sk: currentSk },
      })
    );

    await docClient.send(
      new PutCommand({
        TableName: MAIN_TABLE,
        Item: updatedModule,
      })
    );

    return success(200, { module: updatedModule });
  }

  // No order change - use UpdateCommand
  const updateParts: string[] = [];
  const exprAttrNames: Record<string, string> = {};
  const exprAttrValues: Record<string, any> = {};

  if (body.title !== undefined) {
    updateParts.push('#title = :title');
    exprAttrNames['#title'] = 'title';
    exprAttrValues[':title'] = body.title;
  }

  if (body.description !== undefined) {
    updateParts.push('#description = :description');
    exprAttrNames['#description'] = 'description';
    exprAttrValues[':description'] = body.description;
  }

  if (updateParts.length === 0) {
    return error(400, 'No valid fields to update');
  }

  updateParts.push('#updatedAt = :updatedAt');
  exprAttrNames['#updatedAt'] = 'updatedAt';
  exprAttrValues[':updatedAt'] = now;

  const result = await docClient.send(
    new UpdateCommand({
      TableName: MAIN_TABLE,
      Key: { pk: `COURSE#${courseId}`, sk: currentSk },
      UpdateExpression: `SET ${updateParts.join(', ')}`,
      ExpressionAttributeNames: exprAttrNames,
      ExpressionAttributeValues: exprAttrValues,
      ReturnValues: 'ALL_NEW',
    })
  );

  return success(200, { module: result.Attributes });
};
