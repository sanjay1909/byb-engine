/**
 * infraAdapter.ts — Interface for infrastructure provisioning (IaC).
 *
 * This is the highest-level adapter — it provisions an entire store's
 * cloud infrastructure stack. Called by the provisioning flow after the
 * wizard completes.
 *
 * Cloud adapters implement it for their specific IaC tool:
 * - AWS: CDK (CloudFormation)
 * - Azure: ARM Templates / Bicep
 * - GCP: Terraform / Deployment Manager
 */

/** Input for provisioning a full store stack */
export interface InfraProvisionParams {
  /** Unique store identifier */
  storeId: string;
  /** Cloud region to deploy in (e.g., 'us-east-1', 'westus2') */
  region: string;
  /** Store display name (used in resource naming) */
  storeName: string;
  /** Features to provision (determines which resources are created) */
  features: {
    database: boolean;
    storage: boolean;
    cdn: boolean;
    email: boolean;
    scheduler: boolean;
  };
  /** Optional custom domain for the storefront */
  customDomain?: string;
}

/** Result of a provisioning operation */
export interface InfraProvisionResult {
  /** Unique stack/deployment ID */
  stackId: string;
  /** Provisioning status */
  status: 'in_progress' | 'completed' | 'failed';
  /** Resource outputs (endpoints, ARNs, connection strings, etc.) */
  outputs: Record<string, string>;
  /** Error message if status is 'failed' */
  errorMessage?: string;
}

/** Parameters for checking provisioning status */
export interface InfraStatusParams {
  storeId: string;
  stackId: string;
}

/** Parameters for tearing down a store's infrastructure */
export interface InfraDestroyParams {
  storeId: string;
  stackId: string;
}

/**
 * Infrastructure adapter interface.
 *
 * Required methods contract: ['provision', 'getStatus', 'destroy']
 */
export interface InfraAdapter {
  /** Provision a full store infrastructure stack. May be async/long-running. */
  provision(params: InfraProvisionParams): Promise<InfraProvisionResult>;

  /** Check the current status of a provisioning operation. */
  getStatus(params: InfraStatusParams): Promise<InfraProvisionResult>;

  /** Tear down a store's infrastructure (delete all resources). */
  destroy(params: InfraDestroyParams): Promise<void>;
}

export const INFRA_ADAPTER_REQUIRED_METHODS = [
  'provision',
  'getStatus',
  'destroy',
] as const;
