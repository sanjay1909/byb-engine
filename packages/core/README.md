# @byb/core

Core engine abstractions for the BYB ecommerce engine. This package contains no cloud-specific code — it defines the interfaces and patterns that cloud adapters implement.

## Key Modules

| Module | Purpose |
|--------|---------|
| `adapters/` | Generic adapter registry and contract validation. Cloud adapters register here. |
| `adapters/interfaces/` | TypeScript interfaces for each infrastructure concern (DB, storage, CDN, etc.) |
| `profiles/` | Store profile resolver — matches a storeId to its adapter selections and feature flags |
| `capabilities/` | Feature capability registry — catalogs store features (blog, campaigns, payments) with enable/disable |
| `provisioning/` | Provisioning composer and bridge — generates and executes deployment plans |

## Architecture

The pattern flows like this:

```
Store Profile → resolves → Adapter Selections + Feature Flags
                              ↓                       ↓
                    Adapter Registry         Capability Registry
                    (resolve adapters)       (evaluate features)
                              ↓                       ↓
                    Provisioning Composer ← merges both
                              ↓
                    Provisioning Bridge
                    (executes stages via adapters)
```

This is ported from the SIS platform's orchestration architecture, adapted for ecommerce provisioning.

## Adapter Interfaces

7 interfaces defined in `adapters/interfaces/`:

| Interface | Domain | Key Methods |
|-----------|--------|-------------|
| `DbAdapter` | Database | `putItem`, `getItem`, `queryItems`, `deleteItem`, `updateItem`, `batchWrite`, `transactWrite` |
| `StorageAdapter` | Object Storage | `upload`, `download`, `delete`, `list`, `getPresignedUploadUrl`, `getPresignedDownloadUrl` |
| `CdnAdapter` | CDN | `invalidateCache`, `getDomainName`, `getDistributionId` |
| `EmailAdapter` | Email | `sendEmail`, `sendTemplatedEmail` |
| `SecretsAdapter` | Secrets | `getSecret`, `putSecret`, `deleteSecret` |
| `SchedulerAdapter` | Scheduling | `createSchedule`, `deleteSchedule`, `listSchedules` |
| `InfraAdapter` | IaC | `provisionStack`, `getStackStatus`, `destroyStack`, `listStacks` |

## Usage

```typescript
import {
  createAdapterRegistry,
  assertAdapterContract,
  createStoreProfileResolver,
  createFeatureCapabilityRegistry,
  composeProvisioningPlan,
  createProvisioningBridge,
} from '@byb/core';

// Register adapters
const dbRegistry = createAdapterRegistry<DbAdapter>('db');
dbRegistry.registerAdapter('dynamodb', myDynamoAdapter);

// Resolve profiles
const resolver = createStoreProfileResolver();
resolver.registerProfile(myProfile);
const resolved = resolver.resolve({ storeId: 'my-shop' });

// Compose & execute provisioning
const plan = composeProvisioningPlan(resolved.profile);
const bridge = createProvisioningBridge({ adapters: registries });
const result = await bridge.executePlan(plan);
```

## Tests
```bash
npx vitest run packages/core/
```
