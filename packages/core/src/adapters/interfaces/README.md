# Adapter Interfaces

TypeScript interfaces defining what each infrastructure adapter must implement.
These are the contracts that cloud-specific packages (adapter-aws, adapter-azure, etc.) fulfill.

## Domains

| Interface | File | Purpose |
|-----------|------|---------|
| `DbAdapter` | `dbAdapter.ts` | Database CRUD, queries, and transactions |
| `StorageAdapter` | `storageAdapter.ts` | Object storage: upload, download, presigned URLs |
| `CdnAdapter` | `cdnAdapter.ts` | CDN distribution management and cache invalidation |
| `EmailAdapter` | `emailAdapter.ts` | Transactional and campaign email sending |
| `SecretsAdapter` | `secretsAdapter.ts` | Secure credential storage and retrieval |
| `SchedulerAdapter` | `schedulerAdapter.ts` | Job scheduling: cron and one-time triggers |
| `InfraAdapter` | `infraAdapter.ts` | Full-stack infrastructure provisioning (IaC) |

## Usage

Cloud adapter packages import these interfaces and implement them:

```typescript
import { DbAdapter } from '@byb/core';

export class DynamoDbAdapter implements DbAdapter {
  async get(params) { ... }
  async put(params) { ... }
}
```
