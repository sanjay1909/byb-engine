/**
 * Tests for dynamoDbAdapter.ts — validates the DynamoDB DbAdapter implementation.
 *
 * Uses mock DynamoDB Document Client to test adapter operations without
 * real AWS calls. Verifies correct command construction and response mapping.
 *
 * Covers:
 * - get: returns item or null
 * - put: sends PutCommand with correct table/item
 * - delete: sends DeleteCommand with correct key
 * - query: key condition, skPrefix, pagination
 * - transactWrite: builds correct TransactWriteCommand
 * - Satisfies DbAdapter contract
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDynamoDbAdapter } from './dynamoDbAdapter.js';
import { assertAdapterContract, DB_ADAPTER_REQUIRED_METHODS } from '@byb/core';

// Mock the DynamoDB Document Client
function createMockDocClient() {
  return {
    send: vi.fn(),
  };
}

describe('createDynamoDbAdapter', () => {
  let mockDocClient: ReturnType<typeof createMockDocClient>;
  let adapter: ReturnType<typeof createDynamoDbAdapter>;

  beforeEach(() => {
    mockDocClient = createMockDocClient();
    adapter = createDynamoDbAdapter({
      tableName: 'test-table',
      region: 'us-east-1',
      documentClient: mockDocClient as any,
    });
  });

  it('satisfies the DbAdapter contract', () => {
    assertAdapterContract(
      adapter as unknown as Record<string, unknown>,
      [...DB_ADAPTER_REQUIRED_METHODS],
      'dynamodb',
      'db',
    );
  });

  describe('get', () => {
    it('returns item when found', async () => {
      mockDocClient.send.mockResolvedValue({
        Item: { PK: 'PRODUCT#1', SK: 'META', name: 'Test Product' },
      });

      const result = await adapter.get({ pk: 'PRODUCT#1', sk: 'META' });

      expect(result).toEqual({
        PK: 'PRODUCT#1',
        SK: 'META',
        name: 'Test Product',
      });
      expect(mockDocClient.send).toHaveBeenCalledOnce();
    });

    it('returns null when item not found', async () => {
      mockDocClient.send.mockResolvedValue({});

      const result = await adapter.get({ pk: 'PRODUCT#999', sk: 'META' });

      expect(result).toBeNull();
    });

    it('sends GetCommand with correct table and key', async () => {
      mockDocClient.send.mockResolvedValue({});

      await adapter.get({ pk: 'ORDER#5', sk: 'DETAIL' });

      const command = mockDocClient.send.mock.calls[0][0];
      expect(command.input).toEqual({
        TableName: 'test-table',
        Key: { PK: 'ORDER#5', SK: 'DETAIL' },
      });
    });
  });

  describe('put', () => {
    it('sends PutCommand with item', async () => {
      mockDocClient.send.mockResolvedValue({});

      await adapter.put({
        item: { PK: 'PRODUCT#1', SK: 'META', name: 'Widget', price: 9.99 },
      });

      const command = mockDocClient.send.mock.calls[0][0];
      expect(command.input).toEqual({
        TableName: 'test-table',
        Item: { PK: 'PRODUCT#1', SK: 'META', name: 'Widget', price: 9.99 },
      });
    });
  });

  describe('delete', () => {
    it('sends DeleteCommand with correct key', async () => {
      mockDocClient.send.mockResolvedValue({});

      await adapter.delete({ pk: 'PRODUCT#1', sk: 'META' });

      const command = mockDocClient.send.mock.calls[0][0];
      expect(command.input).toEqual({
        TableName: 'test-table',
        Key: { PK: 'PRODUCT#1', SK: 'META' },
      });
    });
  });

  describe('query', () => {
    it('queries by partition key', async () => {
      mockDocClient.send.mockResolvedValue({
        Items: [
          { PK: 'PRODUCT#1', SK: 'META', name: 'A' },
          { PK: 'PRODUCT#1', SK: 'VARIANT#1', color: 'red' },
        ],
      });

      const result = await adapter.query({ pk: 'PRODUCT#1' });

      expect(result.items).toHaveLength(2);
      expect(result.nextToken).toBeUndefined();
    });

    it('includes sort key prefix filter', async () => {
      mockDocClient.send.mockResolvedValue({ Items: [] });

      await adapter.query({ pk: 'PRODUCT#1', skPrefix: 'VARIANT#' });

      const command = mockDocClient.send.mock.calls[0][0];
      expect(command.input.KeyConditionExpression).toContain(
        'begins_with(SK, :skPrefix)',
      );
      expect(command.input.ExpressionAttributeValues[':skPrefix']).toBe(
        'VARIANT#',
      );
    });

    it('handles pagination with nextToken', async () => {
      const lastKey = { PK: 'P#1', SK: 'V#5' };
      mockDocClient.send.mockResolvedValue({
        Items: [{ PK: 'P#1', SK: 'V#6' }],
        LastEvaluatedKey: lastKey,
      });

      const result = await adapter.query({ pk: 'P#1', limit: 1 });

      expect(result.nextToken).toBe(JSON.stringify(lastKey));
    });

    it('passes limit and indexName', async () => {
      mockDocClient.send.mockResolvedValue({ Items: [] });

      await adapter.query({
        pk: 'GSI#key',
        indexName: 'GSI1',
        limit: 10,
      });

      const command = mockDocClient.send.mock.calls[0][0];
      expect(command.input.IndexName).toBe('GSI1');
      expect(command.input.Limit).toBe(10);
    });
  });

  describe('transactWrite', () => {
    it('builds TransactWriteCommand with put and delete items', async () => {
      mockDocClient.send.mockResolvedValue({});

      await adapter.transactWrite([
        {
          type: 'put',
          params: { item: { PK: 'P#1', SK: 'META', name: 'New' } },
        },
        {
          type: 'delete',
          params: { pk: 'P#2', sk: 'META' },
        },
      ]);

      const command = mockDocClient.send.mock.calls[0][0];
      expect(command.input.TransactItems).toHaveLength(2);
      expect(command.input.TransactItems[0].Put).toBeDefined();
      expect(command.input.TransactItems[0].Put.TableName).toBe('test-table');
      expect(command.input.TransactItems[1].Delete).toBeDefined();
      expect(command.input.TransactItems[1].Delete.Key).toEqual({
        PK: 'P#2',
        SK: 'META',
      });
    });
  });
});
