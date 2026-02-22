/**
 * cdnAdapter.ts — Interface for CDN (Content Delivery Network) operations.
 *
 * Manages CDN distributions that serve the storefront static assets and
 * product images with edge caching.
 *
 * Cloud adapters implement it for their specific CDN:
 * - AWS: CloudFront
 * - Azure: Azure CDN / Front Door
 * - GCP: Cloud CDN
 */

/** Parameters for creating a CDN distribution */
export interface CdnCreateParams {
  /** Origin domain (e.g., S3 bucket domain, Blob Storage endpoint) */
  originDomain: string;
  /** Optional custom domain for the distribution */
  customDomain?: string;
  /** SSL certificate ARN/ID (required for custom domains) */
  certificateId?: string;
}

/** Result of CDN distribution creation */
export interface CdnCreateResult {
  /** CDN distribution ID */
  distributionId: string;
  /** CDN domain name (e.g., 'd1234.cloudfront.net') */
  cdnDomain: string;
}

/** Parameters for invalidating cached content */
export interface CdnInvalidateParams {
  /** CDN distribution ID */
  distributionId: string;
  /** Paths to invalidate (e.g., ['/index.html', '/assets/*']) */
  paths: string[];
}

/**
 * CDN adapter interface.
 *
 * Required methods contract: ['createDistribution', 'invalidateCache', 'getDistributionDomain']
 */
export interface CdnAdapter {
  /** Create a new CDN distribution pointing to a storage origin. */
  createDistribution(params: CdnCreateParams): Promise<CdnCreateResult>;

  /** Invalidate cached content at specified paths. */
  invalidateCache(params: CdnInvalidateParams): Promise<void>;

  /** Get the CDN domain for a distribution. */
  getDistributionDomain(distributionId: string): Promise<string>;
}

export const CDN_ADAPTER_REQUIRED_METHODS = [
  'createDistribution',
  'invalidateCache',
  'getDistributionDomain',
] as const;
