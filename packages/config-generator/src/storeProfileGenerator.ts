/**
 * storeProfileGenerator.ts — Generates a StoreProfile from wizard answers.
 *
 * This is the bridge between the wizard's output and the @byb/core adapter layer.
 * It translates the wizard's cloud provider choice into the correct adapter IDs
 * and maps feature selections to the StoreFeatureFlags format.
 *
 * How it connects to the system:
 * - Input: WizardAnswers (cloud + features sections)
 * - Output: StoreProfile (from @byb/core) — used by storeProfileResolver,
 *   provisioningComposer, and provisioningBridge
 * - The profile determines which cloud adapters handle each infrastructure domain
 * - The profile's feature flags gate which capabilities are active
 *
 * Design decisions:
 * - Cloud provider → adapter ID mapping is hardcoded per provider
 * - AWS is the only fully implemented provider; Azure/GCP are defined for future
 * - Profile ID is derived from storeId to ensure uniqueness
 * - Match criteria includes storeId + cloudProvider + region for precise resolution
 */

import type {
  StoreProfile,
  StoreAdapterSelections,
  StoreFeatureFlags,
} from '@byb/core';
import type { WizardAnswers } from './types.js';

/**
 * Maps a cloud provider name to the adapter IDs for each infrastructure domain.
 *
 * When Azure/GCP adapters are implemented in Phase 6, their adapter IDs
 * will be added here (e.g., 'cosmos-db', 'blob-storage', etc.).
 */
const CLOUD_ADAPTER_MAP: Record<string, StoreAdapterSelections> = {
  aws: {
    db: 'dynamodb',
    storage: 's3',
    cdn: 'cloudfront',
    email: 'ses',
    secrets: 'ssm',
    scheduler: 'eventbridge',
    infra: 'aws-cdk',
    dns: 'route53',
    pipeline: 'codepipeline',
  },
  azure: {
    db: 'cosmos-db',
    storage: 'blob-storage',
    cdn: 'azure-cdn',
    email: 'sendgrid',
    secrets: 'key-vault',
    scheduler: 'azure-scheduler',
    infra: 'azure-arm',
    dns: 'azure-dns',
    pipeline: 'azure-devops',
  },
  gcp: {
    db: 'firestore',
    storage: 'cloud-storage',
    cdn: 'cloud-cdn',
    email: 'sendgrid',
    secrets: 'secret-manager',
    scheduler: 'cloud-scheduler',
    infra: 'gcp-terraform',
    dns: 'cloud-dns',
    pipeline: 'cloud-build',
  },
};

/**
 * Generates a StoreProfile from wizard answers.
 *
 * The profile is the core data structure that connects the wizard's choices
 * to the adapter layer. It tells the provisioning system:
 * - Which cloud adapters to use (based on cloud provider choice)
 * - Which features to enable (based on feature toggle answers)
 * - Where to deploy (region, custom domain)
 *
 * @param answers - The complete wizard answers
 * @returns A StoreProfile compatible with @byb/core's storeProfileResolver
 *
 * @example
 * const profile = generateStoreProfile({
 *   business: { storeId: 'my-shop', ... },
 *   cloud: { provider: 'aws', region: 'us-east-1' },
 *   features: { blog: true, campaigns: true, payments: 'stripe', ... },
 *   ...
 * });
 * // profile.adapters.db → 'dynamodb'
 * // profile.features.blog → true
 * // profile.deployment.region → 'us-east-1'
 */
export function generateStoreProfile(answers: WizardAnswers): StoreProfile {
  const { business, cloud, features } = answers;

  // Look up the adapter selections for the chosen cloud provider
  const adapters = CLOUD_ADAPTER_MAP[cloud.provider];
  if (!adapters) {
    throw new Error(
      `Unsupported cloud provider: '${cloud.provider}'. ` +
        `Supported providers: ${Object.keys(CLOUD_ADAPTER_MAP).join(', ')}`,
    );
  }

  // Map wizard features to StoreFeatureFlags
  const featureFlags: StoreFeatureFlags = {
    blog: features.blog,
    campaigns: features.campaigns,
    payments: features.payments,
    analytics: features.analytics,
    oe: features.oe,
  };

  return {
    profileId: `store-${business.storeId}`,
    match: {
      storeId: business.storeId,
      cloudProvider: cloud.provider,
      region: cloud.region,
    },
    adapters: { ...adapters },
    features: featureFlags,
    deployment: {
      region: cloud.region,
      customDomain: cloud.customDomain,
    },
  };
}

/**
 * Returns the list of supported cloud providers.
 * Useful for populating the wizard's cloud target step.
 */
export function getSupportedCloudProviders(): string[] {
  return Object.keys(CLOUD_ADAPTER_MAP);
}

/**
 * Returns the adapter selections for a given cloud provider.
 * Useful for displaying what services will be used in the wizard review step.
 */
export function getAdapterSelectionsForProvider(
  provider: string,
): StoreAdapterSelections | undefined {
  return CLOUD_ADAPTER_MAP[provider]
    ? { ...CLOUD_ADAPTER_MAP[provider] }
    : undefined;
}
