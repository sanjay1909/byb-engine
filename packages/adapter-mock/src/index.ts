/**
 * @byb/adapter-mock — In-memory mock adapter implementations for BYB.
 *
 * This package provides mock adapters that implement all 9 adapter interfaces
 * from @byb/core. No real cloud accounts are needed — all data is stored
 * in-memory using Maps and arrays.
 *
 * Each mock adapter includes inspector methods (e.g., getSentEmails(),
 * getStoredItems()) for verifying behavior in tests and demos.
 *
 * Use `registerAllMockAdapters()` to register all 9 mock adapters in your
 * adapter registries in one call.
 *
 * Usage:
 *   import { registerAllMockAdapters } from '@byb/adapter-mock';
 *   const registries = registerAllMockAdapters({ delay: 100 });
 */

export {
  createMockDbAdapter,
  type MockDbAdapter,
  type MockDbAdapterOptions,
} from './mockDbAdapter.js';

export {
  createMockStorageAdapter,
  type MockStorageAdapter,
  type MockStorageAdapterOptions,
  type MockStoredObject,
} from './mockStorageAdapter.js';

export {
  createMockCdnAdapter,
  type MockCdnAdapter,
  type MockCdnAdapterOptions,
  type MockDistribution,
  type MockInvalidation,
} from './mockCdnAdapter.js';

export {
  createMockEmailAdapter,
  type MockEmailAdapter,
  type MockEmailAdapterOptions,
  type MockSentEmail,
} from './mockEmailAdapter.js';

export {
  createMockSecretsAdapter,
  type MockSecretsAdapter,
  type MockSecretsAdapterOptions,
} from './mockSecretsAdapter.js';

export {
  createMockSchedulerAdapter,
  type MockSchedulerAdapter,
  type MockSchedulerAdapterOptions,
  type MockSchedule,
} from './mockSchedulerAdapter.js';

export {
  createMockInfraAdapter,
  type MockInfraAdapter,
  type MockInfraAdapterOptions,
} from './mockInfraAdapter.js';

export {
  createMockDnsAdapter,
  type MockDnsAdapter,
  type MockDnsAdapterOptions,
  type MockDomainEntry,
} from './mockDnsAdapter.js';

export {
  createMockPipelineAdapter,
  type MockPipelineAdapter,
  type MockPipelineAdapterOptions,
  type MockPipeline,
  type MockBuild,
} from './mockPipelineAdapter.js';

export {
  registerAllMockAdapters,
  type MockRegistrationOptions,
} from './registerMockAdapters.js';
