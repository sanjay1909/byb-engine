/**
 * Barrel export for all adapter interfaces.
 *
 * Import from here to get any adapter interface type or its required methods list:
 *   import { DbAdapter, DB_ADAPTER_REQUIRED_METHODS } from '@byb/core';
 */
export type {
  DbAdapter,
  DbGetParams,
  DbPutParams,
  DbDeleteParams,
  DbQueryParams,
  DbQueryResult,
  DbTransactionItem,
} from './dbAdapter.js';
export { DB_ADAPTER_REQUIRED_METHODS } from './dbAdapter.js';

export type {
  StorageAdapter,
  StoragePresignUploadParams,
  StoragePresignUploadResult,
  StoragePresignDownloadParams,
  StorageDeleteParams,
  StorageListParams,
  StorageListItem,
} from './storageAdapter.js';
export { STORAGE_ADAPTER_REQUIRED_METHODS } from './storageAdapter.js';

export type {
  CdnAdapter,
  CdnCreateParams,
  CdnCreateResult,
  CdnInvalidateParams,
} from './cdnAdapter.js';
export { CDN_ADAPTER_REQUIRED_METHODS } from './cdnAdapter.js';

export type {
  EmailAdapter,
  EmailRecipient,
  EmailSendParams,
  EmailSendTemplatedParams,
  EmailSendResult,
} from './emailAdapter.js';
export { EMAIL_ADAPTER_REQUIRED_METHODS } from './emailAdapter.js';

export type {
  SecretsAdapter,
  SecretGetParams,
  SecretPutParams,
  SecretDeleteParams,
} from './secretsAdapter.js';
export { SECRETS_ADAPTER_REQUIRED_METHODS } from './secretsAdapter.js';

export type {
  SchedulerAdapter,
  SchedulerCreateOneTimeParams,
  SchedulerCreateRecurringParams,
  SchedulerDeleteParams,
} from './schedulerAdapter.js';
export { SCHEDULER_ADAPTER_REQUIRED_METHODS } from './schedulerAdapter.js';

export type {
  InfraAdapter,
  InfraProvisionParams,
  InfraProvisionResult,
  InfraStatusParams,
  InfraDestroyParams,
} from './infraAdapter.js';
export { INFRA_ADAPTER_REQUIRED_METHODS } from './infraAdapter.js';

export type {
  DnsAdapter,
  DnsConfigureParams,
  DnsConfigureResult,
  DnsCheckParams,
  DnsPropagationStatus,
  DnsSslParams,
  DnsSslResult,
  DnsStatusParams,
  DnsStatus,
} from './dnsAdapter.js';
export { DNS_ADAPTER_REQUIRED_METHODS } from './dnsAdapter.js';

export type {
  PipelineAdapter,
  PipelineCreateParams,
  PipelineCreateResult,
  PipelineTriggerParams,
  PipelineBuildResult,
  PipelineBuildStatusParams,
  PipelineBuildStatus,
  PipelineDeploymentParams,
} from './pipelineAdapter.js';
export { PIPELINE_ADAPTER_REQUIRED_METHODS } from './pipelineAdapter.js';
