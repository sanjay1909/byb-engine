/**
 * Tests for featureContracts.ts — validates runtime feature evaluation.
 *
 * Covers:
 * - Evaluating an enabled capability
 * - Evaluating a disabled capability
 * - Evaluating an unknown capability
 * - Listing all contracts
 * - Getting enabled/disabled capability lists
 * - Scenario: provisioning flow checks features before executing stages
 */
import { describe, it, expect } from 'vitest';
import { createFeatureContracts } from './featureContracts.js';
import type { ResolvedCapability } from './featureCapabilityRegistry.js';

const sampleCapabilities: ResolvedCapability[] = [
  {
    domainKey: 'storefront',
    capabilityId: 'storefront.product-catalog',
    enabled: true,
    enabledSource: 'always-enabled',
  },
  {
    domainKey: 'blog',
    capabilityId: 'blog.create-post',
    enabled: true,
    enabledSource: 'features.blog=true',
  },
  {
    domainKey: 'blog',
    capabilityId: 'blog.publish',
    enabled: true,
    enabledSource: 'features.blog=true',
  },
  {
    domainKey: 'campaigns',
    capabilityId: 'campaigns.email-send',
    enabled: false,
    enabledSource: 'features.campaigns=false',
  },
  {
    domainKey: 'payments',
    capabilityId: 'payments.checkout-session',
    enabled: true,
    enabledSource: 'features.payments="stripe"',
  },
];

describe('createFeatureContracts', () => {
  const contracts = createFeatureContracts(sampleCapabilities);

  it('evaluates an enabled capability as allowed', () => {
    const result = contracts.evaluateFeature('blog.create-post');

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('ALLOWED');
    expect(result.detail).toContain('enabled');
  });

  it('evaluates a disabled capability as not allowed', () => {
    const result = contracts.evaluateFeature('campaigns.email-send');

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('FEATURE_DISABLED');
    expect(result.detail).toContain('disabled');
    expect(result.detail).toContain('campaigns=false');
  });

  it('evaluates an unknown capability as not allowed', () => {
    const result = contracts.evaluateFeature('unknown.thing');

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('UNKNOWN_CAPABILITY');
    expect(result.detail).toContain('not in the feature catalog');
  });

  it('lists all contracts', () => {
    const all = contracts.listContracts();
    expect(all).toHaveLength(sampleCapabilities.length);
  });

  it('gets enabled capabilities', () => {
    const enabled = contracts.getEnabledCapabilities();

    expect(enabled).toContain('blog.create-post');
    expect(enabled).toContain('payments.checkout-session');
    expect(enabled).not.toContain('campaigns.email-send');
  });

  it('gets disabled capabilities', () => {
    const disabled = contracts.getDisabledCapabilities();

    expect(disabled).toContain('campaigns.email-send');
    expect(disabled).not.toContain('blog.create-post');
  });

  // Scenario: provisioning flow evaluates features before executing stages
  it('scenario: provisioning flow skips disabled stages', () => {
    const stages = [
      { name: 'provision-blog', requiredCapability: 'blog.create-post' },
      { name: 'provision-campaigns', requiredCapability: 'campaigns.email-send' },
      { name: 'provision-payments', requiredCapability: 'payments.checkout-session' },
    ];

    const executedStages: string[] = [];
    const skippedStages: string[] = [];

    for (const stage of stages) {
      const evaluation = contracts.evaluateFeature(stage.requiredCapability);
      if (evaluation.allowed) {
        executedStages.push(stage.name);
      } else {
        skippedStages.push(stage.name);
      }
    }

    expect(executedStages).toEqual(['provision-blog', 'provision-payments']);
    expect(skippedStages).toEqual(['provision-campaigns']);
  });
});
