# @byb/adapter-aws

AWS adapter implementations for the BYB ecommerce engine. Each adapter wraps an AWS SDK v3 client behind the generic adapter interface from `@byb/core`.

## Adapters

| Interface | AWS Service | Adapter | File |
|-----------|------------|---------|------|
| `DbAdapter` | DynamoDB | `createDynamoDbAdapter` | `dynamoDbAdapter.ts` |
| `StorageAdapter` | S3 | `createS3StorageAdapter` | `s3StorageAdapter.ts` |
| `CdnAdapter` | CloudFront | `createCloudfrontCdnAdapter` | `cloudfrontCdnAdapter.ts` |
| `EmailAdapter` | SES | `createSesEmailAdapter` | `sesEmailAdapter.ts` |
| `SecretsAdapter` | SSM Parameter Store | `createSsmSecretsAdapter` | `ssmSecretsAdapter.ts` |
| `SchedulerAdapter` | EventBridge Scheduler | `createEventBridgeSchedulerAdapter` | `eventBridgeSchedulerAdapter.ts` |
| `InfraAdapter` | CloudFormation/CDK | `createCdkInfraAdapter` | `cdkInfraAdapter.ts` |

## Quick Start

Register all 7 AWS adapters in one call:

```typescript
import { registerAllAwsAdapters } from '@byb/adapter-aws';

const registries = registerAllAwsAdapters({
  region: 'us-east-1',
  tableName: 'my-store-table',      // DynamoDB
  bucketName: 'my-store-assets',     // S3
  distributionId: 'E1234567890',     // CloudFront
  sesFromEmail: 'noreply@myshop.com', // SES
  ssmPrefix: '/byb/my-store/',       // SSM
  schedulerGroupName: 'my-store',    // EventBridge
  stackPrefix: 'byb-my-store',      // CloudFormation
});
```

Or create individual adapters:

```typescript
import { createDynamoDbAdapter } from '@byb/adapter-aws';

const db = createDynamoDbAdapter({
  region: 'us-east-1',
  tableName: 'my-store',
});

await db.putItem({ pk: 'PRODUCT#1', sk: 'META', name: 'Widget' });
const item = await db.getItem({ pk: 'PRODUCT#1', sk: 'META' });
```

## Setup

Requires AWS credentials configured via:
- Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- AWS profile (`~/.aws/credentials`)
- IAM role (when running on EC2/Lambda/ECS)

## Tests
```bash
npx vitest run packages/adapter-aws/
```
