/**
 * registerMockAdapters.ts — Bulk registration of all mock adapters.
 *
 * Convenience function that creates adapter registries for all 9 domains
 * and registers the in-memory mock implementations in each. This is the
 * entry point for wiring up a complete mock adapter set for demos and tests.
 *
 * Follows the exact same pattern as registerAllAwsAdapters from @byb/adapter-aws.
 *
 * How it connects to the system:
 * - Called once during engine initialization (or in tests)
 * - Returns a Map of domain -> registry that the provisioning bridge uses
 * - Each registry has the mock adapter registered under its 'mock-*' ID
 *
 * Usage:
 *   const registries = registerAllMockAdapters({ delay: 100 });
 *   // registries.get('db') -> registry with 'mock-db' adapter
 *   // registries.get('storage') -> registry with 'mock-storage' adapter
 */

import {
  createAdapterRegistry,
  DB_ADAPTER_REQUIRED_METHODS,
  STORAGE_ADAPTER_REQUIRED_METHODS,
  CDN_ADAPTER_REQUIRED_METHODS,
  EMAIL_ADAPTER_REQUIRED_METHODS,
  SECRETS_ADAPTER_REQUIRED_METHODS,
  SCHEDULER_ADAPTER_REQUIRED_METHODS,
  INFRA_ADAPTER_REQUIRED_METHODS,
  DNS_ADAPTER_REQUIRED_METHODS,
  PIPELINE_ADAPTER_REQUIRED_METHODS,
  type AdapterRegistry,
} from '@byb/core';

import { createMockDbAdapter } from './mockDbAdapter.js';
import { createMockStorageAdapter } from './mockStorageAdapter.js';
import { createMockCdnAdapter } from './mockCdnAdapter.js';
import { createMockEmailAdapter } from './mockEmailAdapter.js';
import { createMockSecretsAdapter } from './mockSecretsAdapter.js';
import { createMockSchedulerAdapter } from './mockSchedulerAdapter.js';
import { createMockInfraAdapter } from './mockInfraAdapter.js';
import { createMockDnsAdapter } from './mockDnsAdapter.js';
import { createMockPipelineAdapter } from './mockPipelineAdapter.js';

/**
 * Configuration for registering all mock adapters.
 */
export interface MockRegistrationOptions {
  /** Global delay in ms for all mock adapters (default: 0) */
  delay?: number;
  /** Per-adapter delay overrides keyed by domain name */
  delays?: Partial<
    Record<
      | 'db'
      | 'storage'
      | 'cdn'
      | 'email'
      | 'secrets'
      | 'scheduler'
      | 'infra'
      | 'dns'
      | 'pipeline',
      number
    >
  >;
}

/**
 * Registers all 9 mock adapters and returns a Map of domain -> registry.
 *
 * @param options - Optional delay configuration for demo mode
 * @returns Map of adapter domain -> AdapterRegistry
 */
export function registerAllMockAdapters(
  options?: MockRegistrationOptions,
): Map<string, AdapterRegistry<unknown>> {
  const globalDelay = options?.delay ?? 0;
  const delays = options?.delays ?? {};
  const registries = new Map<string, AdapterRegistry<unknown>>();

  // DB adapter (in-memory Map)
  const dbRegistry = createAdapterRegistry({
    domain: 'db',
    requiredMethods: [...DB_ADAPTER_REQUIRED_METHODS],
  });
  dbRegistry.registerAdapter(
    'mock-db',
    () => createMockDbAdapter({ delay: delays.db ?? globalDelay }),
    { cloud: 'mock', service: 'In-Memory DB' },
  );
  registries.set('db', dbRegistry);

  // Storage adapter (in-memory Map)
  const storageRegistry = createAdapterRegistry({
    domain: 'storage',
    requiredMethods: [...STORAGE_ADAPTER_REQUIRED_METHODS],
  });
  storageRegistry.registerAdapter(
    'mock-storage',
    () =>
      createMockStorageAdapter({ delay: delays.storage ?? globalDelay }),
    { cloud: 'mock', service: 'In-Memory Storage' },
  );
  registries.set('storage', storageRegistry);

  // CDN adapter (in-memory Map)
  const cdnRegistry = createAdapterRegistry({
    domain: 'cdn',
    requiredMethods: [...CDN_ADAPTER_REQUIRED_METHODS],
  });
  cdnRegistry.registerAdapter(
    'mock-cdn',
    () => createMockCdnAdapter({ delay: delays.cdn ?? globalDelay }),
    { cloud: 'mock', service: 'In-Memory CDN' },
  );
  registries.set('cdn', cdnRegistry);

  // Email adapter (in-memory array)
  const emailRegistry = createAdapterRegistry({
    domain: 'email',
    requiredMethods: [...EMAIL_ADAPTER_REQUIRED_METHODS],
  });
  emailRegistry.registerAdapter(
    'mock-email',
    () => createMockEmailAdapter({ delay: delays.email ?? globalDelay }),
    { cloud: 'mock', service: 'In-Memory Email' },
  );
  registries.set('email', emailRegistry);

  // Secrets adapter (in-memory Map)
  const secretsRegistry = createAdapterRegistry({
    domain: 'secrets',
    requiredMethods: [...SECRETS_ADAPTER_REQUIRED_METHODS],
  });
  secretsRegistry.registerAdapter(
    'mock-secrets',
    () =>
      createMockSecretsAdapter({ delay: delays.secrets ?? globalDelay }),
    { cloud: 'mock', service: 'In-Memory Secrets' },
  );
  registries.set('secrets', secretsRegistry);

  // Scheduler adapter (in-memory Map)
  const schedulerRegistry = createAdapterRegistry({
    domain: 'scheduler',
    requiredMethods: [...SCHEDULER_ADAPTER_REQUIRED_METHODS],
  });
  schedulerRegistry.registerAdapter(
    'mock-scheduler',
    () =>
      createMockSchedulerAdapter({
        delay: delays.scheduler ?? globalDelay,
      }),
    { cloud: 'mock', service: 'In-Memory Scheduler' },
  );
  registries.set('scheduler', schedulerRegistry);

  // Infra adapter (in-memory Map)
  const infraRegistry = createAdapterRegistry({
    domain: 'infra',
    requiredMethods: [...INFRA_ADAPTER_REQUIRED_METHODS],
  });
  infraRegistry.registerAdapter(
    'mock-infra',
    () => createMockInfraAdapter({ delay: delays.infra ?? globalDelay }),
    { cloud: 'mock', service: 'In-Memory Infra' },
  );
  registries.set('infra', infraRegistry);

  // DNS adapter (in-memory Map)
  const dnsRegistry = createAdapterRegistry({
    domain: 'dns',
    requiredMethods: [...DNS_ADAPTER_REQUIRED_METHODS],
  });
  dnsRegistry.registerAdapter(
    'mock-dns',
    () => createMockDnsAdapter({ delay: delays.dns ?? globalDelay }),
    { cloud: 'mock', service: 'In-Memory DNS' },
  );
  registries.set('dns', dnsRegistry);

  // Pipeline adapter (in-memory Map)
  const pipelineRegistry = createAdapterRegistry({
    domain: 'pipeline',
    requiredMethods: [...PIPELINE_ADAPTER_REQUIRED_METHODS],
  });
  pipelineRegistry.registerAdapter(
    'mock-pipeline',
    () =>
      createMockPipelineAdapter({
        delay: delays.pipeline ?? globalDelay,
      }),
    { cloud: 'mock', service: 'In-Memory Pipeline' },
  );
  registries.set('pipeline', pipelineRegistry);

  return registries;
}
