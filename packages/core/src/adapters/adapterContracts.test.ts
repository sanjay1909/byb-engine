/**
 * Tests for adapterContracts.ts — validates the contract assertion utility.
 *
 * Covers:
 * - Passing validation when all methods present
 * - Failing validation with missing methods
 * - Failing when methods exist as properties but aren't functions
 * - Error contains correct adapterId, domain, and missing methods list
 */
import { describe, it, expect } from 'vitest';
import {
  assertAdapterContract,
  AdapterContractError,
} from './adapterContracts.js';

describe('assertAdapterContract', () => {
  const requiredMethods = ['get', 'put', 'delete'];

  it('passes when all required methods are present', () => {
    const adapter = {
      get: () => {},
      put: () => {},
      delete: () => {},
    };

    expect(() =>
      assertAdapterContract(adapter, requiredMethods, 'test-adapter', 'db'),
    ).not.toThrow();
  });

  it('passes when adapter has extra methods beyond required', () => {
    const adapter = {
      get: () => {},
      put: () => {},
      delete: () => {},
      list: () => {},
      count: () => {},
    };

    expect(() =>
      assertAdapterContract(adapter, requiredMethods, 'test-adapter', 'db'),
    ).not.toThrow();
  });

  it('throws AdapterContractError when methods are missing', () => {
    const adapter = {
      get: () => {},
    };

    expect(() =>
      assertAdapterContract(adapter, requiredMethods, 'test-adapter', 'db'),
    ).toThrow(AdapterContractError);
  });

  it('includes missing method names in error', () => {
    const adapter = {
      get: () => {},
    };

    try {
      assertAdapterContract(adapter, requiredMethods, 'test-adapter', 'db');
      expect.fail('should have thrown');
    } catch (err) {
      const error = err as AdapterContractError;
      expect(error.missingMethods).toEqual(['put', 'delete']);
      expect(error.adapterId).toBe('test-adapter');
      expect(error.domain).toBe('db');
    }
  });

  it('rejects non-function properties that share method names', () => {
    const adapter = {
      get: () => {},
      put: 'not-a-function',
      delete: 42,
    };

    expect(() =>
      assertAdapterContract(adapter, requiredMethods, 'test-adapter', 'db'),
    ).toThrow(AdapterContractError);
  });

  it('throws when adapter is empty object', () => {
    expect(() =>
      assertAdapterContract({}, requiredMethods, 'empty', 'db'),
    ).toThrow(AdapterContractError);
  });

  it('passes with empty required methods list', () => {
    expect(() =>
      assertAdapterContract({}, [], 'any', 'any'),
    ).not.toThrow();
  });
});
