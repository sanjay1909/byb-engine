/**
 * Tests for DnsAdapter contract validation.
 *
 * Covers:
 * - Passing contract validation with all required methods
 * - Failing when methods are missing
 * - Passing with extra methods beyond required
 * - Required methods constant has correct length
 * - Full mock adapter returns expected shapes
 */
import { describe, it, expect } from 'vitest';
import {
  assertAdapterContract,
  AdapterContractError,
} from './adapterContracts.js';
import { DNS_ADAPTER_REQUIRED_METHODS } from './interfaces/index.js';

describe('DnsAdapter contract', () => {
  it('passes contract validation with all 4 required methods', () => {
    const adapter = {
      configureDomain: () => {},
      checkPropagation: () => {},
      provisionSsl: () => {},
      getStatus: () => {},
    };

    expect(() =>
      assertAdapterContract(
        adapter,
        [...DNS_ADAPTER_REQUIRED_METHODS],
        'route53',
        'dns',
      ),
    ).not.toThrow();
  });

  it('fails when missing methods', () => {
    const adapter = {
      configureDomain: () => {},
    };

    expect(() =>
      assertAdapterContract(
        adapter,
        [...DNS_ADAPTER_REQUIRED_METHODS],
        'route53',
        'dns',
      ),
    ).toThrow(AdapterContractError);

    try {
      assertAdapterContract(
        adapter,
        [...DNS_ADAPTER_REQUIRED_METHODS],
        'route53',
        'dns',
      );
      expect.fail('should have thrown');
    } catch (err) {
      const error = err as AdapterContractError;
      expect(error.missingMethods).toEqual([
        'checkPropagation',
        'provisionSsl',
        'getStatus',
      ]);
      expect(error.adapterId).toBe('route53');
      expect(error.domain).toBe('dns');
    }
  });

  it('works with extra methods beyond required', () => {
    const adapter = {
      configureDomain: () => {},
      checkPropagation: () => {},
      provisionSsl: () => {},
      getStatus: () => {},
      deleteDomain: () => {},
      listZones: () => {},
    };

    expect(() =>
      assertAdapterContract(
        adapter,
        [...DNS_ADAPTER_REQUIRED_METHODS],
        'route53',
        'dns',
      ),
    ).not.toThrow();
  });

  it('DNS_ADAPTER_REQUIRED_METHODS has exactly 4 entries', () => {
    expect(DNS_ADAPTER_REQUIRED_METHODS).toHaveLength(4);
    expect([...DNS_ADAPTER_REQUIRED_METHODS]).toEqual([
      'configureDomain',
      'checkPropagation',
      'provisionSsl',
      'getStatus',
    ]);
  });

  it('full mock DnsAdapter returns expected shapes', async () => {
    const mockAdapter = {
      configureDomain: async () => ({
        zoneId: 'Z1234567890',
        recordName: 'shop.example.com',
        status: 'pending' as const,
      }),
      checkPropagation: async () => ({
        domain: 'shop.example.com',
        propagated: true,
        checkedAt: '2026-02-23T10:00:00Z',
      }),
      provisionSsl: async () => ({
        certificateId: 'arn:aws:acm:us-east-1:123456:certificate/abc-123',
        status: 'issued' as const,
      }),
      getStatus: async () => ({
        domain: 'shop.example.com',
        configured: true,
        propagated: true,
        sslStatus: 'issued' as const,
      }),
    };

    const configResult = await mockAdapter.configureDomain();
    expect(configResult).toEqual({
      zoneId: 'Z1234567890',
      recordName: 'shop.example.com',
      status: 'pending',
    });

    const propagationResult = await mockAdapter.checkPropagation();
    expect(propagationResult).toEqual({
      domain: 'shop.example.com',
      propagated: true,
      checkedAt: '2026-02-23T10:00:00Z',
    });

    const sslResult = await mockAdapter.provisionSsl();
    expect(sslResult).toEqual({
      certificateId: 'arn:aws:acm:us-east-1:123456:certificate/abc-123',
      status: 'issued',
    });

    const statusResult = await mockAdapter.getStatus();
    expect(statusResult).toEqual({
      domain: 'shop.example.com',
      configured: true,
      propagated: true,
      sslStatus: 'issued',
    });
  });
});
