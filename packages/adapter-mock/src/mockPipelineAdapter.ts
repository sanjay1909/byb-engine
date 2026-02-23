/**
 * mockPipelineAdapter.ts — In-memory mock implementation of PipelineAdapter.
 *
 * Simulates CI/CD pipeline creation, build triggering, and status tracking.
 * Pipelines and builds are stored in separate Maps for inspection.
 * Provides inspector methods for testing and verification.
 */

import type {
  PipelineAdapter,
  PipelineCreateParams,
  PipelineCreateResult,
  PipelineTriggerParams,
  PipelineBuildResult,
  PipelineBuildStatusParams,
  PipelineBuildStatus,
  PipelineDeploymentParams,
} from '@byb/core';

declare function setTimeout(callback: () => void, ms: number): unknown;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface MockPipelineAdapterOptions {
  /** Artificial delay in ms for each operation (default: 0) */
  delay?: number;
}

export interface MockPipeline {
  pipelineId: string;
  storeId: string;
  status: 'created' | 'active' | 'failed';
}

export interface MockBuild {
  buildId: string;
  pipelineId: string;
  status: 'queued' | 'building' | 'succeeded' | 'failed';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
}

export interface MockPipelineAdapter extends PipelineAdapter {
  /** Returns all created pipelines for inspection */
  getPipelines(): Map<string, MockPipeline>;
  /** Returns all triggered builds for inspection */
  getBuilds(): Map<string, MockBuild>;
  /** Resets all pipelines and builds */
  clear(): void;
}

/**
 * Creates an in-memory mock pipeline adapter.
 *
 * Pipelines and builds are stored in Maps for later inspection.
 * Builds are immediately completed with status 'succeeded' unless delay > 0,
 * in which case the build transitions through queued -> building -> succeeded.
 */
export function createMockPipelineAdapter(
  options?: MockPipelineAdapterOptions,
): MockPipelineAdapter {
  const delay = options?.delay ?? 0;
  let idCounter = 0;
  const pipelines = new Map<string, MockPipeline>();
  const builds = new Map<string, MockBuild>();

  return {
    async createPipeline(
      params: PipelineCreateParams | Record<string, unknown>,
    ): Promise<PipelineCreateResult> {
      if (delay) await wait(delay);
      idCounter++;
      const pipelineId = `mock-pipeline-${idCounter}`;
      const storeId =
        (params as PipelineCreateParams).storeId ??
        ((params as Record<string, unknown>).storeId as string) ??
        'unknown';
      pipelines.set(pipelineId, {
        pipelineId,
        storeId,
        status: 'created',
      });
      return { pipelineId, status: 'created' };
    },

    async triggerBuild(
      params: PipelineTriggerParams,
    ): Promise<PipelineBuildResult> {
      if (delay) await wait(delay);
      idCounter++;
      const buildId = `mock-build-${idCounter}`;
      const startedAt = new Date().toISOString();
      const build: MockBuild = {
        buildId,
        pipelineId: params.pipelineId,
        status: 'succeeded',
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: delay || 100,
      };
      builds.set(buildId, build);

      // Update pipeline status to active
      const pipeline = pipelines.get(params.pipelineId);
      if (pipeline) {
        pipeline.status = 'active';
      }

      return { buildId, status: 'succeeded', startedAt };
    },

    async getBuildStatus(
      params: PipelineBuildStatusParams,
    ): Promise<PipelineBuildStatus> {
      if (delay) await wait(delay);
      const build = builds.get(params.buildId);
      if (!build) {
        throw new Error(
          `Build "${params.buildId}" not found in mock pipeline adapter`,
        );
      }
      return {
        buildId: build.buildId,
        status: build.status,
        startedAt: build.startedAt,
        completedAt: build.completedAt,
        durationMs: build.durationMs,
      };
    },

    async getDeploymentUrl(
      params: PipelineDeploymentParams,
    ): Promise<string> {
      if (delay) await wait(delay);
      return `https://mock-deploy-${params.buildId}.local`;
    },

    getPipelines(): Map<string, MockPipeline> {
      return pipelines;
    },

    getBuilds(): Map<string, MockBuild> {
      return builds;
    },

    clear(): void {
      pipelines.clear();
      builds.clear();
      idCounter = 0;
    },
  };
}
