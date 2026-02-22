/**
 * Tests for storeProfileGenerator.ts
 *
 * Covers:
 * - Maps AWS cloud target to correct adapter IDs (dynamodb, s3, etc.)
 * - Maps Azure cloud target to correct adapter IDs
 * - Maps GCP cloud target to correct adapter IDs
 * - Throws for unsupported cloud provider
 * - Maps feature toggles to StoreFeatureFlags
 * - Sets match criteria (storeId, cloudProvider, region)
 * - Generates profileId from storeId
 * - Includes custom domain in deployment config
 * - Handles string payment provider (e.g., 'stripe')
 * - Helper: getSupportedCloudProviders returns all 3
 * - Helper: getAdapterSelectionsForProvider returns correct map
 */
import { describe, it, expect } from 'vitest';
import {
  generateStoreProfile,
  getSupportedCloudProviders,
  getAdapterSelectionsForProvider,
} from './storeProfileGenerator.js';
import type { WizardAnswers } from './types.js';

function createMinimalAnswers(
  overrides?: Partial<WizardAnswers>,
): WizardAnswers {
  return {
    business: {
      storeId: 'test-store',
      storeName: 'Test Store',
      siteUrl: 'https://teststore.com',
      supportEmail: 'help@teststore.com',
      currency: 'usd',
      ...overrides?.business,
    },
    shipping: {
      type: 'flat',
      flatRate: 10,
      ...overrides?.shipping,
    },
    branding: {
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
      ...overrides?.branding,
    },
    layout: {
      pages: [{ pageId: 'home', label: 'Home', enabled: true }],
      ...overrides?.layout,
    },
    features: {
      blog: true,
      campaigns: false,
      payments: 'stripe',
      analytics: true,
      oe: false,
      ...overrides?.features,
    },
    cloud: {
      provider: 'aws',
      region: 'us-east-1',
      ...overrides?.cloud,
    },
  };
}

