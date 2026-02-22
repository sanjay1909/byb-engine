/**
 * featureCapabilityRegistry.ts — Static catalog of ecommerce features.
 *
 * Defines all known features and their sub-capabilities. This is the
 * "menu" of what a BYB store can do. Each store's profile enables or
 * disables features from this catalog.
 *
 * Ported from the SIS platform's `serviceCapabilityRegistry.js`, which
 * catalogs school services (org, people, academics, scheduling, workflow).
 * Here we catalog ecommerce features instead.
 *
 * Usage:
 *   const registry = createFeatureCapabilityRegistry();
 *   const catalog = registry.listCatalog();
 *   const resolved = registry.resolveCapabilities(profile.features);
 */

import type { StoreFeatureFlags } from '../profiles/storeProfileResolver.js';

/**
 * A single capability within a feature domain.
 */
export interface FeatureCapability {
  /** Unique capability ID (e.g., 'blog.create-post') */
  capabilityId: string;
  /** Human-readable description */
  description: string;
}

/**
 * A feature domain with its capabilities.
 */
export interface FeatureDomain {
  /** Domain key (e.g., 'blog', 'campaigns', 'payments') */
  domainKey: string;
  /** Human-readable domain name */
  displayName: string;
  /** Description of what this feature does */
  description: string;
  /** List of capabilities within this domain */
  capabilities: FeatureCapability[];
}

/**
 * Result of resolving capabilities against a store's feature flags.
 */
export interface ResolvedCapability {
  domainKey: string;
  capabilityId: string;
  enabled: boolean;
  /** What determined whether this capability is enabled */
  enabledSource: string;
}

/**
 * The feature capability registry interface.
 */
export interface FeatureCapabilityRegistry {
  /** List the full catalog of all feature domains and their capabilities. */
  listCatalog(): FeatureDomain[];

  /** Get a specific feature domain by key. Returns undefined if not found. */
  getDomain(domainKey: string): FeatureDomain | undefined;

  /**
   * Resolve which capabilities are enabled/disabled based on store feature flags.
   * Returns a flat list of all capabilities with their enabled status.
   */
  resolveCapabilities(features: StoreFeatureFlags): ResolvedCapability[];

  /**
   * Check if a specific capability is enabled for the given feature flags.
   */
  isCapabilityEnabled(
    capabilityId: string,
    features: StoreFeatureFlags,
  ): boolean;
}

/**
 * The static catalog of all ecommerce features.
 * This defines every feature the engine supports.
 */
const FEATURE_CATALOG: FeatureDomain[] = [
  {
    domainKey: 'storefront',
    displayName: 'Storefront',
    description: 'Customer-facing product catalog, cart, and checkout',
    capabilities: [
      {
        capabilityId: 'storefront.product-catalog',
        description: 'Display product listings with filtering and sorting',
      },
      {
        capabilityId: 'storefront.shopping-cart',
        description: 'Add-to-cart, quantity management, cart persistence',
      },
      {
        capabilityId: 'storefront.checkout',
        description: 'Checkout flow with address collection',
      },
      {
        capabilityId: 'storefront.order-tracking',
        description: 'Customer order status and tracking',
      },
    ],
  },
  {
    domainKey: 'blog',
    displayName: 'Blog',
    description: 'Content management for blog posts with SEO',
    capabilities: [
      {
        capabilityId: 'blog.create-post',
        description: 'Create and edit blog posts (markdown)',
      },
      {
        capabilityId: 'blog.publish',
        description: 'Publish/unpublish/archive blog posts',
      },
      {
        capabilityId: 'blog.seo',
        description: 'Per-post SEO metadata (title, description, OG image)',
      },
    ],
  },
  {
    domainKey: 'campaigns',
    displayName: 'Email Campaigns',
    description: 'Email marketing with subscriber management',
    capabilities: [
      {
        capabilityId: 'campaigns.subscriber-management',
        description: 'Subscribe/unsubscribe with list management',
      },
      {
        capabilityId: 'campaigns.email-send',
        description: 'Send campaigns to subscriber lists',
      },
      {
        capabilityId: 'campaigns.scheduling',
        description: 'Schedule campaigns for future delivery',
      },
    ],
  },
  {
    domainKey: 'payments',
    displayName: 'Payments',
    description: 'Payment processing and order management',
    capabilities: [
      {
        capabilityId: 'payments.checkout-session',
        description: 'Create payment checkout sessions (Stripe)',
      },
      {
        capabilityId: 'payments.webhook',
        description: 'Process payment webhooks for order fulfillment',
      },
      {
        capabilityId: 'payments.manual-order',
        description: 'Manual order mode (DM via social media)',
      },
    ],
  },
  {
    domainKey: 'analytics',
    displayName: 'Analytics',
    description: 'Store analytics and visitor tracking',
    capabilities: [
      {
        capabilityId: 'analytics.beacon',
        description: 'Client-side analytics beacon collection',
      },
      {
        capabilityId: 'analytics.dashboard',
        description: 'Admin analytics dashboard with charts',
      },
    ],
  },
  {
    domainKey: 'oe',
    displayName: 'Operational Engineering',
    description: 'Observability, metrics, alarms, and traces',
    capabilities: [
      {
        capabilityId: 'oe.metrics',
        description: 'Time-series metrics collection and querying',
      },
      {
        capabilityId: 'oe.alarms',
        description: 'Threshold-based alarm definitions and history',
      },
      {
        capabilityId: 'oe.traces',
        description: 'Flow execution trace persistence and viewing',
      },
      {
        capabilityId: 'oe.investigate',
        description: 'Correlated alarm + metric + trace investigation',
      },
    ],
  },
];

