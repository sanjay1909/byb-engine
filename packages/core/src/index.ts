/**
 * @byb/core — Core engine abstractions for the BYB ecommerce engine.
 *
 * This package contains no cloud-specific code. It defines:
 * - Adapter registries and contract validation
 * - Adapter interfaces for each infrastructure domain
 * - Store profile resolution
 * - Feature capability gating
 * - Provisioning plan composition and execution
 *
 * Cloud-specific packages (@byb/adapter-aws, etc.) implement the interfaces
 * defined here and register their adapters in the registries.
 */

// Adapters
export * from './adapters/index.js';

// Profiles
export {
  createStoreProfileResolver,
  type StoreProfileResolver,
  type StoreProfile,
  type StoreProfileMatch,
  type StoreAdapterSelections,
  type StoreFeatureFlags,
  type StoreDeploymentConfig,
  type StoreRequestContext,
  type StoreProfileResolution,
} from './profiles/storeProfileResolver.js';

// Capabilities
export {
  createFeatureCapabilityRegistry,
  type FeatureCapabilityRegistry,
  type FeatureDomain,
  type FeatureCapability,
  type ResolvedCapability,
} from './capabilities/featureCapabilityRegistry.js';

export {
  createFeatureContracts,
  type FeatureContracts,
  type FeatureEvaluationResult,
  type FeatureEvaluationReason,
} from './capabilities/featureContracts.js';

// Provisioning
export {
  composeProvisioningPlan,
  type ProvisioningPlan,
  type ProvisioningStage,
  type ProvisioningStageStatus,
} from './provisioning/provisioningComposer.js';

export {
  createProvisioningBridge,
  type ProvisioningBridge,
  type ProvisioningBridgeOptions,
  type PlanExecutionResult,
  type StageExecutionResult,
  type StageExecutionStatus,
} from './provisioning/provisioningBridge.js';
