/**
 * provisioningBridge.ts — Executes provisioning plans by dispatching to adapters.
 *
 * The bridge takes a composed provisioning plan and executes each planned stage
 * by looking up the correct adapter from the registry and calling the
 * stage's operation. It tracks the execution result of each stage.
 *
 * Ported from the SIS platform's `serviceBridge.js`, which dispatches
 * orchestration stages to domain adapters.
 *
 * Usage:
 *   const bridge = createProvisioningBridge({ adapterRegistries, profile });
 *   const result = await bridge.executePlan(plan);
 *   // result.stageResults → [{ stageId, status, duration, ... }, ...]
 */

import type { AdapterRegistry, AdapterContext } from '../adapters/adapterRegistry.js';
import type { ProvisioningPlan, ProvisioningStage } from './provisioningComposer.js';
import type { StoreProfile } from '../profiles/storeProfileResolver.js';

/**
 * Execution status of a single provisioning stage.
 */
export type StageExecutionStatus =
  | 'success'
  | 'failed'
  | 'skipped';

/**
 * Result of executing a single provisioning stage.
 */
export interface StageExecutionResult {
  stageId: string;
  status: StageExecutionStatus;
  /** Duration in milliseconds */
  durationMs: number;
  /** Output data from the adapter (resource IDs, endpoints, etc.) */
  outputs?: Record<string, unknown>;
  /** Error message if failed */
  error?: string;
}

/**
 * Result of executing an entire provisioning plan.
 */
export interface PlanExecutionResult {
  planId: string;
  storeId: string;
  /** Overall status */
  status: 'completed' | 'partial' | 'failed';
  /** Results for each stage */
  stageResults: StageExecutionResult[];
  /** Total execution time in milliseconds */
  totalDurationMs: number;
  /** Summary counts */
  summary: {
    total: number;
    success: number;
    failed: number;
    skipped: number;
  };
}

/**
 * Options for creating a provisioning bridge.
 */
export interface ProvisioningBridgeOptions {
  /**
   * Map of adapter domain → registry.
   * The bridge looks up the correct registry for each stage's adapterDomain.
   */
  adapterRegistries: Map<string, AdapterRegistry<unknown>>;
  /** The store profile (provides adapter IDs and deployment config) */
  profile: StoreProfile;
  /** Additional context passed to adapter factories */
  context?: AdapterContext;
}

/**
 * The provisioning bridge interface.
 */
export interface ProvisioningBridge {
  /** Execute all planned stages in a provisioning plan. */
  executePlan(plan: ProvisioningPlan): Promise<PlanExecutionResult>;

  /** Execute a single stage (for retry or manual execution). */
  executeStage(stage: ProvisioningStage): Promise<StageExecutionResult>;
}

/**
 * Creates a provisioning bridge that executes plans by dispatching to adapters.
 *
 * @param options - Bridge configuration (registries, profile, context)
 * @returns A ProvisioningBridge instance
 */
export function createProvisioningBridge(
  options: ProvisioningBridgeOptions,
): ProvisioningBridge {
  const { adapterRegistries, profile, context = {} } = options;

  /**
   * Resolves the adapter for a given stage by looking up the correct registry
   * and using the profile's adapter selection for that domain.
   */
  function resolveAdapterForStage(
    stage: ProvisioningStage,
  ): unknown {
    const registry = adapterRegistries.get(stage.adapterDomain);
    if (!registry) {
      throw new Error(
        `No adapter registry found for domain "${stage.adapterDomain}". ` +
        `Stage "${stage.stageId}" cannot be executed.`,
      );
    }

    // Look up the adapter ID from the profile's adapter selections
    const adapterKey = stage.adapterDomain as keyof typeof profile.adapters;
    const adapterId = profile.adapters[adapterKey];
    if (!adapterId) {
      throw new Error(
        `No adapter configured for domain "${stage.adapterDomain}" in profile "${profile.profileId}".`,
      );
    }

    return registry.resolveAdapter(adapterId, {
      ...context,
      storeId: profile.match.storeId,
      region: profile.deployment.region,
    });
  }

  async function executeStage(
    stage: ProvisioningStage,
  ): Promise<StageExecutionResult> {
    // Skip non-planned stages
    if (stage.status !== 'planned') {
      return {
        stageId: stage.stageId,
        status: 'skipped',
        durationMs: 0,
      };
    }

    const startTime = Date.now();

    try {
      const adapter = resolveAdapterForStage(stage);

      // Call the operation method on the adapter
      const operationFn = (adapter as Record<string, unknown>)[
        stage.operation
      ];
      if (typeof operationFn !== 'function') {
        throw new Error(
          `Adapter for domain "${stage.adapterDomain}" does not have operation "${stage.operation}"`,
        );
      }

      const outputs = await (operationFn as Function).call(adapter, {
        storeId: profile.match.storeId,
        region: profile.deployment.region,
        storeName: profile.profileId,
        ...context,
      });

      return {
        stageId: stage.stageId,
        status: 'success',
        durationMs: Date.now() - startTime,
        outputs: outputs as Record<string, unknown> | undefined,
      };
    } catch (err) {
      return {
        stageId: stage.stageId,
        status: 'failed',
        durationMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return {
    async executePlan(
      plan: ProvisioningPlan,
    ): Promise<PlanExecutionResult> {
      const startTime = Date.now();
      const stageResults: StageExecutionResult[] = [];

      // Execute stages in order (respecting dependencies)
      const completedStages = new Set<string>();

      for (const stage of plan.stages) {
        // Check if all dependencies are completed
        const depsComplete = stage.dependsOn.every((dep) =>
          completedStages.has(dep),
        );

        if (!depsComplete && stage.status === 'planned') {
          // Check if any dependency failed
          const depFailed = stage.dependsOn.some((dep) => {
            const depResult = stageResults.find((r) => r.stageId === dep);
            return depResult?.status === 'failed';
          });

          if (depFailed) {
            stageResults.push({
              stageId: stage.stageId,
              status: 'skipped',
              durationMs: 0,
              error: 'Dependency failed',
            });
            continue;
          }
        }

        const result = await executeStage(stage);
        stageResults.push(result);

        if (result.status === 'success') {
          completedStages.add(stage.stageId);
        }
      }

      const summary = {
        total: stageResults.length,
        success: stageResults.filter((r) => r.status === 'success').length,
        failed: stageResults.filter((r) => r.status === 'failed').length,
        skipped: stageResults.filter((r) => r.status === 'skipped').length,
      };

      let status: PlanExecutionResult['status'];
      if (summary.failed === 0 && summary.success > 0) {
        status = 'completed';
      } else if (summary.success > 0 && summary.failed > 0) {
        status = 'partial';
      } else {
        status = 'failed';
      }

      return {
        planId: plan.planId,
        storeId: plan.storeId,
        status,
        stageResults,
        totalDurationMs: Date.now() - startTime,
        summary,
      };
    },

    executeStage,
  };
}
