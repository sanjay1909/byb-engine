/**
 * Tests for adapterRegistry.ts — validates the generic adapter registry.
 *
 * Covers:
 * - Registering and resolving adapters
 * - Contract validation on resolution
 * - Listing registered adapters with metadata
 * - Error on resolving unregistered adapter
 * - Overwriting existing adapter registration
 * - hasAdapter check
 * - Scenario: two adapters for same domain, resolve by ID
 */
import { describe, it, expect, vi } from 'vitest';
import { createAdapterRegistry } from './adapterRegistry.js';
import { AdapterContractError } from './adapterContracts.js';

// A minimal adapter interface for testing
interface TestAdapter {
  get(id: string): string;
  put(id: string, data: unknown): void;
  delete(id: string): void;
}

describe('createAdapterRegistry', () => {
  const createTestRegistry = () =>
    createAdapterRegistry<TestAdapter>({
      domain: 'test-domain',
      requiredMethods: ['get', 'put', 'delete'],
    });

  // A valid adapter factory for testing
  const validFactory = () => ({
    get: (id: string) => `item-${id}`,
    put: (_id: string, _data: unknown) => {},
    delete: (_id: string) => {},
  });

  it('creates a registry with the given domain', () => {
    const registry = createTestRegistry();
    expect(registry.domain).toBe('test-domain');
  });

  it('registers and resolves an adapter', () => {
    const registry = createTestRegistry();
    registry.registerAdapter('test-adapter', validFactory);

    const adapter = registry.resolveAdapter('test-adapter', {});
    expect(adapter.get('1')).toBe('item-1');
  });

  it('passes context to the factory during resolution', () => {
    const registry = createTestRegistry();
    const factorySpy = vi.fn().mockReturnValue({
      get: () => '',
      put: () => {},
      delete: () => {},
    });

    registry.registerAdapter('ctx-adapter', factorySpy);
    registry.resolveAdapter('ctx-adapter', {
      region: 'us-east-1',
      storeId: 'my-store',
    });

    expect(factorySpy).toHaveBeenCalledWith({
      region: 'us-east-1',
      storeId: 'my-store',
    });
  });

  it('validates adapter contract on resolution', () => {
    const registry = createTestRegistry();
    // Missing 'delete' method
    registry.registerAdapter('bad-adapter', () => ({
      get: () => '',
      put: () => {},
    }) as unknown as TestAdapter);

    expect(() => registry.resolveAdapter('bad-adapter', {})).toThrow(
      AdapterContractError,
    );
  });

  it('throws descriptive error for unregistered adapter', () => {
    const registry = createTestRegistry();
    registry.registerAdapter('exists', validFactory);

    expect(() => registry.resolveAdapter('nope', {})).toThrow(
      /No adapter registered with ID "nope"/,
    );
    expect(() => registry.resolveAdapter('nope', {})).toThrow(/exists/);
  });

  it('lists all registered adapters with metadata', () => {
    const registry = createTestRegistry();
    registry.registerAdapter('adapter-a', validFactory, {
      cloud: 'aws',
    });
    registry.registerAdapter('adapter-b', validFactory, {
      cloud: 'azure',
    });

    const list = registry.listAdapters();
    expect(list).toHaveLength(2);
    expect(list).toEqual(
      expect.arrayContaining([
        { adapterId: 'adapter-a', metadata: { cloud: 'aws' } },
        { adapterId: 'adapter-b', metadata: { cloud: 'azure' } },
      ]),
    );
  });

  it('hasAdapter returns true for registered, false for unregistered', () => {
    const registry = createTestRegistry();
    registry.registerAdapter('exists', validFactory);

    expect(registry.hasAdapter('exists')).toBe(true);
    expect(registry.hasAdapter('nope')).toBe(false);
  });

  it('overwrites existing registration with same ID', () => {
    const registry = createTestRegistry();
    registry.registerAdapter('dup', () => ({
      get: () => 'v1',
      put: () => {},
      delete: () => {},
    }));

    registry.registerAdapter('dup', () => ({
      get: () => 'v2',
      put: () => {},
      delete: () => {},
    }));

    const adapter = registry.resolveAdapter('dup', {});
    expect(adapter.get('x')).toBe('v2');
  });

  it('lists empty when no adapters registered', () => {
    const registry = createTestRegistry();
    expect(registry.listAdapters()).toEqual([]);
  });

  // Scenario test: two adapters for same domain
  it('scenario: register AWS and Azure DB adapters, resolve each independently', () => {
    const registry = createTestRegistry();

    registry.registerAdapter(
      'dynamodb',
      () => ({
        get: () => 'dynamo-result',
        put: () => {},
        delete: () => {},
      }),
      { cloud: 'aws', service: 'DynamoDB' },
    );

    registry.registerAdapter(
      'cosmosdb',
      () => ({
        get: () => 'cosmos-result',
        put: () => {},
        delete: () => {},
      }),
      { cloud: 'azure', service: 'CosmosDB' },
    );

    const aws = registry.resolveAdapter('dynamodb', { region: 'us-east-1' });
    const azure = registry.resolveAdapter('cosmosdb', { region: 'westus2' });

    expect(aws.get('1')).toBe('dynamo-result');
    expect(azure.get('1')).toBe('cosmos-result');
    expect(registry.listAdapters()).toHaveLength(2);
  });
});
