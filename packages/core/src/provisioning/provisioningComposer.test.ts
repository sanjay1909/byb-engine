/**
 * Tests for provisioningComposer.ts — validates provisioning plan generation.
 *
 * Covers:
 * - Full plan with all features enabled
 * - Plan with campaigns disabled (email/scheduler stages skipped)
 * - Plan summary counts
 * - Stage dependency tracking
 * - Plan status (ready vs blocked)
 * - Scenario: AWS store with minimal features
 */
import { describe, it, expect } from 'vitest';
import { composeProvisioningPlan } from './provisioningComposer.js';
import type { StoreProfile } from '../profiles/storeProfileResolver.js';

const fullProfile: StoreProfile = {
  profileId: 'test-full',
  match: { storeId: 'test-store' },
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
  deployment: { region: 'us-east-1' },
};

const minimalProfile: StoreProfile = {
  profileId: 'test-minimal',
  match: { storeId: 'minimal-store' },
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
    blog: false,
    campaigns: false,
    payments: false,
    analytics: false,
    oe: false,
  },
  deployment: { region: 'us-west-2' },
};

describe('composeProvisioningPlan', () => {
  it('generates a plan with all features enabled', () => {
    const plan = composeProvisioningPlan(fullProfile);

    expect(plan.storeId).toBe('test-store');
    expect(plan.status).toBe('ready');
    expect(plan.stages.length).toBeGreaterThan(0);

    // All stages should be planned (nothing skipped)
    const planned = plan.stages.filter((s) => s.status === 'planned');
    expect(planned.length).toBe(plan.stages.length);
  });

  it('skips email and scheduler stages when campaigns are disabled', () => {
    const plan = composeProvisioningPlan(minimalProfile);

    const emailStage = plan.stages.find((s) => s.stageId === 'setup-email');
    const schedulerStage = plan.stages.find(
      (s) => s.stageId === 'setup-scheduler',
    );

    expect(emailStage?.status).toBe('skipped');
    expect(schedulerStage?.status).toBe('skipped');
  });

  it('always plans required stages regardless of features', () => {
    const plan = composeProvisioningPlan(minimalProfile);

    const requiredStages = plan.stages.filter((s) => s.required);
    for (const stage of requiredStages) {
      expect(stage.status).toBe('planned');
    }
  });

  it('provides accurate summary counts', () => {
    const plan = composeProvisioningPlan(minimalProfile);

    expect(plan.summary.total).toBe(plan.stages.length);
    expect(plan.summary.planned + plan.summary.skipped + plan.summary.blocked)
      .toBe(plan.summary.total);
    expect(plan.summary.skipped).toBeGreaterThan(0);
  });

  it('includes dependency information on stages', () => {
    const plan = composeProvisioningPlan(fullProfile);

    const cdnStage = plan.stages.find((s) => s.stageId === 'setup-cdn');
    expect(cdnStage?.dependsOn).toContain('create-storage');

    const deployBackend = plan.stages.find(
      (s) => s.stageId === 'deploy-backend',
    );
    expect(deployBackend?.dependsOn).toContain('create-database');
    expect(deployBackend?.dependsOn).toContain('create-storage');
    expect(deployBackend?.dependsOn).toContain('configure-secrets');
  });

  it('maps stages to correct adapter domains', () => {
    const plan = composeProvisioningPlan(fullProfile);

    const dbStage = plan.stages.find((s) => s.stageId === 'create-database');
    expect(dbStage?.adapterDomain).toBe('db');

    const storageStage = plan.stages.find(
      (s) => s.stageId === 'create-storage',
    );
    expect(storageStage?.adapterDomain).toBe('storage');

    const cdnStage = plan.stages.find((s) => s.stageId === 'setup-cdn');
    expect(cdnStage?.adapterDomain).toBe('cdn');
  });

  it('each stage has a status reason', () => {
    const plan = composeProvisioningPlan(minimalProfile);

    for (const stage of plan.stages) {
      expect(stage.statusReason).toBeDefined();
      expect(stage.statusReason.length).toBeGreaterThan(0);
    }
  });

  // Scenario: minimal AWS store
  it('scenario: minimal store gets core infra but no email/scheduler', () => {
    const plan = composeProvisioningPlan(minimalProfile);

    const plannedIds = plan.stages
      .filter((s) => s.status === 'planned')
      .map((s) => s.stageId);

    // Core infra is always provisioned
    expect(plannedIds).toContain('create-database');
    expect(plannedIds).toContain('create-storage');
    expect(plannedIds).toContain('setup-cdn');
    expect(plannedIds).toContain('configure-secrets');
    expect(plannedIds).toContain('deploy-backend');
    expect(plannedIds).toContain('deploy-frontend');

    // Email and scheduler are skipped
    const skippedIds = plan.stages
      .filter((s) => s.status === 'skipped')
      .map((s) => s.stageId);

    expect(skippedIds).toContain('setup-email');
    expect(skippedIds).toContain('setup-scheduler');
  });

  it('includes configure-dns stage', () => {
    const plan = composeProvisioningPlan(fullProfile);

    const dnsStage = plan.stages.find((s) => s.stageId === 'configure-dns');
    expect(dnsStage).toBeDefined();
    expect(dnsStage?.adapterDomain).toBe('dns');
    expect(dnsStage?.dependsOn).toContain('setup-cdn');
  });

  it('includes setup-pipeline stage', () => {
    const plan = composeProvisioningPlan(fullProfile);

    const pipelineStage = plan.stages.find(
      (s) => s.stageId === 'setup-pipeline',
    );
    expect(pipelineStage).toBeDefined();
    expect(pipelineStage?.adapterDomain).toBe('pipeline');
    expect(pipelineStage?.dependsOn).toContain('deploy-frontend');
  });

  it('dns and pipeline stages are planned for full profile', () => {
    const plan = composeProvisioningPlan(fullProfile);

    const dnsStage = plan.stages.find((s) => s.stageId === 'configure-dns');
    const pipelineStage = plan.stages.find(
      (s) => s.stageId === 'setup-pipeline',
    );

    expect(dnsStage?.status).toBe('planned');
    expect(pipelineStage?.status).toBe('planned');
  });

  it('dns and pipeline stages are not required', () => {
    const plan = composeProvisioningPlan(fullProfile);

    const dnsStage = plan.stages.find((s) => s.stageId === 'configure-dns');
    const pipelineStage = plan.stages.find(
      (s) => s.stageId === 'setup-pipeline',
    );

    expect(dnsStage?.required).toBe(false);
    expect(pipelineStage?.required).toBe(false);
  });
});
