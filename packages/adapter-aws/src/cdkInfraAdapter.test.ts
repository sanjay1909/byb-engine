/**
 * Tests for cdkInfraAdapter.ts
 *
 * Covers:
 * - provision: sends CreateStackCommand with correct parameters and tags
 * - provision: handles errors gracefully
 * - getStatus: maps CloudFormation statuses to simplified statuses
 * - getStatus: extracts stack outputs
 * - destroy: sends DeleteStackCommand
 * - Satisfies InfraAdapter contract
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCdkInfraAdapter } from './cdkInfraAdapter.js';
import { assertAdapterContract, INFRA_ADAPTER_REQUIRED_METHODS } from '@byb/core';

function createMockCfClient() {
  return { send: vi.fn() };
}

describe('createCdkInfraAdapter', () => {
  let mockClient: ReturnType<typeof createMockCfClient>;
  let adapter: ReturnType<typeof createCdkInfraAdapter>;

  beforeEach(() => {
    mockClient = createMockCfClient();
    adapter = createCdkInfraAdapter({
      region: 'us-east-1',
      templateUrl: 'https://s3.amazonaws.com/templates/store.yaml',
      stackNamePrefix: 'byb-store',
      cloudFormationClient: mockClient as any,
    });
  });

  it('satisfies the InfraAdapter contract', () => {
    assertAdapterContract(
      adapter as unknown as Record<string, unknown>,
      [...INFRA_ADAPTER_REQUIRED_METHODS],
      'aws-cdk',
      'infra',
    );
  });

  describe('provision', () => {
    it('creates CloudFormation stack with correct parameters', async () => {
      mockClient.send.mockResolvedValue({});

      const result = await adapter.provision({
        storeId: 'my-store',
        region: 'us-east-1',
        storeName: 'My Store',
        features: {
          database: true,
          storage: true,
          cdn: true,
          email: true,
          scheduler: false,
        },
      });

      expect(result.stackId).toBe('byb-store-my-store');
      expect(result.status).toBe('in_progress');

      const command = mockClient.send.mock.calls[0][0];
      expect(command.input.StackName).toBe('byb-store-my-store');
      expect(command.input.TemplateURL).toBe(
        'https://s3.amazonaws.com/templates/store.yaml',
      );

      // Check parameters
      const params = command.input.Parameters;
      expect(params).toContainEqual({
        ParameterKey: 'StoreId',
        ParameterValue: 'my-store',
      });
      expect(params).toContainEqual({
        ParameterKey: 'EnableScheduler',
        ParameterValue: 'false',
      });

      // Check tags
      expect(command.input.Tags).toContainEqual({
        Key: 'byb:store-id',
        Value: 'my-store',
      });
    });

    it('returns failed status on error', async () => {
      mockClient.send.mockRejectedValue(new Error('Stack already exists'));

      const result = await adapter.provision({
        storeId: 'dup-store',
        region: 'us-east-1',
        storeName: 'Dup',
        features: {
          database: true,
          storage: true,
          cdn: true,
          email: false,
          scheduler: false,
        },
      });

      expect(result.status).toBe('failed');
      expect(result.errorMessage).toContain('Stack already exists');
    });
  });

  describe('getStatus', () => {
    it('maps CREATE_COMPLETE to completed', async () => {
      mockClient.send.mockResolvedValue({
        Stacks: [
          {
            StackStatus: 'CREATE_COMPLETE',
            Outputs: [
              { OutputKey: 'ApiUrl', OutputValue: 'https://api.example.com' },
              { OutputKey: 'TableName', OutputValue: 'byb-my-store' },
            ],
          },
        ],
      });

      const result = await adapter.getStatus({
        storeId: 'my-store',
        stackId: 'byb-store-my-store',
      });

      expect(result.status).toBe('completed');
      expect(result.outputs).toEqual({
        ApiUrl: 'https://api.example.com',
        TableName: 'byb-my-store',
      });
    });

    it('maps CREATE_IN_PROGRESS to in_progress', async () => {
      mockClient.send.mockResolvedValue({
        Stacks: [{ StackStatus: 'CREATE_IN_PROGRESS' }],
      });

      const result = await adapter.getStatus({
        storeId: 'x',
        stackId: 'byb-store-x',
      });
      expect(result.status).toBe('in_progress');
    });

    it('maps ROLLBACK_COMPLETE to failed', async () => {
      mockClient.send.mockResolvedValue({
        Stacks: [{
          StackStatus: 'ROLLBACK_COMPLETE',
          StackStatusReason: 'Resource creation failed',
        }],
      });

      const result = await adapter.getStatus({
        storeId: 'x',
        stackId: 'byb-store-x',
      });
      expect(result.status).toBe('failed');
      expect(result.errorMessage).toContain('Resource creation failed');
    });

    it('returns failed when stack not found', async () => {
      mockClient.send.mockResolvedValue({ Stacks: [] });

      const result = await adapter.getStatus({
        storeId: 'gone',
        stackId: 'byb-store-gone',
      });
      expect(result.status).toBe('failed');
      expect(result.errorMessage).toBe('Stack not found');
    });
  });

  describe('destroy', () => {
    it('sends DeleteStackCommand', async () => {
      mockClient.send.mockResolvedValue({});

      await adapter.destroy({
        storeId: 'my-store',
        stackId: 'byb-store-my-store',
      });

      const command = mockClient.send.mock.calls[0][0];
      expect(command.input.StackName).toBe('byb-store-my-store');
    });
  });
});
