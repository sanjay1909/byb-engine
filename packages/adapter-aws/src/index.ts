/**
 * @byb/adapter-aws — AWS adapter implementations for BYB.
 *
 * This package provides AWS-specific adapters that implement the interfaces
 * from @byb/core. Each adapter wraps an AWS SDK v3 client behind the
 * generic adapter interface.
 *
 * Use `registerAllAwsAdapters()` to register all AWS adapters in your
 * adapter registries in one call.
 *
 * Usage:
 *   import { registerAllAwsAdapters } from '@byb/adapter-aws';
 *   const registries = registerAllAwsAdapters({ region: 'us-east-1', ... });
 */

export {
  createDynamoDbAdapter,
  type DynamoDbAdapterOptions,
} from './dynamoDbAdapter.js';

export {
  createS3StorageAdapter,
  type S3StorageAdapterOptions,
} from './s3StorageAdapter.js';

export {
  createSesEmailAdapter,
  type SesEmailAdapterOptions,
} from './sesEmailAdapter.js';

export {
  createSsmSecretsAdapter,
  type SsmSecretsAdapterOptions,
} from './ssmSecretsAdapter.js';

export {
  createEventBridgeSchedulerAdapter,
  type EventBridgeSchedulerAdapterOptions,
} from './eventBridgeSchedulerAdapter.js';

export {
  createCloudfrontCdnAdapter,
  type CloudfrontCdnAdapterOptions,
} from './cloudfrontCdnAdapter.js';

export {
  createCdkInfraAdapter,
  type CdkInfraAdapterOptions,
} from './cdkInfraAdapter.js';

export {
  registerAllAwsAdapters,
  type AwsRegistrationOptions,
} from './registerAwsAdapters.js';
