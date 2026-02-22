/**
 * Barrel export for the adapters module.
 *
 * Exports the registry factory, contract validation, and all adapter interfaces.
 */
export {
  createAdapterRegistry,
  type AdapterRegistry,
  type AdapterContext,
  type AdapterFactory,
  type AdapterRegistration,
  type AdapterRegistryOptions,
} from './adapterRegistry.js';

export {
  assertAdapterContract,
  AdapterContractError,
} from './adapterContracts.js';

export * from './interfaces/index.js';
