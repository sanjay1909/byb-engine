/**
 * dynamoDbAdapter.ts — AWS DynamoDB implementation of DbAdapter.
 *
 * Wraps the AWS SDK v3 DynamoDB Document Client to implement the generic
 * DbAdapter interface from @byb/core. Uses the single-table design pattern
 * where all items share one table with PK/SK keys.
 *
 * The adapter is created via a factory function that receives an AdapterContext
 * with the table name and optional region/credentials.
 *
 * How it connects to the system:
 * - Registered in the adapter registry under domain 'db' with ID 'dynamodb'
 * - Resolved at request time via the store profile (profile.adapters.db = 'dynamodb')
 * - Called by the provisioning bridge and runtime service handlers
 *
 * Usage:
 *   import { createDynamoDbAdapter } from '@byb/adapter-aws';
 *   const adapter = createDynamoDbAdapter({ tableName: 'my-table', region: 'us-east-1' });
 *   const item = await adapter.get({ pk: 'PRODUCT#123', sk: 'META' });
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import type {
  DbAdapter,
  DbGetParams,
  DbPutParams,
  DbDeleteParams,
  DbQueryParams,
  DbQueryResult,
  DbTransactionItem,
} from '@byb/core';

/**
 * Configuration options for the DynamoDB adapter.
 */
export interface DynamoDbAdapterOptions {
  /** DynamoDB table name */
  tableName: string;
  /** AWS region (e.g., 'us-east-1') */
  region?: string;
  /** Optional: inject a pre-configured DynamoDB Document Client (for testing) */
  documentClient?: DynamoDBDocumentClient;
}

/**
 * Creates a DynamoDB adapter implementing the DbAdapter interface.
 *
 * @param options - Table name, region, and optional injected client
 * @returns A DbAdapter instance backed by DynamoDB
 */
export function createDynamoDbAdapter(options: DynamoDbAdapterOptions): DbAdapter {
  const { tableName, region } = options;

  // Use injected client or create a new one
  const docClient =
    options.documentClient ??
    DynamoDBDocumentClient.from(
      new DynamoDBClient({ region }),
      {
        marshallOptions: { removeUndefinedValues: true },
      },
    );

  return {
    async get(params: DbGetParams): Promise<Record<string, unknown> | null> {
      const result = await docClient.send(
        new GetCommand({
          TableName: tableName,
          Key: { PK: params.pk, SK: params.sk },
        }),
      );
      return (result.Item as Record<string, unknown>) ?? null;
    },

    async put(params: DbPutParams): Promise<void> {
      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: params.item,
        }),
      );
    },

    async delete(params: DbDeleteParams): Promise<void> {
      await docClient.send(
        new DeleteCommand({
          TableName: tableName,
          Key: { PK: params.pk, SK: params.sk },
        }),
      );
    },

    async query(params: DbQueryParams): Promise<DbQueryResult> {
      const expressionValues: Record<string, unknown> = {
        ':pk': params.pk,
      };
      let keyCondition = 'PK = :pk';

      if (params.skPrefix) {
        keyCondition += ' AND begins_with(SK, :skPrefix)';
        expressionValues[':skPrefix'] = params.skPrefix;
      }

      const result = await docClient.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: params.indexName,
          KeyConditionExpression: keyCondition,
          ExpressionAttributeValues: expressionValues,
          Limit: params.limit,
          ExclusiveStartKey: params.nextToken
            ? JSON.parse(params.nextToken)
            : undefined,
        }),
      );

      return {
        items: (result.Items as Record<string, unknown>[]) ?? [],
        nextToken: result.LastEvaluatedKey
          ? JSON.stringify(result.LastEvaluatedKey)
          : undefined,
      };
    },

    async transactWrite(items: DbTransactionItem[]): Promise<void> {
      const transactItems = items.map((item) => {
        if (item.type === 'put') {
          const putParams = item.params as DbPutParams;
          return {
            Put: {
              TableName: tableName,
              Item: putParams.item,
            },
          };
        } else {
          const deleteParams = item.params as DbDeleteParams;
          return {
            Delete: {
              TableName: tableName,
              Key: { PK: deleteParams.pk, SK: deleteParams.sk },
            },
          };
        }
      });

      await docClient.send(
        new TransactWriteCommand({ TransactItems: transactItems }),
      );
    },
  };
}
