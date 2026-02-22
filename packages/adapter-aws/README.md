# @byb/adapter-aws

AWS adapter implementations for the BYB ecommerce engine.

Implements the adapter interfaces from `@byb/core` using AWS services:

| Interface | AWS Service | File |
|-----------|------------|------|
| `DbAdapter` | DynamoDB | `dynamoDbAdapter.ts` |
| `StorageAdapter` | S3 | `s3StorageAdapter.ts` |
| `CdnAdapter` | CloudFront | `cloudfrontCdnAdapter.ts` |
| `EmailAdapter` | SES | `sesEmailAdapter.ts` |
| `SecretsAdapter` | SSM Parameter Store | `ssmSecretsAdapter.ts` |
| `SchedulerAdapter` | EventBridge | `eventBridgeSchedulerAdapter.ts` |
| `InfraAdapter` | CDK | `cdkInfraAdapter.ts` |

## Setup

Requires AWS credentials configured via environment variables or AWS profile.

## Status

Placeholder — implementations coming in Phase 2.
