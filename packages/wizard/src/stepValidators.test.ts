/**
 * Tests for stepValidators.ts
 *
 * Covers all 7 step validators:
 * - Business: required fields (storeId, storeName, siteUrl, email, currency),
 *   storeId slug format, email format, URL format, optional socials
 * - Branding: required colors, hex format validation, optional backgroundColor
 * - Layout: requires at least one page, home must be enabled
 * - Features: always valid if object exists
 * - Shipping: type required, non-negative rates
 * - Cloud: provider required (aws/azure/gcp), region required, domain format
 * - Review: always valid
 */
import { describe, it, expect } from 'vitest';
import {
  validateBusinessStep,
  validateBrandingStep,
  validateLayoutStep,
  validateFeaturesStep,
  validateShippingStep,
  validateCloudStep,
  validateReviewStep,
} from './stepValidators.js';

describe('validateBusinessStep', () => {
  const valid = {
    storeId: 'my-shop',
    storeName: 'My Shop',
    siteUrl: 'https://myshop.com',
    supportEmail: 'help@myshop.com',
    currency: 'usd',
  };

  it('accepts valid business info', () => {
    expect(validateBusinessStep(valid).valid).toBe(true);
  });

  it('rejects undefined data', () => {
    const result = validateBusinessStep(undefined);
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('business');
  });

  it('requires storeId', () => {
    const result = validateBusinessStep({ ...valid, storeId: '' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('storeId');
  });

  it('rejects invalid storeId format (uppercase)', () => {
    const result = validateBusinessStep({ ...valid, storeId: 'My-Shop' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('storeId');
  });

  it('rejects storeId that is too short', () => {
    const result = validateBusinessStep({ ...valid, storeId: 'ab' });
    expect(result.valid).toBe(false);
  });

  it('accepts storeId with hyphens', () => {
    expect(
      validateBusinessStep({ ...valid, storeId: 'charming-cherubs' }).valid,
    ).toBe(true);
  });

  it('requires storeName', () => {
    const result = validateBusinessStep({ ...valid, storeName: '' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('storeName');
  });

  it('requires siteUrl', () => {
    const result = validateBusinessStep({ ...valid, siteUrl: '' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('siteUrl');
  });

  it('rejects siteUrl without protocol', () => {
    const result = validateBusinessStep({
      ...valid,
      siteUrl: 'myshop.com',
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('siteUrl');
  });

  it('requires supportEmail', () => {
    const result = validateBusinessStep({ ...valid, supportEmail: '' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('supportEmail');
  });

  it('rejects invalid email', () => {
    const result = validateBusinessStep({
      ...valid,
      supportEmail: 'not-an-email',
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('supportEmail');
  });

  it('requires currency', () => {
    const result = validateBusinessStep({ ...valid, currency: '' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('currency');
  });

  it('validates social URLs if provided', () => {
    const result = validateBusinessStep({
      ...valid,
      socials: { instagram: 'not-a-url' },
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('socials.instagram');
  });

  it('accepts valid social URLs', () => {
    const result = validateBusinessStep({
      ...valid,
      socials: { instagram: 'https://instagram.com/shop' },
    });
    expect(result.valid).toBe(true);
  });

  it('reports multiple errors at once', () => {
    const result = validateBusinessStep({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(5);
  });
});

describe('validateBrandingStep', () => {
  const valid = { primaryColor: '#ff0000', secondaryColor: '#00ff00' };

  it('accepts valid branding', () => {
    expect(validateBrandingStep(valid).valid).toBe(true);
  });

  it('rejects undefined data', () => {
    expect(validateBrandingStep(undefined).valid).toBe(false);
  });

  it('requires primaryColor', () => {
    const result = validateBrandingStep({ ...valid, primaryColor: '' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('primaryColor');
  });

  it('rejects invalid hex color', () => {
    const result = validateBrandingStep({
      ...valid,
      primaryColor: 'red',
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('primaryColor');
  });

  it('accepts 3-digit hex colors', () => {
    expect(
      validateBrandingStep({
        primaryColor: '#f00',
        secondaryColor: '#0f0',
      }).valid,
    ).toBe(true);
  });

  it('validates optional backgroundColor', () => {
    const result = validateBrandingStep({
      ...valid,
      backgroundColor: 'invalid',
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('backgroundColor');
  });

  it('accepts valid backgroundColor', () => {
    expect(
      validateBrandingStep({ ...valid, backgroundColor: '#ffffff' }).valid,
    ).toBe(true);
  });
});

describe('validateLayoutStep', () => {
  it('accepts valid layout with home page', () => {
    expect(
      validateLayoutStep({
        pages: [{ pageId: 'home', label: 'Home', enabled: true }],
      }).valid,
    ).toBe(true);
  });

  it('rejects undefined data', () => {
    expect(validateLayoutStep(undefined).valid).toBe(false);
  });

  it('rejects empty pages array', () => {
    const result = validateLayoutStep({ pages: [] });
    expect(result.valid).toBe(false);
  });

  it('requires home page to be enabled', () => {
    const result = validateLayoutStep({
      pages: [
        { pageId: 'home', label: 'Home', enabled: false },
        { pageId: 'story', label: 'Story', enabled: true },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('Home');
  });

  it('accepts multiple pages', () => {
    expect(
      validateLayoutStep({
        pages: [
          { pageId: 'home', label: 'Home', enabled: true },
          { pageId: 'story', label: 'Our Story', enabled: true },
          { pageId: 'contact', label: 'Contact', enabled: true },
        ],
      }).valid,
    ).toBe(true);
  });
});

describe('validateFeaturesStep', () => {
  it('accepts any feature configuration', () => {
    expect(
      validateFeaturesStep({
        blog: true,
        campaigns: false,
        payments: 'stripe',
        analytics: true,
        oe: false,
      }).valid,
    ).toBe(true);
  });

  it('accepts empty features object', () => {
    expect(validateFeaturesStep({}).valid).toBe(true);
  });

  it('rejects undefined data', () => {
    expect(validateFeaturesStep(undefined).valid).toBe(false);
  });
});

describe('validateShippingStep', () => {
  it('accepts valid flat rate shipping', () => {
    expect(
      validateShippingStep({ type: 'flat', flatRate: 10 }).valid,
    ).toBe(true);
  });

  it('accepts valid free-over shipping', () => {
    expect(
      validateShippingStep({
        type: 'free_over',
        flatRate: 10,
        freeOver: 200,
      }).valid,
    ).toBe(true);
  });

  it('rejects undefined data', () => {
    expect(validateShippingStep(undefined).valid).toBe(false);
  });

  it('requires shipping type', () => {
    const result = validateShippingStep({});
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('type');
  });

  it('rejects negative flat rate', () => {
    const result = validateShippingStep({
      type: 'flat',
      flatRate: -5,
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('flatRate');
  });

  it('rejects negative free-over threshold', () => {
    const result = validateShippingStep({
      type: 'free_over',
      freeOver: -1,
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('freeOver');
  });

  it('accepts zero flat rate (free shipping)', () => {
    expect(
      validateShippingStep({ type: 'flat', flatRate: 0 }).valid,
    ).toBe(true);
  });
});

describe('validateCloudStep', () => {
  it('accepts valid AWS cloud target', () => {
    expect(
      validateCloudStep({ provider: 'aws', region: 'us-east-1' }).valid,
    ).toBe(true);
  });

  it('accepts Azure', () => {
    expect(
      validateCloudStep({ provider: 'azure', region: 'eastus' }).valid,
    ).toBe(true);
  });

  it('accepts GCP', () => {
    expect(
      validateCloudStep({ provider: 'gcp', region: 'us-central1' }).valid,
    ).toBe(true);
  });

  it('rejects undefined data', () => {
    expect(validateCloudStep(undefined).valid).toBe(false);
  });

  it('requires provider', () => {
    const result = validateCloudStep({ region: 'us-east-1' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('provider');
  });

  it('rejects unknown provider', () => {
    const result = validateCloudStep({
      provider: 'digitalocean',
      region: 'nyc1',
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('provider');
  });

  it('requires region', () => {
    const result = validateCloudStep({ provider: 'aws' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('region');
  });

  it('rejects custom domain with protocol', () => {
    const result = validateCloudStep({
      provider: 'aws',
      region: 'us-east-1',
      customDomain: 'https://shop.example.com',
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('customDomain');
  });

  it('accepts custom domain without protocol', () => {
    expect(
      validateCloudStep({
        provider: 'aws',
        region: 'us-east-1',
        customDomain: 'shop.example.com',
      }).valid,
    ).toBe(true);
  });
});

describe('validateReviewStep', () => {
  it('always returns valid', () => {
    expect(validateReviewStep().valid).toBe(true);
  });
});
