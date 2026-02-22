/**
 * Tests for ssmSecretsAdapter.ts — validates the SSM SecretsAdapter implementation.
 *
 * Covers:
 * - getSecret: returns value, handles not found, decryption flag
 * - putSecret: sends PutParameterCommand with correct type
 * - deleteSecret: sends DeleteParameterCommand
 * - Satisfies SecretsAdapter contract
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSsmSecretsAdapter } from './ssmSecretsAdapter.js';
import { assertAdapterContract, SECRETS_ADAPTER_REQUIRED_METHODS } from '@byb/core';

function createMockSsmClient() {
  return { send: vi.fn() };
}

describe('createSsmSecretsAdapter', () => {
  let mockClient: ReturnType<typeof createMockSsmClient>;
  let adapter: ReturnType<typeof createSsmSecretsAdapter>;

  beforeEach(() => {
    mockClient = createMockSsmClient();
    adapter = createSsmSecretsAdapter({
      region: 'us-east-1',
      ssmClient: mockClient as any,
    });
  });

  it('satisfies the SecretsAdapter contract', () => {
    assertAdapterContract(
      adapter as unknown as Record<string, unknown>,
      [...SECRETS_ADAPTER_REQUIRED_METHODS],
      'ssm',
      'secrets',
    );
  });

  describe('getSecret', () => {
    it('returns secret value', async () => {
      mockClient.send.mockResolvedValue({
        Parameter: { Value: 'sk_test_abc123' },
      });

      const value = await adapter.getSecret({
        name: '/byb/stores/my-store/stripe-key',
      });

      expect(value).toBe('sk_test_abc123');
      const command = mockClient.send.mock.calls[0][0];
      expect(command.input.Name).toBe('/byb/stores/my-store/stripe-key');
      expect(command.input.WithDecryption).toBe(true);
    });

    it('returns null when parameter not found', async () => {
      const err = new Error('Parameter not found');
      err.name = 'ParameterNotFound';
      mockClient.send.mockRejectedValue(err);

      const value = await adapter.getSecret({ name: '/nonexistent' });
      expect(value).toBeNull();
    });

    it('throws on other errors', async () => {
      mockClient.send.mockRejectedValue(new Error('Access denied'));

      await expect(
        adapter.getSecret({ name: '/restricted' }),
      ).rejects.toThrow('Access denied');
    });
  });

  describe('putSecret', () => {
    it('stores as SecureString by default', async () => {
      mockClient.send.mockResolvedValue({});

      await adapter.putSecret({
        name: '/byb/stores/my-store/api-key',
        value: 'secret-value',
        description: 'API Key',
      });

      const command = mockClient.send.mock.calls[0][0];
      expect(command.input.Type).toBe('SecureString');
      expect(command.input.Overwrite).toBe(true);
    });

    it('stores as plain String when encrypted=false', async () => {
      mockClient.send.mockResolvedValue({});

      await adapter.putSecret({
        name: '/byb/stores/my-store/public-config',
        value: 'non-secret',
        encrypted: false,
      });

      const command = mockClient.send.mock.calls[0][0];
      expect(command.input.Type).toBe('String');
    });
  });

  describe('deleteSecret', () => {
    it('sends DeleteParameterCommand', async () => {
      mockClient.send.mockResolvedValue({});

      await adapter.deleteSecret({ name: '/byb/stores/my-store/old-key' });

      const command = mockClient.send.mock.calls[0][0];
      expect(command.input.Name).toBe('/byb/stores/my-store/old-key');
    });
  });
});
