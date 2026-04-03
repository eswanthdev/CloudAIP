import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export function getMainTable(): string {
  const table = process.env.MAIN_TABLE;
  if (!table) {
    throw new Error('MAIN_TABLE environment variable is not set');
  }
  return table;
}

export function getActivityTable(): string {
  const table = process.env.ACTIVITY_TABLE;
  if (!table) {
    throw new Error('ACTIVITY_TABLE environment variable is not set');
  }
  return table;
}

export function getLeadsTable(): string {
  const table = process.env.LEADS_TABLE;
  if (!table) {
    throw new Error('LEADS_TABLE environment variable is not set');
  }
  return table;
}

/** Convenience constants - read table names from env once at cold start */
export const MAIN_TABLE = process.env.MAIN_TABLE || '';
export const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE || '';
export const LEADS_TABLE = process.env.LEADS_TABLE || '';
