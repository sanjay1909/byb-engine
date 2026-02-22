/**
 * Tests for storeProfileResolver.ts — validates profile matching and resolution.
 *
 * Covers:
 * - Default fallback when no profiles match
 * - Exact storeId match
 * - Score-based matching (more specific wins)
 * - Disqualification when required field doesn't match
 * - Adding profiles dynamically
 * - Listing all profiles
 * - Scenario: AWS store vs Azure store resolved independently
 */
import { describe, it, expect } from 'vitest';
import {
  createStoreProfileResolver,
  type StoreProfile,
} from './storeProfileResolver.js';

const awsProfile: StoreProfile = {
  profileId: 'charming-aws',
  match: { storeId: 'charming-cherubs' },
  adapters: {
    db: 'dynamodb',
    storage: 's3',
    cdn: 'cloudfront',
    email: 'ses',
    secrets: 'ssm',
    scheduler: 'eventbridge',
    infra: 'aws-cdk',
  },
  features: {
    blog: true,
    campaigns: true,
    payments: 'stripe',
    analytics: true,
    oe: true,
  },
  deployment: { region: 'us-east-1', customDomain: 'charmingcherubsco.com' },
};

const azureProfile: StoreProfile = {
  profileId: 'gadgets-azure',
  match: { storeId: 'tech-gadgets', cloudProvider: 'azure' },
  adapters: {
    db: 'cosmosdb',
    storage: 'blob-storage',
    cdn: 'azure-cdn',
    email: 'sendgrid',
    secrets: 'key-vault',
    scheduler: 'azure-scheduler',
    infra: 'azure-arm',
  },
  features: {
    blog: false,
    campaigns: false,
    payments: 'stripe',
    analytics: true,
    oe: false,
  },
  deployment: { region: 'westus2' },
};

describe('createStoreProfileResolver', () => {
  it('returns default profile when no profiles registered', () => {
    const resolver = createStoreProfileResolver();
    const result = resolver.resolve({ storeId: 'unknown' });

    expect(result.isDefault).toBe(true);
    expect(result.matchScore).toBe(0);
    expect(result.profile.profileId).toBe('default-aws');
    expect(result.profile.adapters.db).toBe('dynamodb');
  });

  it('matches profile by storeId', () => {
    const resolver = createStoreProfileResolver({
      profiles: [awsProfile],
    });
    const result = resolver.resolve({ storeId: 'charming-cherubs' });

    expect(result.isDefault).toBe(false);
    expect(result.matchScore).toBe(1);
    expect(result.profile.profileId).toBe('charming-aws');
    expect(result.profile.deployment.customDomain).toBe(
      'charmingcherubsco.com',
    );
  });

  it('returns default when storeId does not match any profile', () => {
    const resolver = createStoreProfileResolver({
      profiles: [awsProfile],
    });
    const result = resolver.resolve({ storeId: 'other-store' });

    expect(result.isDefault).toBe(true);
    expect(result.profile.profileId).toBe('default-aws');
  });

  it('prefers more specific match (higher score)', () => {
    const genericAws: StoreProfile = {
      profileId: 'generic-aws',
      match: { cloudProvider: 'aws' },
      adapters: awsProfile.adapters,
      features: awsProfile.features,
      deployment: { region: 'us-west-2' },
    };

    const specificAws: StoreProfile = {
      profileId: 'specific-aws',
      match: { storeId: 'charming-cherubs', cloudProvider: 'aws' },
      adapters: awsProfile.adapters,
      features: { ...awsProfile.features, blog: false },
      deployment: { region: 'us-east-1' },
    };

    const resolver = createStoreProfileResolver({
      profiles: [genericAws, specificAws],
    });
    const result = resolver.resolve({
      storeId: 'charming-cherubs',
      cloudProvider: 'aws',
    });

    expect(result.profile.profileId).toBe('specific-aws');
    expect(result.matchScore).toBe(2);
  });

  it('disqualifies profile when required field does not match', () => {
    const resolver = createStoreProfileResolver({
      profiles: [azureProfile],
    });

    // storeId matches but cloudProvider doesn't
    const result = resolver.resolve({
      storeId: 'tech-gadgets',
      cloudProvider: 'aws',
    });

    expect(result.isDefault).toBe(true);
  });

  it('matches when context has extra fields not in profile match', () => {
    const resolver = createStoreProfileResolver({
      profiles: [awsProfile],
    });

    // awsProfile only matches on storeId, extra fields are ignored
    const result = resolver.resolve({
      storeId: 'charming-cherubs',
      cloudProvider: 'aws',
      region: 'us-east-1',
    });

    expect(result.profile.profileId).toBe('charming-aws');
  });

  it('dynamically adds profiles', () => {
    const resolver = createStoreProfileResolver();
    resolver.addProfile(awsProfile);

    const result = resolver.resolve({ storeId: 'charming-cherubs' });
    expect(result.profile.profileId).toBe('charming-aws');
  });

  it('lists all profiles including default', () => {
    const resolver = createStoreProfileResolver({
      profiles: [awsProfile, azureProfile],
    });
    const list = resolver.listProfiles();

    expect(list).toHaveLength(3); // default + 2
    expect(list.map((p) => p.profileId)).toContain('default-aws');
    expect(list.map((p) => p.profileId)).toContain('charming-aws');
    expect(list.map((p) => p.profileId)).toContain('gadgets-azure');
  });

  it('supports custom default profile', () => {
    const customDefault: StoreProfile = {
      profileId: 'custom-default',
      match: {},
      adapters: azureProfile.adapters,
      features: azureProfile.features,
      deployment: { region: 'westeurope' },
    };

    const resolver = createStoreProfileResolver({
      defaultProfile: customDefault,
    });
    const result = resolver.resolve({ storeId: 'unknown' });

    expect(result.profile.profileId).toBe('custom-default');
    expect(result.profile.adapters.db).toBe('cosmosdb');
  });

  // Scenario: resolve two different stores to different clouds
  it('scenario: AWS store and Azure store resolved independently', () => {
    const resolver = createStoreProfileResolver({
      profiles: [awsProfile, azureProfile],
    });

    const charmingResult = resolver.resolve({
      storeId: 'charming-cherubs',
    });
    const gadgetsResult = resolver.resolve({
      storeId: 'tech-gadgets',
      cloudProvider: 'azure',
    });

    // Charming Cherubs → AWS
    expect(charmingResult.profile.adapters.db).toBe('dynamodb');
    expect(charmingResult.profile.adapters.storage).toBe('s3');
    expect(charmingResult.profile.features.blog).toBe(true);

    // Tech Gadgets → Azure
    expect(gadgetsResult.profile.adapters.db).toBe('cosmosdb');
    expect(gadgetsResult.profile.adapters.storage).toBe('blob-storage');
    expect(gadgetsResult.profile.features.blog).toBe(false);
  });
});
