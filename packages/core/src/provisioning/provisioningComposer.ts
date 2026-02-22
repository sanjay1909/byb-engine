/**
 * provisioningComposer.ts — Generates provisioning plans for new stores.
 *
 * A provisioning plan is an ordered list of stages that must be executed
 * to deploy a store's infrastructure. Each stage maps to an adapter domain
 * (db, storage, cdn, etc.) and a specific operation.
 *
 * The composer cross-references the store profile's feature flags with the
 * provisioning template to determine which stages are planned, skipped,
 * or blocked.
 *
 * Ported from the SIS platform's `orchestrationComposer.js`, which generates
 * stage plans for scheduling actions based on enabled services.
 *
 * Usage:
 *   const plan = composeProvisioningPlan(storeProfile);
 *   // plan.stages → [{ stageId: 'create-db', status: 'planned', ... }, ...]
 */

import type {
  StoreProfile,
  StoreFeatureFlags,
} from '../profiles/storeProfileResolver.js';

/**
 * Status of a provisioning stage in the plan.
 */
export type ProvisioningStageStatus =
  | 'planned'       // Will be executed
  | 'skipped'       // Skipped because feature is disabled
  | 'blocked';      // Cannot proceed (dependency missing)

/**
 * A single provisioning stage in the plan.
 */
export interface ProvisioningStage {
  /** Unique stage identifier */
  stageId: string;
  /** Human-readable stage name */
  displayName: string;
  /** Which adapter domain handles this stage (db, storage, cdn, email, etc.) */
  adapterDomain: string;
  /** The specific operation to perform */
  operation: string;
  /** Whether this stage is required (true) or optional based on features (false) */
  required: boolean;
  /** Which feature capability gates this stage (if any) */
  gatedByCapability?: string;
  /** Current status in the plan */
  status: ProvisioningStageStatus;
  /** Why this stage has its current status */
  statusReason: string;
  /** Stages that must complete before this one (by stageId) */
  dependsOn: string[];
}

/**
 * A complete provisioning plan.
 */
export interface ProvisioningPlan {
  /** Unique plan identifier */
  planId: string;
  /** Store this plan is for */
  storeId: string;
  /** Overall plan status */
  status: 'ready' | 'blocked';
  /** Ordered list of stages */
  stages: ProvisioningStage[];
  /** Summary counts */
  summary: {
    total: number;
    planned: number;
    skipped: number;
    blocked: number;
  };
}

/**
 * The provisioning stage template — defines all possible stages in order.
 * Required stages are always planned; optional stages are gated by feature capabilities.
 */
const PROVISIONING_TEMPLATE: Array<
  Omit<ProvisioningStage, 'status' | 'statusReason'>
> = [
  {
    stageId: 'create-database',
    displayName: 'Create Database',
    adapterDomain: 'db',
    operation: 'createTable',
    required: true,
    dependsOn: [],
  },
  {
    stageId: 'create-storage',
    displayName: 'Create Storage Bucket',
    adapterDomain: 'storage',
    operation: 'createBucket',
    required: true,
    dependsOn: [],
  },
  {
    stageId: 'setup-cdn',
    displayName: 'Set Up CDN Distribution',
    adapterDomain: 'cdn',
    operation: 'createDistribution',
    required: true,
    dependsOn: ['create-storage'],
  },
  {
    stageId: 'configure-secrets',
    displayName: 'Configure Secrets',
    adapterDomain: 'secrets',
    operation: 'setupStoreSecrets',
    required: true,
    dependsOn: [],
  },
  {
    stageId: 'setup-email',
    displayName: 'Set Up Email Service',
    adapterDomain: 'email',
    operation: 'configureEmailSender',
    required: false,
    gatedByCapability: 'campaigns.email-send',
    dependsOn: ['configure-secrets'],
  },
  {
    stageId: 'setup-scheduler',
    displayName: 'Set Up Job Scheduler',
    adapterDomain: 'scheduler',
    operation: 'configureScheduler',
    required: false,
    gatedByCapability: 'campaigns.scheduling',
    dependsOn: [],
  },
  {
    stageId: 'deploy-backend',
    displayName: 'Deploy Backend Compute',
    adapterDomain: 'infra',
    operation: 'deployCompute',
    required: true,
    dependsOn: ['create-database', 'create-storage', 'configure-secrets'],
  },
  {
    stageId: 'deploy-frontend',
    displayName: 'Deploy Frontend',
    adapterDomain: 'infra',
    operation: 'deployFrontend',
    required: true,
    dependsOn: ['setup-cdn', 'deploy-backend'],
  },
  {
    stageId: 'seed-data',
    displayName: 'Seed Sample Data',
    adapterDomain: 'db',
    operation: 'seedData',
    required: false,
    dependsOn: ['deploy-backend'],
  },
  {
    stageId: 'configure-domain',
    displayName: 'Configure Custom Domain',
    adapterDomain: 'cdn',
    operation: 'configureDomain',
    required: false,
    dependsOn: ['setup-cdn'],
  },
];

