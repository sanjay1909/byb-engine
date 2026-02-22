/**
 * secretsAdapter.ts — Interface for secure credential storage.
 *
 * Manages sensitive configuration like API keys, passwords, and tokens.
 * Each store has its own secrets namespace to prevent cross-tenant access.
 *
 * Cloud adapters implement it for their specific secrets manager:
 * - AWS: SSM Parameter Store (SecureString)
 * - Azure: Azure Key Vault
 * - GCP: Secret Manager
 */

/** Parameters for getting a secret */
export interface SecretGetParams {
  /** Secret name/path (e.g., '/byb/stores/charming-cherubs/stripe-key') */
  name: string;
  /** Whether to decrypt the value (default: true) */
  withDecryption?: boolean;
}

/** Parameters for putting/updating a secret */
export interface SecretPutParams {
  /** Secret name/path */
  name: string;
  /** Secret value */
  value: string;
  /** Optional description */
  description?: string;
  /** Whether to encrypt the value (default: true) */
  encrypted?: boolean;
}

/** Parameters for deleting a secret */
export interface SecretDeleteParams {
  name: string;
}

/**
 * Secrets adapter interface.
 *
 * Required methods contract: ['getSecret', 'putSecret', 'deleteSecret']
 */
export interface SecretsAdapter {
  /** Get a secret value by name. Returns null if not found. */
  getSecret(params: SecretGetParams): Promise<string | null>;

  /** Store or update a secret. */
  putSecret(params: SecretPutParams): Promise<void>;

  /** Delete a secret. */
  deleteSecret(params: SecretDeleteParams): Promise<void>;
}

export const SECRETS_ADAPTER_REQUIRED_METHODS = [
  'getSecret',
  'putSecret',
  'deleteSecret',
] as const;
