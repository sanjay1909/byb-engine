/**
 * registerAwsAdapters.ts — Bulk registration of all AWS adapters.
 *
 * Convenience function that creates adapter registries for all 7 domains
 * and registers the AWS implementations in each. This is the entry point
 * for wiring up a complete AWS adapter set.
 *
 * How it connects to the system:
 * - Called once during engine initialization
 * - Returns a Map of domain → registry that the provisioning bridge uses
 * - Each registry has the AWS adapter registered under its standard ID
 *
 * Usage:
 *   const registries = registerAllAwsAdapters({
 *     tableName: 'byb-store-1',
 *     bucketName: 'byb-store-1-assets',
 *     region: 'us-east-1',
 *     schedulerRoleArn: 'arn:aws:iam::123:role/scheduler',
 *   });
 *   // registries.get('db') → registry with 'dynamodb' adapter
 *   // registries.get('storage') → registry with 's3' adapter
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
  type AdapterRegistry,
} from '@byb/core';

import { createDynamoDbAdapter } from './dynamoDbAdapter.js';
import { createS3StorageAdapter } from './s3StorageAdapter.js';
import { createSesEmailAdapter } from './sesEmailAdapter.js';
import { createSsmSecretsAdapter } from './ssmSecretsAdapter.js';
import { createEventBridgeSchedulerAdapter } from './eventBridgeSchedulerAdapter.js';
import { createCloudfrontCdnAdapter } from './cloudfrontCdnAdapter.js';
import { createCdkInfraAdapter } from './cdkInfraAdapter.js';

/**
 * Configuration for registering all AWS adapters.
 */
export interface AwsRegistrationOptions {
  /** DynamoDB table name */
  tableName: string;
  /** S3 bucket name */
  bucketName: string;
  /** AWS region */
  region: string;
  /** IAM role ARN for EventBridge Scheduler */
  schedulerRoleArn: string;
  /** Optional CloudFront domain for storage public URLs */
  cdnDomain?: string;
  /** Optional CloudFormation template URL for infra provisioning */
  templateUrl?: string;
  /** Optional stack name prefix */
  stackNamePrefix?: string;
}

/**
 * Registers all AWS adapters and returns a Map of domain → registry.
 *
 * @param options - AWS-specific configuration
 * @returns Map of adapter domain → AdapterRegistry
 */
export function registerAllAwsAdapters(
  options: AwsRegistrationOptions,
): Map<string, AdapterRegistry<unknown>> {
  const registries = new Map<string, AdapterRegistry<unknown>>();

  // DB adapter (DynamoDB)
  const dbRegistry = createAdapterRegistry({
    domain: 'db',
    requiredMethods: [...DB_ADAPTER_REQUIRED_METHODS],
  });
  dbRegistry.registerAdapter(
    'dynamodb',
    (ctx) =>
      createDynamoDbAdapter({
        tableName: options.tableName,
        region: ctx.region ?? options.region,
      }),
    { cloud: 'aws', service: 'DynamoDB' },
  );
  registries.set('db', dbRegistry);

  // Storage adapter (S3)
  const storageRegistry = createAdapterRegistry({
    domain: 'storage',
    requiredMethods: [...STORAGE_ADAPTER_REQUIRED_METHODS],
  });
  storageRegistry.registerAdapter(
    's3',
    (ctx) =>
      createS3StorageAdapter({
        bucketName: options.bucketName,
        region: ctx.region ?? options.region,
        cdnDomain: options.cdnDomain,
      }),
    { cloud: 'aws', service: 'S3' },
  );
  registries.set('storage', storageRegistry);

  // CDN adapter (CloudFront)
  const cdnRegistry = createAdapterRegistry({
    domain: 'cdn',
    requiredMethods: [...CDN_ADAPTER_REQUIRED_METHODS],
  });
  cdnRegistry.registerAdapter(
    'cloudfront',
    (ctx) =>
      createCloudfrontCdnAdapter({
        region: ctx.region ?? options.region,
      }),
    { cloud: 'aws', service: 'CloudFront' },
  );
  registries.set('cdn', cdnRegistry);

  // Email adapter (SES)
  const emailRegistry = createAdapterRegistry({
    domain: 'email',
    requiredMethods: [...EMAIL_ADAPTER_REQUIRED_METHODS],
  });
  emailRegistry.registerAdapter(
    'ses',
    (ctx) =>
      createSesEmailAdapter({
        region: ctx.region ?? options.region,
      }),
    { cloud: 'aws', service: 'SES' },
  );
  registries.set('email', emailRegistry);

  // Secrets adapter (SSM)
  const secretsRegistry = createAdapterRegistry({
    domain: 'secrets',
    requiredMethods: [...SECRETS_ADAPTER_REQUIRED_METHODS],
  });
  secretsRegistry.registerAdapter(
    'ssm',
    (ctx) =>
      createSsmSecretsAdapter({
        region: ctx.region ?? options.region,
      }),
    { cloud: 'aws', service: 'SSM Parameter Store' },
  );
  registries.set('secrets', secretsRegistry);

  // Scheduler adapter (EventBridge)
  const schedulerRegistry = createAdapterRegistry({
    domain: 'scheduler',
    requiredMethods: [...SCHEDULER_ADAPTER_REQUIRED_METHODS],
  });
  schedulerRegistry.registerAdapter(
    'eventbridge',
    (ctx) =>
      createEventBridgeSchedulerAdapter({
        region: ctx.region ?? options.region,
        roleArn: options.schedulerRoleArn,
        groupName: ctx.storeId ? `byb-${ctx.storeId}` : undefined,
      }),
    { cloud: 'aws', service: 'EventBridge Scheduler' },
  );
  registries.set('scheduler', schedulerRegistry);

  // Infra adapter (CDK / CloudFormation)
  const infraRegistry = createAdapterRegistry({
    domain: 'infra',
    requiredMethods: [...INFRA_ADAPTER_REQUIRED_METHODS],
  });
  infraRegistry.registerAdapter(
    'aws-cdk',
    (ctx) =>
      createCdkInfraAdapter({
        region: ctx.region ?? options.region,
        templateUrl: options.templateUrl,
        stackNamePrefix: options.stackNamePrefix,
      }),
    { cloud: 'aws', service: 'CDK / CloudFormation' },
  );
  registries.set('infra', infraRegistry);

  return registries;
}
