/**
 * storeProfileResolver.ts — Matches stores to their configuration profiles.
 *
 * A store profile defines:
 * - Which cloud adapters to use (db, storage, cdn, email, secrets, scheduler, infra)
 * - Which features are enabled (blog, campaigns, payments, analytics, oe)
 * - Deployment config (region, custom domain)
 *
 * The resolver uses score-based matching: the profile with the most matching
 * fields (storeId, cloudProvider, region) wins. A default profile is always
 * available as fallback.
 *
 * Ported from the SIS platform's `schoolProfileResolver.js`, adapted for
 * ecommerce stores instead of schools.
 *
 * Usage:
 *   const resolver = createStoreProfileResolver({ profiles: [...] });
 *   const profile = resolver.resolve({ storeId: 'charming-cherubs' });
 *   // profile.adapters.db → 'dynamodb'
 *   // profile.features.blog → true
 */

/**
 * Adapter selections for a store — maps each domain to an adapter ID.
 * These IDs must match adapters registered in the corresponding adapter registries.
 */
export interface StoreAdapterSelections {
  db: string;
  storage: string;
  cdn: string;
  email: string;
  secrets: string;
  scheduler: string;
  infra: string;
}

/**
 * Feature flags for a store — determines which ecommerce features are active.
 */
export interface StoreFeatureFlags {
  blog: boolean;
  campaigns: boolean;
  payments: boolean | string; // true/false or payment provider ID (e.g., 'stripe')
  analytics: boolean;
  oe: boolean; // Operational Engineering (metrics, alarms, traces)
}

/**
 * Deployment configuration for a store.
 */
export interface StoreDeploymentConfig {
  region: string;
  customDomain?: string;
}

/**
 * Match criteria for profile resolution.
 * More specific matches (more fields) score higher.
 */
export interface StoreProfileMatch {
  storeId?: string;
  cloudProvider?: string;
  region?: string;
}

/**
 * A complete store profile — adapters, features, deployment, and match criteria.
 */
export interface StoreProfile {
  /** Unique profile identifier */
  profileId: string;
  /** Match criteria — the resolver picks the best-matching profile */
  match: StoreProfileMatch;
  /** Which adapter to use for each infrastructure domain */
  adapters: StoreAdapterSelections;
  /** Which ecommerce features are enabled */
  features: StoreFeatureFlags;
  /** Deployment configuration */
  deployment: StoreDeploymentConfig;
}

/**
 * Request context used for profile resolution.
 * The resolver matches these fields against each profile's match criteria.
 */
export interface StoreRequestContext {
  storeId: string;
  cloudProvider?: string;
  region?: string;
}

/**
 * Result of profile resolution, including the matched profile and match score.
 */
export interface StoreProfileResolution {
  /** The resolved profile */
  profile: StoreProfile;
  /** Match score (higher = more specific match). 0 = default fallback. */
  matchScore: number;
  /** Whether this is the default fallback profile */
  isDefault: boolean;
}

/**
 * The store profile resolver interface.
 */
export interface StoreProfileResolver {
  /** Resolve the best-matching profile for a given request context. */
  resolve(context: StoreRequestContext): StoreProfileResolution;

  /** List all registered profiles. */
  listProfiles(): StoreProfile[];

  /** Add a new profile to the resolver. */
  addProfile(profile: StoreProfile): void;
}

/** Default AWS profile — used as fallback when no specific profile matches. */
const DEFAULT_PROFILE: StoreProfile = {
  profileId: 'default-aws',
  match: {},
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
  deployment: {
    region: 'us-east-1',
  },
};

/**
 * Calculates a match score between a profile's match criteria and a request context.
 * Each matching field adds 1 to the score. Higher score = more specific match.
 */
function calculateMatchScore(
  profileMatch: StoreProfileMatch,
  context: StoreRequestContext,
): number {
  let score = 0;
  const matchFields: Array<keyof StoreProfileMatch> = [
    'storeId',
    'cloudProvider',
    'region',
  ];

  for (const field of matchFields) {
    const profileValue = profileMatch[field];
    if (profileValue === undefined) continue;

    // If the profile specifies a value for this field, the context must match
    if (profileValue === context[field]) {
      score += 1;
    } else {
      // Profile requires this field but context doesn't match — disqualify
      return -1;
    }
  }

  return score;
}

/**
 * Creates a store profile resolver.
 *
 * @param options - Configuration with initial profiles
 * @returns A StoreProfileResolver instance
 *
 * @example
 * const resolver = createStoreProfileResolver({
 *   profiles: [
 *     { profileId: 'charming', match: { storeId: 'charming-cherubs' }, ... },
 *   ],
 * });
 * const { profile } = resolver.resolve({ storeId: 'charming-cherubs' });
 */
export function createStoreProfileResolver(options?: {
  profiles?: StoreProfile[];
  defaultProfile?: StoreProfile;
}): StoreProfileResolver {
  const profiles: StoreProfile[] = [...(options?.profiles ?? [])];
  const defaultProfile = options?.defaultProfile ?? DEFAULT_PROFILE;

  return {
    resolve(context: StoreRequestContext): StoreProfileResolution {
      let bestProfile = defaultProfile;
      let bestScore = 0;
      let isDefault = true;

      for (const profile of profiles) {
        const score = calculateMatchScore(profile.match, context);
        if (score > bestScore) {
          bestProfile = profile;
          bestScore = score;
          isDefault = false;
        }
      }

      return {
        profile: bestProfile,
        matchScore: bestScore,
        isDefault,
      };
    },

    listProfiles(): StoreProfile[] {
      return [defaultProfile, ...profiles];
    },

    addProfile(profile: StoreProfile): void {
      profiles.push(profile);
    },
  };
}
