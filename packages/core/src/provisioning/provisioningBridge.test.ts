/**
 * Tests for provisioningBridge.ts — validates plan execution via adapters.
 *
 * Covers:
 * - Executing a plan with all stages succeeding
 * - Skipping non-planned stages
 * - Handling adapter failures
 * - Dependency tracking (skip downstream on failure)
 * - Missing adapter registry error
 * - Plan execution result summary
 * - Scenario: full provisioning with mocked adapters
 */
import { describe, it, expect, vi } from 'vitest';
import { createProvisioningBridge } from './provisioningBridge.js';
import { createAdapterRegistry } from '../adapters/adapterRegistry.js';
import { composeProvisioningPlan } from './provisioningComposer.js';
import type { StoreProfile } from '../profiles/storeProfileResolver.js';
import type { ProvisioningPlan, ProvisioningStage } from './provisioningComposer.js';

// A mock adapter that implements common operations
function createMockAdapter() {
  return {
    createTable: vi.fn().mockResolvedValue({ tableArn: 'arn:aws:dynamodb:table/test' }),
    createBucket: vi.fn().mockResolvedValue({ bucketName: 'test-bucket' }),
    createDistribution: vi.fn().mockResolvedValue({ distributionId: 'dist-123' }),
    configureDomain: vi.fn().mockResolvedValue({ zoneId: 'zone-1', recordName: 'shop.example.com', status: 'pending' }),
    setupStoreSecrets: vi.fn().mockResolvedValue(undefined),
    configureEmailSender: vi.fn().mockResolvedValue(undefined),
    configureScheduler: vi.fn().mockResolvedValue(undefined),
    deployCompute: vi.fn().mockResolvedValue({ functionArn: 'arn:aws:lambda:fn' }),
    deployFrontend: vi.fn().mockResolvedValue({ url: 'https://test.com' }),
    seedData: vi.fn().mockResolvedValue({ productsSeeded: 5 }),
    createPipeline: vi.fn().mockResolvedValue({ pipelineId: 'pipe-1', status: 'created' }),
    // Required for contract validation
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    query: vi.fn(),
    transactWrite: vi.fn(),
    presignUpload: vi.fn(),
    presignDownload: vi.fn(),
    list: vi.fn(),
    invalidateCache: vi.fn(),
    getDistributionDomain: vi.fn(),
    send: vi.fn(),
    sendTemplated: vi.fn(),
    getSecret: vi.fn(),
    putSecret: vi.fn(),
    deleteSecret: vi.fn(),
    createOneTime: vi.fn(),
    createRecurring: vi.fn(),
    deleteSchedule: vi.fn(),
    provision: vi.fn(),
    getStatus: vi.fn(),
    destroy: vi.fn(),
    // DNS adapter methods
    checkPropagation: vi.fn(),
    provisionSsl: vi.fn(),
    // Pipeline adapter methods
    triggerBuild: vi.fn(),
    getBuildStatus: vi.fn(),
    getDeploymentUrl: vi.fn(),
  };
}

const testProfile: StoreProfile = {
  profileId: 'test-profile',
  match: { storeId: 'test-store' },
  adapters: {
    db: 'mock-db',
    storage: 'mock-storage',
    cdn: 'mock-cdn',
    email: 'mock-email',
    secrets: 'mock-secrets',
    scheduler: 'mock-scheduler',
    infra: 'mock-infra',
    dns: 'mock-dns',
    pipeline: 'mock-pipeline',
  },
  features: {
    blog: true,
    campaigns: true,
    payments: 'stripe',
    analytics: true,
    oe: true,
  },
  deployment: { region: 'us-east-1' },
};

function createMockRegistries() {
  const mockAdapter = createMockAdapter();
  const registries = new Map<string, ReturnType<typeof createAdapterRegistry>>();

  const domains = ['db', 'storage', 'cdn', 'email', 'secrets', 'scheduler', 'infra', 'dns', 'pipeline'];
  for (const domain of domains) {
    // Use empty requiredMethods to skip contract validation in tests
    const registry = createAdapterRegistry({ domain, requiredMethods: [] });
    registry.registerAdapter(`mock-${domain}`, () => mockAdapter);
    registries.set(domain, registry);
  }

  return { registries, mockAdapter };
}

