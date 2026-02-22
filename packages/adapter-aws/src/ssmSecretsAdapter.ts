/**
 * ssmSecretsAdapter.ts — AWS SSM Parameter Store implementation of SecretsAdapter.
 *
 * Wraps the AWS SDK v3 SSM client for secure credential storage.
 * Each store's secrets are namespaced under '/byb/stores/{storeId}/' to
 * prevent cross-tenant access.
 *
 * How it connects to the system:
 * - Registered under domain 'secrets' with ID 'ssm'
 * - Resolved via store profile (profile.adapters.secrets = 'ssm')
 * - Used during provisioning and runtime for API keys, payment credentials, etc.
 */

import {
  SSMClient,
  GetParameterCommand,
  PutParameterCommand,
  DeleteParameterCommand,
} from '@aws-sdk/client-ssm';
import type {
  SecretsAdapter,
  SecretGetParams,
  SecretPutParams,
  SecretDeleteParams,
} from '@byb/core';

export interface SsmSecretsAdapterOptions {
  region?: string;
  ssmClient?: SSMClient;
}

export function createSsmSecretsAdapter(options: SsmSecretsAdapterOptions): SecretsAdapter {
  const client = options.ssmClient ?? new SSMClient({ region: options.region });

  return {
    async getSecret(params: SecretGetParams): Promise<string | null> {
      try {
        const result = await client.send(
          new GetParameterCommand({
            Name: params.name,
            WithDecryption: params.withDecryption ?? true,
          }),
        );
        return result.Parameter?.Value ?? null;
      } catch (err: unknown) {
        // ParameterNotFound → return null (not an error, just not set yet)
        if (
          err instanceof Error &&
          err.name === 'ParameterNotFound'
        ) {
          return null;
        }
        throw err;
      }
    },

    async putSecret(params: SecretPutParams): Promise<void> {
      await client.send(
        new PutParameterCommand({
          Name: params.name,
          Value: params.value,
          Description: params.description,
          Type: params.encrypted !== false ? 'SecureString' : 'String',
          Overwrite: true,
        }),
      );
    },

    async deleteSecret(params: SecretDeleteParams): Promise<void> {
      await client.send(
        new DeleteParameterCommand({ Name: params.name }),
      );
    },
  };
}
