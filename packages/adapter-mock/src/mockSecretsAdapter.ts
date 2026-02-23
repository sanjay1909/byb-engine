/**
 * mockSecretsAdapter.ts — In-memory mock implementation of SecretsAdapter.
 *
 * Uses a simple Map<string, string> to store secret name-value pairs.
 * Provides inspector methods for testing and verification.
 */

import type {
  SecretsAdapter,
  SecretGetParams,
  SecretPutParams,
  SecretDeleteParams,
} from '@byb/core';

declare function setTimeout(callback: () => void, ms: number): unknown;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface MockSecretsAdapterOptions {
  /** Artificial delay in ms for each operation (default: 0) */
  delay?: number;
}

export interface MockSecretsAdapter extends SecretsAdapter {
  /** Returns a copy of all stored secrets for inspection */
  getAllSecrets(): Map<string, string>;
  /** Resets all stored secrets */
  clear(): void;
  /** Provisioning: set up default secrets for a store */
  setupStoreSecrets(params: Record<string, unknown>): Promise<Record<string, unknown>>;
}

/**
 * Creates an in-memory mock secrets adapter.
 *
 * Secrets are stored in a plain Map<string, string>.
 * No encryption is performed — this is purely for testing and demo.
 */
export function createMockSecretsAdapter(
  options?: MockSecretsAdapterOptions,
): MockSecretsAdapter {
  const delay = options?.delay ?? 0;
  const secrets = new Map<string, string>();

  return {
    async getSecret(params: SecretGetParams): Promise<string | null> {
      if (delay) await wait(delay);
      return secrets.get(params.name) ?? null;
    },

    async putSecret(params: SecretPutParams): Promise<void> {
      if (delay) await wait(delay);
      secrets.set(params.name, params.value);
    },

    async deleteSecret(params: SecretDeleteParams): Promise<void> {
      if (delay) await wait(delay);
      secrets.delete(params.name);
    },

    getAllSecrets(): Map<string, string> {
      return new Map(secrets);
    },

    clear(): void {
      secrets.clear();
    },

    // ── Provisioning operations ──────────────────────────────────────

    async setupStoreSecrets(
      params: Record<string, unknown>,
    ): Promise<Record<string, unknown>> {
      if (delay) await wait(delay);
      const storeId = (params.storeId as string) ?? 'unknown';
      // Seed default store secrets
      const secretKeys = [
        `${storeId}/api-key`,
        `${storeId}/jwt-secret`,
        `${storeId}/stripe-key`,
      ];
      for (const key of secretKeys) {
        secrets.set(key, `mock-secret-value-${key}`);
      }
      return { success: true, secretsCreated: secretKeys.length, keys: secretKeys };
    },
  };
}
