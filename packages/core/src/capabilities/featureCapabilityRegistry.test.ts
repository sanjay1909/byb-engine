/**
 * Tests for featureCapabilityRegistry.ts — validates feature catalog and resolution.
 *
 * Covers:
 * - Listing the full catalog
 * - Getting a specific domain
 * - Resolving capabilities with all features enabled
 * - Resolving with some features disabled
 * - isCapabilityEnabled for specific capabilities
 * - String feature values (payment provider) treated as enabled
 * - Scenario: blog disabled, payments enabled with Stripe
 */
import { describe, it, expect } from 'vitest';
import { createFeatureCapabilityRegistry } from './featureCapabilityRegistry.js';
import type { StoreFeatureFlags } from '../profiles/storeProfileResolver.js';

describe('createFeatureCapabilityRegistry', () => {
  const registry = createFeatureCapabilityRegistry();

  const allEnabled: StoreFeatureFlags = {
    blog: true,
    campaigns: true,
    payments: 'stripe',
    analytics: true,
    oe: true,
  };

  const minimalFeatures: StoreFeatureFlags = {
    blog: false,
    campaigns: false,
    payments: false,
    analytics: false,
    oe: false,
  };

  it('lists the full catalog of feature domains', () => {
    const catalog = registry.listCatalog();

    expect(catalog.length).toBeGreaterThanOrEqual(6);
    const domainKeys = catalog.map((d) => d.domainKey);
    expect(domainKeys).toContain('storefront');
    expect(domainKeys).toContain('blog');
    expect(domainKeys).toContain('campaigns');
    expect(domainKeys).toContain('payments');
    expect(domainKeys).toContain('analytics');
    expect(domainKeys).toContain('oe');
  });

  it('gets a specific domain by key', () => {
    const blog = registry.getDomain('blog');
    expect(blog).toBeDefined();
    expect(blog!.displayName).toBe('Blog');
    expect(blog!.capabilities.length).toBeGreaterThan(0);
  });

  it('returns undefined for unknown domain', () => {
    expect(registry.getDomain('nonexistent')).toBeUndefined();
  });

  it('resolves all capabilities as enabled when features are on', () => {
    const resolved = registry.resolveCapabilities(allEnabled);

    // Every capability should be enabled
    for (const cap of resolved) {
      expect(cap.enabled).toBe(true);
    }
  });

  it('resolves blog capabilities as disabled when blog is off', () => {
    const features: StoreFeatureFlags = {
      ...allEnabled,
      blog: false,
    };

    const resolved = registry.resolveCapabilities(features);
    const blogCaps = resolved.filter((c) => c.domainKey === 'blog');

    expect(blogCaps.length).toBeGreaterThan(0);
    for (const cap of blogCaps) {
      expect(cap.enabled).toBe(false);
      expect(cap.enabledSource).toContain('blog=false');
    }
  });

  it('storefront is always enabled regardless of flags', () => {
    const resolved = registry.resolveCapabilities(minimalFeatures);
    const storefrontCaps = resolved.filter(
      (c) => c.domainKey === 'storefront',
    );

    for (const cap of storefrontCaps) {
      expect(cap.enabled).toBe(true);
      expect(cap.enabledSource).toBe('always-enabled');
    }
  });

  it('treats string payment value as enabled', () => {
    const features: StoreFeatureFlags = {
      ...minimalFeatures,
      payments: 'stripe',
    };

    const resolved = registry.resolveCapabilities(features);
    const paymentCaps = resolved.filter((c) => c.domainKey === 'payments');

    for (const cap of paymentCaps) {
      expect(cap.enabled).toBe(true);
      expect(cap.enabledSource).toContain('"stripe"');
    }
  });

  it('isCapabilityEnabled returns true for enabled capability', () => {
    expect(
      registry.isCapabilityEnabled('blog.create-post', allEnabled),
    ).toBe(true);
  });

  it('isCapabilityEnabled returns false for disabled capability', () => {
    expect(
      registry.isCapabilityEnabled('blog.create-post', {
        ...allEnabled,
        blog: false,
      }),
    ).toBe(false);
  });

  it('isCapabilityEnabled returns false for unknown capability', () => {
    expect(
      registry.isCapabilityEnabled('unknown.capability', allEnabled),
    ).toBe(false);
  });

  it('each resolved capability has enabledSource tracing', () => {
    const resolved = registry.resolveCapabilities(allEnabled);

    for (const cap of resolved) {
      expect(cap.enabledSource).toBeDefined();
      expect(cap.enabledSource.length).toBeGreaterThan(0);
    }
  });

  // Scenario: mixed features
  it('scenario: blog disabled, campaigns disabled, payments=stripe, oe enabled', () => {
    const features: StoreFeatureFlags = {
      blog: false,
      campaigns: false,
      payments: 'stripe',
      analytics: true,
      oe: true,
    };

    const resolved = registry.resolveCapabilities(features);

    // Blog and campaigns should be disabled
    const disabledCaps = resolved.filter(
      (c) =>
        (c.domainKey === 'blog' || c.domainKey === 'campaigns') &&
        c.enabled === true,
    );
    expect(disabledCaps).toHaveLength(0);

    // Payments, analytics, oe, storefront should be enabled
    const paymentCaps = resolved.filter(
      (c) => c.domainKey === 'payments' && c.enabled,
    );
    expect(paymentCaps.length).toBeGreaterThan(0);

    const oeCaps = resolved.filter((c) => c.domainKey === 'oe' && c.enabled);
    expect(oeCaps.length).toBeGreaterThan(0);
  });
});