/**
 * Determines whether a feature-gated stage should be planned or skipped.
 */
function evaluateStageStatus(
  stage: Omit<ProvisioningStage, 'status' | 'statusReason'>,
  features: StoreFeatureFlags,
  resolvedStages: Map<string, ProvisioningStageStatus>,
): { status: ProvisioningStageStatus; statusReason: string } {
  // Check dependencies — if any dependency is blocked, this stage is blocked
  for (const depId of stage.dependsOn) {
    const depStatus = resolvedStages.get(depId);
    if (depStatus === 'blocked') {
      return {
        status: 'blocked',
        statusReason: `Dependency "${depId}" is blocked`,
      };
    }
  }

  // Required stages are always planned
  if (stage.required) {
    return { status: 'planned', statusReason: 'Required stage' };
  }

  // Optional stages with no capability gate are planned
  if (!stage.gatedByCapability) {
    return { status: 'planned', statusReason: 'Optional stage (no gate)' };
  }

  // Check the capability gate
  // Extract domain from capability ID (e.g., 'campaigns.email-send' → 'campaigns')
  const capDomain = stage.gatedByCapability.split('.')[0];
  const featureKey = capDomain as keyof StoreFeatureFlags;
  const featureValue = features[featureKey];

  if (featureValue === false || featureValue === undefined) {
    return {
      status: 'skipped',
      statusReason: `Feature "${capDomain}" is disabled`,
    };
  }

  return {
    status: 'planned',
    statusReason: `Feature "${capDomain}" is enabled`,
  };
}

/**
 * Composes a provisioning plan for a store based on its profile.
 *
 * @param profile - The store's resolved profile (adapters, features, deployment)
 * @returns A complete ProvisioningPlan with ordered stages
 */
export function composeProvisioningPlan(
  profile: StoreProfile,
): ProvisioningPlan {
  const resolvedStages = new Map<string, ProvisioningStageStatus>();
  const stages: ProvisioningStage[] = [];

  // Process stages in template order (dependencies are declared, not positional)
  for (const template of PROVISIONING_TEMPLATE) {
    const { status, statusReason } = evaluateStageStatus(
      template,
      profile.features,
      resolvedStages,
    );

    resolvedStages.set(template.stageId, status);

    stages.push({
      ...template,
      status,
      statusReason,
    });
  }

  const summary = {
    total: stages.length,
    planned: stages.filter((s) => s.status === 'planned').length,
    skipped: stages.filter((s) => s.status === 'skipped').length,
    blocked: stages.filter((s) => s.status === 'blocked').length,
  };

  return {
    planId: `plan-${profile.profileId}-${Date.now()}`,
    storeId: profile.match.storeId ?? 'unknown',
    status: summary.blocked > 0 ? 'blocked' : 'ready',
    stages,
    summary,
  };
}