describe('generateStoreProfile', () => {
  describe('AWS adapter mapping', () => {
    it('maps AWS cloud target to correct adapter IDs', () => {
      const profile = generateStoreProfile(
        createMinimalAnswers({
          cloud: { provider: 'aws', region: 'us-east-1' },
        }),
      );

      expect(profile.adapters).toEqual({
        db: 'dynamodb',
        storage: 's3',
        cdn: 'cloudfront',
        email: 'ses',
        secrets: 'ssm',
        scheduler: 'eventbridge',
        infra: 'aws-cdk',
      });
    });
  });

  describe('Azure adapter mapping', () => {
    it('maps Azure cloud target to correct adapter IDs', () => {
      const profile = generateStoreProfile(
        createMinimalAnswers({
          cloud: { provider: 'azure', region: 'eastus' },
        }),
      );

      expect(profile.adapters.db).toBe('cosmos-db');
      expect(profile.adapters.storage).toBe('blob-storage');
      expect(profile.adapters.cdn).toBe('azure-cdn');
      expect(profile.adapters.secrets).toBe('key-vault');
      expect(profile.adapters.infra).toBe('azure-arm');
    });
  });

  describe('GCP adapter mapping', () => {
    it('maps GCP cloud target to correct adapter IDs', () => {
      const profile = generateStoreProfile(
        createMinimalAnswers({
          cloud: { provider: 'gcp', region: 'us-central1' },
        }),
      );

      expect(profile.adapters.db).toBe('firestore');
      expect(profile.adapters.storage).toBe('cloud-storage');
      expect(profile.adapters.cdn).toBe('cloud-cdn');
      expect(profile.adapters.infra).toBe('gcp-terraform');
    });
  });

  it('throws for unsupported cloud provider', () => {
    expect(() =>
      generateStoreProfile(
        createMinimalAnswers({
          cloud: { provider: 'digitalocean' as any, region: 'nyc1' },
        }),
      ),
    ).toThrow("Unsupported cloud provider: 'digitalocean'");
  });

  describe('feature flags', () => {
    it('maps feature toggles to StoreFeatureFlags', () => {
      const profile = generateStoreProfile(
        createMinimalAnswers({
          features: {
            blog: true,
            campaigns: true,
            payments: 'stripe',
            analytics: false,
            oe: true,
          },
        }),
      );

      expect(profile.features).toEqual({
        blog: true,
        campaigns: true,
        payments: 'stripe',
        analytics: false,
        oe: true,
      });
    });

    it('handles boolean false for payments', () => {
      const profile = generateStoreProfile(
        createMinimalAnswers({
          features: {
            blog: false,
            campaigns: false,
            payments: false,
            analytics: false,
            oe: false,
          },
        }),
      );

      expect(profile.features.payments).toBe(false);
    });

    it('handles string payment provider', () => {
      const profile = generateStoreProfile(
        createMinimalAnswers({
          features: {
            blog: true,
            campaigns: true,
            payments: 'stripe',
            analytics: true,
            oe: true,
          },
        }),
      );

      expect(profile.features.payments).toBe('stripe');
    });
  });

  describe('profile identity and matching', () => {
    it('generates profileId from storeId', () => {
      const profile = generateStoreProfile(
        createMinimalAnswers({
          business: {
            storeId: 'charming-cherubs',
            storeName: 'Charming Cherubs',
            siteUrl: 'https://cc.com',
            supportEmail: 'a@b.com',
            currency: 'usd',
          },
        }),
      );

      expect(profile.profileId).toBe('store-charming-cherubs');
    });

    it('sets match criteria for profile resolution', () => {
      const profile = generateStoreProfile(
        createMinimalAnswers({
          business: {
            storeId: 'my-shop',
            storeName: 'My Shop',
            siteUrl: 'https://myshop.com',
            supportEmail: 'a@b.com',
            currency: 'eur',
          },
          cloud: { provider: 'aws', region: 'eu-west-1' },
        }),
      );

      expect(profile.match).toEqual({
        storeId: 'my-shop',
        cloudProvider: 'aws',
        region: 'eu-west-1',
      });
    });
  });

  describe('deployment config', () => {
    it('sets deployment region from cloud target', () => {
      const profile = generateStoreProfile(
        createMinimalAnswers({
          cloud: { provider: 'aws', region: 'ap-southeast-1' },
        }),
      );

      expect(profile.deployment.region).toBe('ap-southeast-1');
    });

    it('includes custom domain when provided', () => {
      const profile = generateStoreProfile(
        createMinimalAnswers({
          cloud: {
            provider: 'aws',
            region: 'us-east-1',
            customDomain: 'shop.example.com',
          },
        }),
      );

      expect(profile.deployment.customDomain).toBe('shop.example.com');
    });

    it('omits custom domain when not provided', () => {
      const profile = generateStoreProfile(
        createMinimalAnswers({
          cloud: { provider: 'aws', region: 'us-east-1' },
        }),
      );

      expect(profile.deployment.customDomain).toBeUndefined();
    });
  });

  it('scenario: full charming-cherubs profile', () => {
    const profile = generateStoreProfile(
      createMinimalAnswers({
        business: {
          storeId: 'charming-cherubs',
          storeName: 'Charming Cherubs',
          siteUrl: 'https://charmingcherubsco.com',
          supportEmail: 'cc@gmail.com',
          currency: 'usd',
        },
        features: {
          blog: true,
          campaigns: true,
          payments: 'stripe',
          analytics: true,
          oe: true,
        },
        cloud: {
          provider: 'aws',
          region: 'us-east-1',
          customDomain: 'charmingcherubsco.com',
        },
      }),
    );

    expect(profile.profileId).toBe('store-charming-cherubs');
    expect(profile.adapters.db).toBe('dynamodb');
    expect(profile.adapters.infra).toBe('aws-cdk');
    expect(profile.features.campaigns).toBe(true);
    expect(profile.features.payments).toBe('stripe');
    expect(profile.deployment.region).toBe('us-east-1');
    expect(profile.deployment.customDomain).toBe('charmingcherubsco.com');
  });
});

describe('getSupportedCloudProviders', () => {
  it('returns all 3 supported providers', () => {
    const providers = getSupportedCloudProviders();
    expect(providers).toContain('aws');
    expect(providers).toContain('azure');
    expect(providers).toContain('gcp');
    expect(providers).toHaveLength(3);
  });
});

describe('getAdapterSelectionsForProvider', () => {
  it('returns AWS adapter selections', () => {
    const selections = getAdapterSelectionsForProvider('aws');
    expect(selections?.db).toBe('dynamodb');
    expect(selections?.storage).toBe('s3');
  });

  it('returns undefined for unknown provider', () => {
    expect(getAdapterSelectionsForProvider('unknown')).toBeUndefined();
  });

  it('returns a copy (does not leak internal state)', () => {
    const a = getAdapterSelectionsForProvider('aws');
    const b = getAdapterSelectionsForProvider('aws');
    expect(a).not.toBe(b); // different object references
    expect(a).toEqual(b); // same content
  });
});