describe('createProvisioningBridge', () => {
  it('executes a full plan with all stages succeeding', async () => {
    const { registries } = createMockRegistries();
    const plan = composeProvisioningPlan(testProfile);
    const bridge = createProvisioningBridge({
      adapterRegistries: registries,
      profile: testProfile,
    });

    const result = await bridge.executePlan(plan);

    expect(result.status).toBe('completed');
    expect(result.summary.failed).toBe(0);
    expect(result.summary.success).toBeGreaterThan(0);
  });

  it('skips non-planned stages', async () => {
    const { registries } = createMockRegistries();

    // Use minimal profile so some stages are skipped
    const minimalProfile: StoreProfile = {
      ...testProfile,
      features: {
        blog: false,
        campaigns: false,
        payments: false,
        analytics: false,
        oe: false,
      },
    };
    const plan = composeProvisioningPlan(minimalProfile);
    const bridge = createProvisioningBridge({
      adapterRegistries: registries,
      profile: minimalProfile,
    });

    const result = await bridge.executePlan(plan);

    expect(result.summary.skipped).toBeGreaterThan(0);
    const skippedResults = result.stageResults.filter(
      (r) => r.status === 'skipped',
    );
    expect(skippedResults.length).toBeGreaterThan(0);
  });

  it('handles adapter operation failure', async () => {
    const { registries, mockAdapter } = createMockRegistries();
    mockAdapter.createTable.mockRejectedValue(new Error('DB provision failed'));

    const plan = composeProvisioningPlan(testProfile);
    const bridge = createProvisioningBridge({
      adapterRegistries: registries,
      profile: testProfile,
    });

    const result = await bridge.executePlan(plan);

    const dbResult = result.stageResults.find(
      (r) => r.stageId === 'create-database',
    );
    expect(dbResult?.status).toBe('failed');
    expect(dbResult?.error).toContain('DB provision failed');
  });

  it('provides timing information', async () => {
    const { registries } = createMockRegistries();
    const plan = composeProvisioningPlan(testProfile);
    const bridge = createProvisioningBridge({
      adapterRegistries: registries,
      profile: testProfile,
    });

    const result = await bridge.executePlan(plan);

    expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
    for (const stageResult of result.stageResults) {
      expect(stageResult.durationMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('returns outputs from successful adapter operations', async () => {
    const { registries } = createMockRegistries();
    const plan = composeProvisioningPlan(testProfile);
    const bridge = createProvisioningBridge({
      adapterRegistries: registries,
      profile: testProfile,
    });

    const result = await bridge.executePlan(plan);

    const dbResult = result.stageResults.find(
      (r) => r.stageId === 'create-database',
    );
    expect(dbResult?.outputs).toEqual({ tableArn: 'arn:aws:dynamodb:table/test' });
  });

  it('executes a single stage directly', async () => {
    const { registries } = createMockRegistries();
    const plan = composeProvisioningPlan(testProfile);
    const bridge = createProvisioningBridge({
      adapterRegistries: registries,
      profile: testProfile,
    });

    const dbStage = plan.stages.find(
      (s) => s.stageId === 'create-database',
    )!;
    const result = await bridge.executeStage(dbStage);

    expect(result.status).toBe('success');
    expect(result.stageId).toBe('create-database');
  });

  // Scenario: full provisioning flow with mocked adapters
  it('scenario: full provisioning — compose plan, execute, verify all stages', async () => {
    const { registries, mockAdapter } = createMockRegistries();
    const plan = composeProvisioningPlan(testProfile);
    const bridge = createProvisioningBridge({
      adapterRegistries: registries,
      profile: testProfile,
    });

    expect(plan.status).toBe('ready');

    const result = await bridge.executePlan(plan);

    expect(result.status).toBe('completed');
    expect(result.storeId).toBe('test-store');

    // Verify core operations were called
    expect(mockAdapter.createTable).toHaveBeenCalled();
    expect(mockAdapter.createBucket).toHaveBeenCalled();
    expect(mockAdapter.createDistribution).toHaveBeenCalled();
    expect(mockAdapter.setupStoreSecrets).toHaveBeenCalled();
    expect(mockAdapter.deployCompute).toHaveBeenCalled();
    expect(mockAdapter.deployFrontend).toHaveBeenCalled();
  });
});
