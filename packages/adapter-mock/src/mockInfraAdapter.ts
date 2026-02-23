/**
 * mockInfraAdapter.ts — In-memory mock implementation of InfraAdapter.
 *
 * Simulates infrastructure provisioning by storing stack state in a Map.
 * Generates mock stack IDs and outputs with realistic endpoint URLs.
 * Provides inspector methods for testing and verification.
 */

import type {
  InfraAdapter,
  InfraProvisionParams,
  InfraProvisionResult,
  InfraStatusParams,
  InfraDestroyParams,
} from '@byb/core';

declare function setTimeout(callback: () => void, ms: number): unknown;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface MockInfraAdapterOptions {
  /** Artificial delay in ms for each operation (default: 0) */
  delay?: number;
}

export interface MockInfraAdapter extends InfraAdapter {
  /** Returns all provisioned stacks for inspection */
  getStacks(): Map<string, InfraProvisionResult>;
  /** Resets all provisioned stacks */
  clear(): void;
  /** Provisioning: deploy backend compute (Lambda/functions) for a store */
  deployCompute(params: Record<string, unknown>): Promise<Record<string, unknown>>;
  /** Provisioning: deploy frontend assets for a store */
  deployFrontend(params: Record<string, unknown>): Promise<Record<string, unknown>>;
}

/**
 * Creates an in-memory mock infrastructure adapter.
 *
 * Provisioning immediately creates a stack with status 'completed'
 * and mock outputs for apiEndpoint and frontendUrl.
 */
export function createMockInfraAdapter(
  options?: MockInfraAdapterOptions,
): MockInfraAdapter {
  const delay = options?.delay ?? 0;
  const stacks = new Map<string, InfraProvisionResult>();

  return {
    async provision(
      params: InfraProvisionParams,
    ): Promise<InfraProvisionResult> {
      if (delay) await wait(delay);
      const stackId = `mock-stack-${params.storeId}`;
      const result: InfraProvisionResult = {
        stackId,
        status: 'completed',
        outputs: {
          apiEndpoint: `https://mock-api-${params.storeId}.local`,
          frontendUrl: `https://mock-frontend-${params.storeId}.local`,
        },
      };
      stacks.set(stackId, result);
      return result;
    },

    async getStatus(
      params: InfraStatusParams,
    ): Promise<InfraProvisionResult> {
      if (delay) await wait(delay);
      const result = stacks.get(params.stackId);
      if (!result) {
        throw new Error(
          `Stack "${params.stackId}" not found in mock infra adapter`,
        );
      }
      return result;
    },

    async destroy(params: InfraDestroyParams): Promise<void> {
      if (delay) await wait(delay);
      stacks.delete(params.stackId);
    },

    getStacks(): Map<string, InfraProvisionResult> {
      return stacks;
    },

    clear(): void {
      stacks.clear();
    },

    // ── Provisioning operations ──────────────────────────────────────

    async deployCompute(
      params: Record<string, unknown>,
    ): Promise<Record<string, unknown>> {
      if (delay) await wait(delay);
      const storeId = (params.storeId as string) ?? 'unknown';
      const stackId = `mock-compute-stack-${storeId}`;
      const result: InfraProvisionResult = {
        stackId,
        status: 'completed',
        outputs: {
          apiEndpoint: `https://mock-api-${storeId}.local`,
          functionArn: `arn:mock:lambda:${params.region ?? 'us-east-1'}:123456789:function:${storeId}-api`,
        },
      };
      stacks.set(stackId, result);
      return { success: true, ...result };
    },

    async deployFrontend(
      params: Record<string, unknown>,
    ): Promise<Record<string, unknown>> {
      if (delay) await wait(delay);
      const storeId = (params.storeId as string) ?? 'unknown';
      const stackId = `mock-frontend-stack-${storeId}`;
      const result: InfraProvisionResult = {
        stackId,
        status: 'completed',
        outputs: {
          frontendUrl: `https://mock-frontend-${storeId}.local`,
          bucketName: `mock-frontend-bucket-${storeId}`,
        },
      };
      stacks.set(stackId, result);
      return { success: true, ...result };
    },
  };
}
