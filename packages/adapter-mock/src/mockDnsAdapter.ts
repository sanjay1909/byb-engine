/**
 * mockDnsAdapter.ts — In-memory mock implementation of DnsAdapter.
 *
 * Simulates DNS configuration, propagation checking, and SSL provisioning.
 * Domain entries are stored in a Map keyed by domain name.
 * Provides inspector methods for testing and verification.
 */

import type {
  DnsAdapter,
  DnsConfigureParams,
  DnsConfigureResult,
  DnsCheckParams,
  DnsPropagationStatus,
  DnsSslParams,
  DnsSslResult,
  DnsStatusParams,
  DnsStatus,
} from '@byb/core';

declare function setTimeout(callback: () => void, ms: number): unknown;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface MockDnsAdapterOptions {
  /** Artificial delay in ms for each operation (default: 0) */
  delay?: number;
}

export interface MockDomainEntry {
  domain: string;
  configured: boolean;
  propagated: boolean;
  sslStatus: 'none' | 'pending' | 'issued' | 'failed';
  certificateId?: string;
  zoneId: string;
  targetDomain: string;
}

export interface MockDnsAdapter extends DnsAdapter {
  /** Returns all domain entries for inspection */
  getDomains(): Map<string, MockDomainEntry>;
  /** Resets all domain entries */
  clear(): void;
}

/**
 * Creates an in-memory mock DNS adapter.
 *
 * Domain configuration stores entries with propagation status.
 * After configureDomain, propagation is initially false; subsequent
 * calls to checkPropagation will report the entry as propagated
 * (simulating eventual DNS propagation after a delay).
 */
export function createMockDnsAdapter(
  options?: MockDnsAdapterOptions,
): MockDnsAdapter {
  const delay = options?.delay ?? 0;
  let idCounter = 0;
  const domains = new Map<string, MockDomainEntry>();

  return {
    async configureDomain(
      params: DnsConfigureParams | Record<string, unknown>,
    ): Promise<DnsConfigureResult> {
      if (delay) await wait(delay);
      idCounter++;
      const zoneId = `mock-zone-${idCounter}`;
      // Support both typed DnsConfigureParams and provisioning params
      const domain =
        (params as DnsConfigureParams).domain ??
        `${(params as Record<string, unknown>).storeId ?? 'unknown'}.mock.local`;
      const targetDomain =
        (params as DnsConfigureParams).targetDomain ??
        `mock-cdn-${(params as Record<string, unknown>).storeId ?? 'unknown'}.cdn.local`;
      const entry: MockDomainEntry = {
        domain,
        configured: true,
        propagated: false,
        sslStatus: 'none',
        zoneId,
        targetDomain,
      };
      domains.set(domain, entry);

      // Simulate delayed propagation: mark as propagated after the delay
      if (delay) {
        setTimeout(() => {
          const stored = domains.get(domain);
          if (stored) {
            stored.propagated = true;
          }
        }, delay);
      } else {
        // With no delay, mark as propagated immediately
        entry.propagated = true;
      }

      return {
        zoneId,
        recordName: domain,
        status: 'pending',
      };
    },

    async checkPropagation(
      params: DnsCheckParams,
    ): Promise<DnsPropagationStatus> {
      if (delay) await wait(delay);
      const entry = domains.get(params.domain);
      return {
        domain: params.domain,
        propagated: entry?.propagated ?? false,
        checkedAt: new Date().toISOString(),
      };
    },

    async provisionSsl(params: DnsSslParams): Promise<DnsSslResult> {
      if (delay) await wait(delay);
      idCounter++;
      const certificateId = `mock-cert-${idCounter}`;
      const entry = domains.get(params.domain);
      if (entry) {
        entry.sslStatus = 'issued';
        entry.certificateId = certificateId;
      }
      return { certificateId, status: 'issued' };
    },

    async getStatus(params: DnsStatusParams): Promise<DnsStatus> {
      if (delay) await wait(delay);
      const entry = domains.get(params.domain);
      if (!entry) {
        return {
          domain: params.domain,
          configured: false,
          propagated: false,
          sslStatus: 'none',
        };
      }
      return {
        domain: entry.domain,
        configured: entry.configured,
        propagated: entry.propagated,
        sslStatus: entry.sslStatus,
        certificateId: entry.certificateId,
      };
    },

    getDomains(): Map<string, MockDomainEntry> {
      return domains;
    },

    clear(): void {
      domains.clear();
      idCounter = 0;
    },
  };
}
