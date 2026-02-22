/**
 * Tests for cloudfrontCdnAdapter.ts
 *
 * Covers:
 * - createDistribution: returns placeholder result
 * - invalidateCache: sends CreateInvalidationCommand with correct paths
 * - getDistributionDomain: returns domain from GetDistributionCommand
 * - Satisfies CdnAdapter contract
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCloudfrontCdnAdapter } from './cloudfrontCdnAdapter.js';
import { assertAdapterContract, CDN_ADAPTER_REQUIRED_METHODS } from '@byb/core';

function createMockCfClient() {
  return { send: vi.fn() };
}

describe('createCloudfrontCdnAdapter', () => {
  let mockClient: ReturnType<typeof createMockCfClient>;
  let adapter: ReturnType<typeof createCloudfrontCdnAdapter>;

  beforeEach(() => {
    mockClient = createMockCfClient();
    adapter = createCloudfrontCdnAdapter({
      region: 'us-east-1',
      cloudFrontClient: mockClient as any,
    });
  });

  it('satisfies the CdnAdapter contract', () => {
    assertAdapterContract(
      adapter as unknown as Record<string, unknown>,
      [...CDN_ADAPTER_REQUIRED_METHODS],
      'cloudfront',
      'cdn',
    );
  });

  describe('createDistribution', () => {
    it('returns a pending distribution result', async () => {
      const result = await adapter.createDistribution({
        originDomain: 'test-bucket.s3.amazonaws.com',
      });

      expect(result.distributionId).toContain('pending-');
      expect(result.cdnDomain).toContain('cloudfront.net');
    });
  });

  describe('invalidateCache', () => {
    it('sends invalidation with correct paths', async () => {
      mockClient.send.mockResolvedValue({});

      await adapter.invalidateCache({
        distributionId: 'E1ABC2DEF3',
        paths: ['/index.html', '/assets/*'],
      });

      const command = mockClient.send.mock.calls[0][0];
      expect(command.input.DistributionId).toBe('E1ABC2DEF3');
      expect(command.input.InvalidationBatch.Paths.Items).toEqual([
        '/index.html',
        '/assets/*',
      ]);
      expect(command.input.InvalidationBatch.Paths.Quantity).toBe(2);
    });
  });

  describe('getDistributionDomain', () => {
    it('returns domain name from CloudFront', async () => {
      mockClient.send.mockResolvedValue({
        Distribution: { DomainName: 'd1234abc.cloudfront.net' },
      });

      const domain = await adapter.getDistributionDomain('E1ABC2DEF3');

      expect(domain).toBe('d1234abc.cloudfront.net');
    });

    it('returns empty string when distribution has no domain', async () => {
      mockClient.send.mockResolvedValue({ Distribution: {} });

      const domain = await adapter.getDistributionDomain('E1ABC2DEF3');
      expect(domain).toBe('');
    });
  });
});
