/**
 * registerMockAdapters.test.ts — Tests for bulk registration of all mock adapters.
 *
 * Verifies that registerAllMockAdapters() creates a Map of 9 adapter registries
 * (one per domain), each with a working mock adapter that passes contract validation.
 */

import { describe, it, expect } from 'vitest';

import {
  assertAdapterContract,
  DB_ADAPTER_REQUIRED_METHODS,
  STORAGE_ADAPTER_REQUIRED_METHODS,
  CDN_ADAPTER_REQUIRED_METHODS,
  EMAIL_ADAPTER_REQUIRED_METHODS,
  SECRETS_ADAPTER_REQUIRED_METHODS,
  SCHEDULER_ADAPTER_REQUIRED_METHODS,
  INFRA_ADAPTER_REQUIRED_METHODS,
  DNS_ADAPTER_REQUIRED_METHODS,
  PIPELINE_ADAPTER_REQUIRED_METHODS,
} from '@byb/core';

import { registerAllMockAdapters } from './registerMockAdapters.js';

const ALL_DOMAINS = [
  'db',
  'storage',
  'cdn',
  'email',
  'secrets',
  'scheduler',
  'infra',
  'dns',
  'pipeline',
] as const;

describe('registerAllMockAdapters', () => {
  it('returns a Map with exactly 9 entries (one per adapter domain)', () => {
    const registries = registerAllMockAdapters();
    expect(registries.size).toBe(9);
  });

  it('has a registry for every expected domain', () => {
    const registries = registerAllMockAdapters();
    for (const domain of ALL_DOMAINS) {
      expect(registries.has(domain)).toBe(true);
    }
  });

  it('each registry resolves its mock adapter by the expected ID', () => {
    const registries = registerAllMockAdapters();
    const expectedIds: Record<string, string> = {
      db: 'mock-db',
      storage: 'mock-storage',
      cdn: 'mock-cdn',
      email: 'mock-email',
      secrets: 'mock-secrets',
      scheduler: 'mock-scheduler',
      infra: 'mock-infra',
      dns: 'mock-dns',
      pipeline: 'mock-pipeline',
    };

    for (const [domain, expectedId] of Object.entries(expectedIds)) {
      const registry = registries.get(domain)!;
      const adapter = registry.resolveAdapter(expectedId, {});
      expect(adapter).toBeTruthy();
    }
  });

  it('resolved db adapter passes contract validation', () => {
    const registries = registerAllMockAdapters();
    const adapter = registries.get('db')!.resolveAdapter('mock-db', {});
    expect(() =>
      assertAdapterContract(
        adapter as Record<string, unknown>,
        [...DB_ADAPTER_REQUIRED_METHODS],
        'mock-db',
        'db',
      ),
    ).not.toThrow();
  });

  it('resolved storage adapter passes contract validation', () => {
    const registries = registerAllMockAdapters();
    const adapter = registries.get('storage')!.resolveAdapter('mock-storage', {});
    expect(() =>
      assertAdapterContract(
        adapter as Record<string, unknown>,
        [...STORAGE_ADAPTER_REQUIRED_METHODS],
        'mock-storage',
        'storage',
      ),
    ).not.toThrow();
  });

  it('all resolved adapters pass contract validation', () => {
    const registries = registerAllMockAdapters();

    const domainContracts: Record<string, { id: string; methods: readonly string[] }> = {
      db: { id: 'mock-db', methods: DB_ADAPTER_REQUIRED_METHODS },
      storage: { id: 'mock-storage', methods: STORAGE_ADAPTER_REQUIRED_METHODS },
      cdn: { id: 'mock-cdn', methods: CDN_ADAPTER_REQUIRED_METHODS },
      email: { id: 'mock-email', methods: EMAIL_ADAPTER_REQUIRED_METHODS },
      secrets: { id: 'mock-secrets', methods: SECRETS_ADAPTER_REQUIRED_METHODS },
      scheduler: { id: 'mock-scheduler', methods: SCHEDULER_ADAPTER_REQUIRED_METHODS },
      infra: { id: 'mock-infra', methods: INFRA_ADAPTER_REQUIRED_METHODS },
      dns: { id: 'mock-dns', methods: DNS_ADAPTER_REQUIRED_METHODS },
      pipeline: { id: 'mock-pipeline', methods: PIPELINE_ADAPTER_REQUIRED_METHODS },
    };

    for (const [domain, { id, methods }] of Object.entries(domainContracts)) {
      const registry = registries.get(domain)!;
      const adapter = registry.resolveAdapter(id, {});
      expect(() =>
        assertAdapterContract(
          adapter as Record<string, unknown>,
          [...methods],
          id,
          domain,
        ),
      ).not.toThrow();
    }
  });

  it('accepts custom delay options without error', () => {
    expect(() =>
      registerAllMockAdapters({ delay: 50 }),
    ).not.toThrow();
  });

  it('accepts per-adapter delay overrides without error', () => {
    expect(() =>
      registerAllMockAdapters({
        delays: {
          db: 10,
          storage: 20,
          cdn: 30,
          email: 0,
          secrets: 5,
          scheduler: 15,
          infra: 25,
          dns: 35,
          pipeline: 40,
        },
      }),
    ).not.toThrow();
  });
});
