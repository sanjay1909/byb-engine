/**
 * adapterRegistry.ts — Generic adapter registry with factory-based resolution.
 *
 * This is the foundational pattern for all adapter management in BYB.
 * Cloud packages (adapter-aws, adapter-azure, etc.) register their adapters here,
 * and the provisioning system resolves them at runtime based on store profiles.
 *
 * Ported from the SIS platform's `schedulingAdapterRegistry` and `domainAdapterRegistry`.
 *
 * Key concepts:
 * - Adapters are registered as factory functions, not instances. This allows
 *   per-request context to be passed during resolution (e.g., credentials, region).
 * - Each resolved adapter is validated against a required methods contract before
 *   being returned to the caller. This catches misconfigured adapters early.
 * - The registry supports introspection (listAdapters) for debugging and admin UIs.
 *
 * Usage:
 *   const dbRegistry = createAdapterRegistry<DbAdapter>({
 *     domain: 'db',
 *     requiredMethods: ['get', 'put', 'query', 'delete'],
 *   });
 *   dbRegistry.registerAdapter('dynamodb', (ctx) => new DynamoDbAdapter(ctx));
 *   const adapter = dbRegistry.resolveAdapter('dynamodb', { region: 'us-east-1' });
 */

import { assertAdapterContract } from './adapterContracts.js';

/**
 * Context passed to adapter factories during resolution.
 * Extend this in your adapter implementations for cloud-specific context.
 */
export interface AdapterContext {
  /** Cloud region (e.g., 'us-east-1', 'westus2') */
  region?: string;
  /** Store ID this adapter is being resolved for */
  storeId?: string;
  /** Additional context — adapters can read whatever they need */
  [key: string]: unknown;
}

/**
 * Factory function that creates an adapter instance from a context.
 * Registered once, called each time the adapter is resolved.
 */
export type AdapterFactory<TAdapter> = (context: AdapterContext) => TAdapter;

/**
 * Metadata stored alongside each registered adapter.
 * Useful for admin UIs and introspection.
 */
export interface AdapterRegistration<TAdapter> {
  adapterId: string;
  factory: AdapterFactory<TAdapter>;
  metadata?: Record<string, unknown>;
}

/**
 * Options for creating an adapter registry.
 */
export interface AdapterRegistryOptions {
  /** Domain name for this registry (e.g., 'db', 'storage', 'cdn'). Used in error messages. */
  domain: string;
  /** List of method names that every adapter in this registry must implement. */
  requiredMethods: string[];
}

/**
 * The adapter registry interface — register, resolve, list, and check adapters.
 */
export interface AdapterRegistry<TAdapter> {
  /** Register a new adapter factory under an ID. Overwrites if ID already exists. */
  registerAdapter(
    adapterId: string,
    factory: AdapterFactory<TAdapter>,
    metadata?: Record<string, unknown>,
  ): void;

  /** Resolve an adapter by ID, calling its factory and validating the contract. */
  resolveAdapter(adapterId: string, context: AdapterContext): TAdapter;

  /** Check if an adapter ID is registered without resolving it. */
  hasAdapter(adapterId: string): boolean;

  /** List all registered adapter IDs with their metadata. */
  listAdapters(): Array<{ adapterId: string; metadata?: Record<string, unknown> }>;

  /** The domain this registry manages (e.g., 'db', 'storage'). */
  readonly domain: string;
}

/**
 * Creates a new adapter registry for a specific domain.
 *
 * @param options - Registry configuration (domain name and required methods contract)
 * @returns A fully functional AdapterRegistry instance
 *
 * @example
 * const dbRegistry = createAdapterRegistry<DbAdapter>({
 *   domain: 'db',
 *   requiredMethods: ['get', 'put', 'query', 'delete'],
 * });
 */
export function createAdapterRegistry<TAdapter>(
  options: AdapterRegistryOptions,
): AdapterRegistry<TAdapter> {
  const { domain, requiredMethods } = options;
  const registrations = new Map<string, AdapterRegistration<TAdapter>>();

  return {
    domain,

    registerAdapter(
      adapterId: string,
      factory: AdapterFactory<TAdapter>,
      metadata?: Record<string, unknown>,
    ): void {
      registrations.set(adapterId, { adapterId, factory, metadata });
    },

    resolveAdapter(adapterId: string, context: AdapterContext): TAdapter {
      const registration = registrations.get(adapterId);
      if (!registration) {
        throw new Error(
          `No adapter registered with ID "${adapterId}" in domain "${domain}". ` +
          `Available adapters: ${[...registrations.keys()].join(', ') || '(none)'}`,
        );
      }

      const adapter = registration.factory(context);

      // Validate the adapter satisfies the contract before returning
      assertAdapterContract(
        adapter as Record<string, unknown>,
        requiredMethods,
        adapterId,
        domain,
      );

      return adapter;
    },

    hasAdapter(adapterId: string): boolean {
      return registrations.has(adapterId);
    },

    listAdapters(): Array<{ adapterId: string; metadata?: Record<string, unknown> }> {
      return [...registrations.values()].map(({ adapterId, metadata }) => ({
        adapterId,
        metadata,
      }));
    },
  };
}
