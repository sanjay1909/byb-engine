/**
 * adapterContracts.ts — Contract validation for adapter instances.
 *
 * An adapter contract is a list of method names that an adapter MUST implement.
 * Before an adapter is returned to a caller, we validate it against its contract
 * to catch missing methods early (at registration/resolution time, not at call time).
 *
 * This is ported from the SIS platform's `assertSchedulingAdapterContract` and
 * `assertDomainAdapterContract` patterns, generalized for any adapter type.
 *
 * Usage:
 *   assertAdapterContract(adapter, ['get', 'put', 'delete'], 'db');
 *   // throws if adapter is missing any of those methods
 */

/**
 * Error thrown when an adapter does not satisfy its required contract.
 * Contains the adapter ID, domain, and list of missing methods for debugging.
 */
export class AdapterContractError extends Error {
  constructor(
    public readonly adapterId: string,
    public readonly domain: string,
    public readonly missingMethods: string[],
  ) {
    super(
      `Adapter "${adapterId}" for domain "${domain}" is missing required methods: ${missingMethods.join(', ')}`,
    );
    this.name = 'AdapterContractError';
  }
}

/**
 * Asserts that an adapter object implements all required methods.
 *
 * @param adapter - The adapter instance to validate
 * @param requiredMethods - List of method names the adapter must have
 * @param adapterId - Identifier for error messages (e.g., 'dynamodb')
 * @param domain - Domain name for error messages (e.g., 'db')
 * @throws AdapterContractError if any required method is missing or not a function
 */
export function assertAdapterContract(
  adapter: Record<string, unknown>,
  requiredMethods: string[],
  adapterId: string,
  domain: string,
): void {
  const missing = requiredMethods.filter(
    (method) => typeof adapter[method] !== 'function',
  );

  if (missing.length > 0) {
    throw new AdapterContractError(adapterId, domain, missing);
  }
}
