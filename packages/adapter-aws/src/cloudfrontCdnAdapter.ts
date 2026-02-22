/**
 * cloudfrontCdnAdapter.ts — AWS CloudFront implementation of CdnAdapter.
 *
 * Wraps the AWS SDK v3 CloudFront client for CDN distribution management.
 * Handles creating distributions, cache invalidation, and domain lookup.
 *
 * How it connects to the system:
 * - Registered under domain 'cdn' with ID 'cloudfront'
 * - Resolved via store profile (profile.adapters.cdn = 'cloudfront')
 * - Used during provisioning to set up content delivery for the storefront
 *
 * Note: Full distribution creation is complex in CloudFront (requires origin
 * configs, behaviors, etc.). This adapter provides the interface; the full
 * CDK-based provisioning in the infra adapter handles the heavy lifting.
 * This adapter is primarily used for cache invalidation and domain lookups
 * on existing distributions.
 */

import {
  CloudFrontClient,
  CreateInvalidationCommand,
  GetDistributionCommand,
} from '@aws-sdk/client-cloudfront';
import type {
  CdnAdapter,
  CdnCreateParams,
  CdnCreateResult,
  CdnInvalidateParams,
} from '@byb/core';

export interface CloudfrontCdnAdapterOptions {
  region?: string;
  cloudFrontClient?: CloudFrontClient;
}

export function createCloudfrontCdnAdapter(
  options: CloudfrontCdnAdapterOptions,
): CdnAdapter {
  const client =
    options.cloudFrontClient ?? new CloudFrontClient({ region: options.region });

  return {
    async createDistribution(params: CdnCreateParams): Promise<CdnCreateResult> {
      // CloudFront distribution creation is handled by the CDK infra adapter.
      // This method is available for programmatic creation but in practice
      // the infra adapter's provisionStack handles the full setup.
      //
      // For now, this returns a placeholder — the infra adapter provides the
      // real distribution ID after CDK deployment.
      return {
        distributionId: `pending-${Date.now()}`,
        cdnDomain: `pending.cloudfront.net`,
      };
    },

    async invalidateCache(params: CdnInvalidateParams): Promise<void> {
      await client.send(
        new CreateInvalidationCommand({
          DistributionId: params.distributionId,
          InvalidationBatch: {
            CallerReference: `byb-${Date.now()}`,
            Paths: {
              Quantity: params.paths.length,
              Items: params.paths,
            },
          },
        }),
      );
    },

    async getDistributionDomain(distributionId: string): Promise<string> {
      const result = await client.send(
        new GetDistributionCommand({ Id: distributionId }),
      );
      return result.Distribution?.DomainName ?? '';
    },
  };
}
