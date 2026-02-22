/**
 * featureContracts.ts — Runtime evaluation of feature availability.
 *
 * Feature contracts gate whether a specific provisioning stage or runtime
 * operation is allowed for a given store. They're built from resolved
 * capabilities at request time.
 *
 * Ported from the SIS platform's `domainCapabilityContracts.js`, which
 * evaluates whether orchestration stages are allowed based on school profiles.
 *
 * Usage:
 *   const contracts = createFeatureContracts(resolvedCapabilities);
 *   const result = contracts.evaluateFeature('blog.create-post');
 *   if (!result.allowed) {
 *     // Feature is disabled — skip this provisioning stage
 *   }
 */

import type { ResolvedCapability } from './featureCapabilityRegistry.js';

/**
 * Reason codes for why a feature evaluation failed.
 */
export type FeatureEvaluationReason =
  | 'ALLOWED'
  | 'FEATURE_DISABLED'
  | 'UNKNOWN_CAPABILITY';

/**
 * Result of evaluating a single feature/capability.
 */
export interface FeatureEvaluationResult {
  /** Whether the feature is allowed */
  allowed: boolean;
  /** The capability ID that was evaluated */
  capabilityId: string;
  /** Reason code */
  reason: FeatureEvaluationReason;
  /** Human-readable detail */
  detail: string;
}

/**
 * The feature contracts interface.
 */
export interface FeatureContracts {
  /** Evaluate whether a specific capability is allowed. */
  evaluateFeature(capabilityId: string): FeatureEvaluationResult;

  /** List all contracts (resolved capabilities with enabled status). */
  listContracts(): ResolvedCapability[];

  /** Get all enabled capability IDs. */
  getEnabledCapabilities(): string[];

  /** Get all disabled capability IDs. */
  getDisabledCapabilities(): string[];
}

/**
 * Creates feature contracts from resolved capabilities.
 *
 * @param resolvedCapabilities - Output of featureCapabilityRegistry.resolveCapabilities()
 * @returns A FeatureContracts instance for runtime evaluation
 */
export function createFeatureContracts(
  resolvedCapabilities: ResolvedCapability[],
): FeatureContracts {
  // Index capabilities by ID for O(1) lookup
  const capabilityMap = new Map<string, ResolvedCapability>();
  for (const cap of resolvedCapabilities) {
    capabilityMap.set(cap.capabilityId, cap);
  }

  return {
    evaluateFeature(capabilityId: string): FeatureEvaluationResult {
      const cap = capabilityMap.get(capabilityId);

      if (!cap) {
        return {
          allowed: false,
          capabilityId,
          reason: 'UNKNOWN_CAPABILITY',
          detail: `Capability "${capabilityId}" is not in the feature catalog`,
        };
      }

      if (!cap.enabled) {
        return {
          allowed: false,
          capabilityId,
          reason: 'FEATURE_DISABLED',
          detail: `Capability "${capabilityId}" is disabled (${cap.enabledSource})`,
        };
      }

      return {
        allowed: true,
        capabilityId,
        reason: 'ALLOWED',
        detail: `Capability "${capabilityId}" is enabled (${cap.enabledSource})`,
      };
    },

    listContracts(): ResolvedCapability[] {
      return resolvedCapabilities;
    },

    getEnabledCapabilities(): string[] {
      return resolvedCapabilities
        .filter((c) => c.enabled)
        .map((c) => c.capabilityId);
    },

    getDisabledCapabilities(): string[] {
      return resolvedCapabilities
        .filter((c) => !c.enabled)
        .map((c) => c.capabilityId);
    },
  };
}
