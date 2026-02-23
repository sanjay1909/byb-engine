/**
 * dnsAdapter.ts — Interface for DNS and SSL certificate management.
 *
 * Handles domain configuration, DNS propagation checks, and SSL certificate
 * provisioning for store custom domains. Called by the provisioning flow
 * after CDN distribution is set up.
 *
 * Cloud adapters implement it for their specific DNS service:
 * - AWS: Route 53 + ACM
 * - Azure: Azure DNS + managed certificates
 * - GCP: Cloud DNS + managed certificates
 */

/** Parameters for configuring a custom domain */
export interface DnsConfigureParams {
  /** Store this domain is for */
  storeId: string;
  /** The custom domain to configure (e.g., 'shop.example.com') */
  domain: string;
  /** CDN distribution domain to point the CNAME at (e.g., 'd1234.cloudfront.net') */
  targetDomain: string;
}

/** Result of domain configuration */
export interface DnsConfigureResult {
  /** Zone ID or hosted zone reference */
  zoneId: string;
  /** The DNS record that was created */
  recordName: string;
  /** Current propagation status */
  status: 'pending' | 'propagated' | 'failed';
}

/** Parameters for checking DNS propagation */
export interface DnsCheckParams {
  /** The domain to check */
  domain: string;
  /** Optional zone ID for faster lookups */
  zoneId?: string;
}

/** DNS propagation status */
export interface DnsPropagationStatus {
  /** The domain that was checked */
  domain: string;
  /** Whether DNS records have propagated globally */
  propagated: boolean;
  /** Resolved IP or CNAME value, if propagated */
  resolvedValue?: string;
  /** When the check was performed (ISO 8601) */
  checkedAt: string;
}

/** Parameters for SSL certificate provisioning */
export interface DnsSslParams {
  /** The domain to provision SSL for */
  domain: string;
  /** Validation method — DNS validation is preferred for automation */
  validationMethod?: 'dns' | 'email';
}

/** Result of SSL certificate provisioning */
export interface DnsSslResult {
  /** Certificate ID (e.g., ACM ARN, Key Vault ID) */
  certificateId: string;
  /** Current certificate status */
  status: 'pending_validation' | 'issued' | 'failed';
  /** DNS validation records the user needs to create (if validation method is 'dns') */
  validationRecords?: Array<{ name: string; value: string; type: string }>;
}

/** Parameters for checking overall DNS status */
export interface DnsStatusParams {
  /** The domain to check */
  domain: string;
  /** Optional zone ID */
  zoneId?: string;
}

/** Complete DNS status for a domain */
export interface DnsStatus {
  /** The domain */
  domain: string;
  /** Whether DNS records are configured */
  configured: boolean;
  /** Whether DNS has propagated */
  propagated: boolean;
  /** SSL certificate status */
  sslStatus: 'none' | 'pending' | 'issued' | 'failed';
  /** SSL certificate ID (if provisioned) */
  certificateId?: string;
}

/**
 * DNS adapter interface.
 *
 * Required methods contract: ['configureDomain', 'checkPropagation', 'provisionSsl', 'getStatus']
 */
export interface DnsAdapter {
  /** Configure DNS records for a custom domain pointing to the CDN. */
  configureDomain(params: DnsConfigureParams): Promise<DnsConfigureResult>;

  /** Check whether DNS records have propagated globally. */
  checkPropagation(params: DnsCheckParams): Promise<DnsPropagationStatus>;

  /** Provision an SSL certificate for the custom domain. */
  provisionSsl(params: DnsSslParams): Promise<DnsSslResult>;

  /** Get the complete DNS and SSL status for a domain. */
  getStatus(params: DnsStatusParams): Promise<DnsStatus>;
}

export const DNS_ADAPTER_REQUIRED_METHODS = [
  'configureDomain',
  'checkPropagation',
  'provisionSsl',
  'getStatus',
] as const;
