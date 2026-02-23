/**
 * mockCdnAdapter.ts — In-memory mock implementation of CdnAdapter.
 *
 * Tracks CDN distributions and cache invalidation requests.
 * Generates mock distribution IDs and CDN domain names.
 * Provides inspector methods for testing and verification.
 */

import type {
  CdnAdapter,
  CdnCreateParams,
  CdnCreateResult,
  CdnInvalidateParams,
} from '@byb/core';

declare function setTimeout(callback: () => void, ms: number): unknown;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface MockCdnAdapterOptions {
  /** Artificial delay in ms for each operation (default: 0) */
  delay?: number;
}

export interface MockDistribution {
  originDomain: string;
  cdnDomain: string;
}

export interface MockInvalidation {
  distributionId: string;
  paths: string[];
}

export interface MockCdnAdapter extends CdnAdapter {
  /** Returns all created distributions */
  getDistributions(): Map<string, MockDistribution>;
  /** Returns all cache invalidation requests */
  getInvalidations(): MockInvalidation[];
  /** Resets all distributions and invalidations */
  clear(): void;
}

/**
 * Creates an in-memory mock CDN adapter.
 *
 * Distributions are stored in a Map keyed by auto-generated distribution ID.
 * Invalidation requests are pushed to an array for inspection.
 */
export function createMockCdnAdapter(
  options?: MockCdnAdapterOptions,
): MockCdnAdapter {
  const delay = options?.delay ?? 0;
  let idCounter = 0;
  const distributions = new Map<string, MockDistribution>();
  const invalidations: MockInvalidation[] = [];

  return {
    async createDistribution(
      params: CdnCreateParams | Record<string, unknown>,
    ): Promise<CdnCreateResult> {
      if (delay) await wait(delay);
      idCounter++;
      const distributionId = `mock-cdn-${idCounter}`;
      const cdnDomain = `mock-${idCounter}.cdn.local`;
      // Support both typed CdnCreateParams and provisioning params
      const originDomain =
        (params as CdnCreateParams).originDomain ??
        `mock-origin-${(params as Record<string, unknown>).storeId ?? 'unknown'}.storage.local`;
      distributions.set(distributionId, {
        originDomain,
        cdnDomain,
      });
      return { distributionId, cdnDomain };
    },

    async invalidateCache(params: CdnInvalidateParams): Promise<void> {
      if (delay) await wait(delay);
      invalidations.push({
        distributionId: params.distributionId,
        paths: [...params.paths],
      });
    },

    async getDistributionDomain(distributionId: string): Promise<string> {
      if (delay) await wait(delay);
      const dist = distributions.get(distributionId);
      if (!dist) {
        throw new Error(
          `CDN distribution "${distributionId}" not found in mock adapter`,
        );
      }
      return dist.cdnDomain;
    },

    getDistributions(): Map<string, MockDistribution> {
      return distributions;
    },

    getInvalidations(): MockInvalidation[] {
      return invalidations;
    },

    clear(): void {
      distributions.clear();
      invalidations.length = 0;
      idCounter = 0;
    },
  };
}