/**
 * Maps a feature flag key to its domain key in the catalog.
 */
function getFeatureFlagForDomain(
  domainKey: string,
): keyof StoreFeatureFlags | null {
  const mapping: Record<string, keyof StoreFeatureFlags> = {
    storefront: 'payments', // storefront is always enabled if payments is configured
    blog: 'blog',
    campaigns: 'campaigns',
    payments: 'payments',
    analytics: 'analytics',
    oe: 'oe',
  };
  return mapping[domainKey] ?? null;
}

/**
 * Determines if a domain is enabled based on its feature flag value.
 * Handles boolean and string (provider name) values.
 */
function isDomainEnabled(
  domainKey: string,
  features: StoreFeatureFlags,
): { enabled: boolean; source: string } {
  // Storefront is always enabled
  if (domainKey === 'storefront') {
    return { enabled: true, source: 'always-enabled' };
  }

  const flagKey = getFeatureFlagForDomain(domainKey);
  if (!flagKey) {
    return { enabled: false, source: `no-flag-mapping-for-${domainKey}` };
  }

  const value = features[flagKey];
  if (typeof value === 'boolean') {
    return { enabled: value, source: `features.${flagKey}=${value}` };
  }
  if (typeof value === 'string') {
    // String value means enabled with a specific provider (e.g., 'stripe')
    return { enabled: true, source: `features.${flagKey}="${value}"` };
  }

  return { enabled: false, source: `features.${flagKey}=undefined` };
}

/**
 * Creates a feature capability registry.
 *
 * @returns A FeatureCapabilityRegistry instance with the built-in catalog
 */
export function createFeatureCapabilityRegistry(): FeatureCapabilityRegistry {
  return {
    listCatalog(): FeatureDomain[] {
      return FEATURE_CATALOG;
    },

    getDomain(domainKey: string): FeatureDomain | undefined {
      return FEATURE_CATALOG.find((d) => d.domainKey === domainKey);
    },

    resolveCapabilities(features: StoreFeatureFlags): ResolvedCapability[] {
      const resolved: ResolvedCapability[] = [];

      for (const domain of FEATURE_CATALOG) {
        const { enabled, source } = isDomainEnabled(domain.domainKey, features);

        for (const capability of domain.capabilities) {
          resolved.push({
            domainKey: domain.domainKey,
            capabilityId: capability.capabilityId,
            enabled,
            enabledSource: source,
          });
        }
      }

      return resolved;
    },

    isCapabilityEnabled(
      capabilityId: string,
      features: StoreFeatureFlags,
    ): boolean {
      // Find which domain this capability belongs to
      for (const domain of FEATURE_CATALOG) {
        const found = domain.capabilities.find(
          (c) => c.capabilityId === capabilityId,
        );
        if (found) {
          const { enabled } = isDomainEnabled(domain.domainKey, features);
          return enabled;
        }
      }

      // Unknown capability — default to disabled
      return false;
    },
  };
}
