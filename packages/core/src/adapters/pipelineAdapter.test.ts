/**
 * Tests for PipelineAdapter contract validation.
 *
 * Covers:
 * - Passing contract validation with all required methods
 * - Failing when methods are missing
 * - Passing with extra methods beyond required
 * - Required methods constant has correct length
 * - Full mock adapter returns expected shapes
 */
import { describe, it, expect } from 'vitest';
import {
  assertAdapterContract,
  AdapterContractError,
} from './adapterContracts.js';
import { PIPELINE_ADAPTER_REQUIRED_METHODS } from './interfaces/index.js';

describe('PipelineAdapter contract', () => {
  it('passes contract validation with all 4 required methods', () => {
    const adapter = {
      createPipeline: () => {},
      triggerBuild: () => {},
      getBuildStatus: () => {},
      getDeploymentUrl: () => {},
    };

    expect(() =>
      assertAdapterContract(
        adapter,
        [...PIPELINE_ADAPTER_REQUIRED_METHODS],
        'codepipeline',
        'pipeline',
      ),
    ).not.toThrow();
  });

  it('fails when missing methods', () => {
    const adapter = {
      createPipeline: () => {},
    };

    expect(() =>
      assertAdapterContract(
        adapter,
        [...PIPELINE_ADAPTER_REQUIRED_METHODS],
        'codepipeline',
        'pipeline',
      ),
    ).toThrow(AdapterContractError);

    try {
      assertAdapterContract(
        adapter,
        [...PIPELINE_ADAPTER_REQUIRED_METHODS],
        'codepipeline',
        'pipeline',
      );
      expect.fail('should have thrown');
    } catch (err) {
      const error = err as AdapterContractError;
      expect(error.missingMethods).toEqual([
        'triggerBuild',
        'getBuildStatus',
        'getDeploymentUrl',
      ]);
      expect(error.adapterId).toBe('codepipeline');
      expect(error.domain).toBe('pipeline');
    }
  });

  it('works with extra methods beyond required', () => {
    const adapter = {
      createPipeline: () => {},
      triggerBuild: () => {},
      getBuildStatus: () => {},
      getDeploymentUrl: () => {},
      deletePipeline: () => {},
      listPipelines: () => {},
    };

    expect(() =>
      assertAdapterContract(
        adapter,
        [...PIPELINE_ADAPTER_REQUIRED_METHODS],
        'codepipeline',
        'pipeline',
      ),
    ).not.toThrow();
  });

  it('PIPELINE_ADAPTER_REQUIRED_METHODS has exactly 4 entries', () => {
    expect(PIPELINE_ADAPTER_REQUIRED_METHODS).toHaveLength(4);
    expect([...PIPELINE_ADAPTER_REQUIRED_METHODS]).toEqual([
      'createPipeline',
      'triggerBuild',
      'getBuildStatus',
      'getDeploymentUrl',
    ]);
  });

  it('full mock PipelineAdapter returns expected shapes', async () => {
    const mockAdapter = {
      createPipeline: async () => ({
        pipelineId: 'pipe-abc-123',
        status: 'created' as const,
      }),
      triggerBuild: async () => ({
        buildId: 'build-xyz-456',
        status: 'queued' as const,
      }),
      getBuildStatus: async () => ({
        buildId: 'build-xyz-456',
        status: 'succeeded' as const,
      }),
      getDeploymentUrl: async () =>
        'https://d1234.cloudfront.net',
    };

    const createResult = await mockAdapter.createPipeline();
    expect(createResult).toEqual({
      pipelineId: 'pipe-abc-123',
      status: 'created',
    });

    const triggerResult = await mockAdapter.triggerBuild();
    expect(triggerResult).toEqual({
      buildId: 'build-xyz-456',
      status: 'queued',
    });

    const statusResult = await mockAdapter.getBuildStatus();
    expect(statusResult).toEqual({
      buildId: 'build-xyz-456',
      status: 'succeeded',
    });

    const deployUrl = await mockAdapter.getDeploymentUrl();
    expect(deployUrl).toBe('https://d1234.cloudfront.net');
    expect(typeof deployUrl).toBe('string');
  });
});
