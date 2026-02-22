/**
 * Tests for storeConfigGenerator.ts
 *
 * Covers:
 * - Generates correct storeId, storeName, siteUrl from business info
 * - Maps shipping rules (flat rate, free over threshold)
 * - Defaults sesFromEmail and internalOrdersEmail to supportEmail
 * - Includes optional fields only when provided (socials, phone, legal name)
 * - Starts with empty heroImages (populated later by hero editor)
 * - Does not include apiBaseUrl (set during provisioning)
 */
import { describe, it, expect } from 'vitest';
import { generateStoreConfig } from './storeConfigGenerator.js';
import type { WizardAnswers } from './types.js';

/** Minimal valid wizard answers for testing. */
function createMinimalAnswers(
  overrides?: Partial<WizardAnswers>,
): WizardAnswers {
  return {
    business: {
      storeId: 'test-store',
      storeName: 'Test Store',
      siteUrl: 'https://teststore.com',
      supportEmail: 'help@teststore.com',
      currency: 'usd',
      ...overrides?.business,
    },
    shipping: {
      type: 'flat',
      flatRate: 10,
      ...overrides?.shipping,
    },
    branding: {
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
      ...overrides?.branding,
    },
    layout: {
      pages: [{ pageId: 'home', label: 'Home', enabled: true }],
      ...overrides?.layout,
    },
    features: {
      blog: true,
      campaigns: false,
      payments: 'stripe',
      analytics: true,
      oe: false,
      ...overrides?.features,
    },
    cloud: {
      provider: 'aws',
      region: 'us-east-1',
      ...overrides?.cloud,
    },
  };
}

describe('generateStoreConfig', () => {
  it('generates core identity fields from business info', () => {
    const answers = createMinimalAnswers();
    const config = generateStoreConfig(answers);

    expect(config.storeId).toBe('test-store');
    expect(config.storeName).toBe('Test Store');
    expect(config.siteUrl).toBe('https://teststore.com');
    expect(config.supportEmail).toBe('help@teststore.com');
    expect(config.currency).toBe('usd');
  });

  it('maps flat rate shipping rules', () => {
    const answers = createMinimalAnswers({
      shipping: { type: 'flat', flatRate: 15 },
    });
    const config = generateStoreConfig(answers);

    expect(config.shippingRules).toEqual({
      type: 'flat',
      flatRate: 15,
    });
  });

  it('maps free-over shipping rules with both values', () => {
    const answers = createMinimalAnswers({
      shipping: { type: 'free_over', flatRate: 10, freeOver: 200 },
    });
    const config = generateStoreConfig(answers);

    expect(config.shippingRules).toEqual({
      type: 'free_over',
      flatRate: 10,
      freeOver: 200,
    });
  });

  it('defaults email addresses to supportEmail', () => {
    const answers = createMinimalAnswers({
      business: {
        storeId: 'x',
        storeName: 'X',
        siteUrl: 'https://x.com',
        supportEmail: 'contact@x.com',
        currency: 'eur',
      },
    });
    const config = generateStoreConfig(answers);

    expect(config.sesFromEmail).toBe('contact@x.com');
    expect(config.internalOrdersEmail).toBe('contact@x.com');
  });

  it('starts with empty heroImages', () => {
    const config = generateStoreConfig(createMinimalAnswers());
    expect(config.heroImages).toEqual({});
  });

  it('does not include apiBaseUrl (set during provisioning)', () => {
    const config = generateStoreConfig(createMinimalAnswers());
    expect(config.apiBaseUrl).toBeUndefined();
  });

  it('includes legalEntityName when provided', () => {
    const answers = createMinimalAnswers({
      business: {
        storeId: 'biz',
        storeName: 'Biz Store',
        legalEntityName: 'Biz LLC',
        siteUrl: 'https://biz.com',
        supportEmail: 'a@b.com',
        currency: 'usd',
      },
    });
    const config = generateStoreConfig(answers);
    expect(config.legalEntityName).toBe('Biz LLC');
  });

  it('omits legalEntityName when not provided', () => {
    const config = generateStoreConfig(createMinimalAnswers());
    expect(config.legalEntityName).toBeUndefined();
  });

  it('includes supportPhone when provided', () => {
    const answers = createMinimalAnswers({
      business: {
        storeId: 'ph',
        storeName: 'Ph',
        siteUrl: 'https://ph.com',
        supportEmail: 'a@b.com',
        supportPhone: '+1-555-0100',
        currency: 'usd',
      },
    });
    const config = generateStoreConfig(answers);
    expect(config.supportPhone).toBe('+1-555-0100');
  });

  it('includes socials when provided', () => {
    const answers = createMinimalAnswers({
      business: {
        storeId: 'social',
        storeName: 'Social Store',
        siteUrl: 'https://social.com',
        supportEmail: 'a@b.com',
        currency: 'usd',
        socials: {
          instagram: 'https://instagram.com/social',
          facebook: 'https://facebook.com/social',
        },
      },
    });
    const config = generateStoreConfig(answers);
    expect(config.socials).toEqual({
      instagram: 'https://instagram.com/social',
      facebook: 'https://facebook.com/social',
    });
  });

  it('omits socials when empty object', () => {
    const answers = createMinimalAnswers({
      business: {
        storeId: 'no-social',
        storeName: 'No Social',
        siteUrl: 'https://ns.com',
        supportEmail: 'a@b.com',
        currency: 'usd',
        socials: {},
      },
    });
    const config = generateStoreConfig(answers);
    expect(config.socials).toBeUndefined();
  });

  it('scenario: full charming-cherubs-like config', () => {
    const answers = createMinimalAnswers({
      business: {
        storeId: 'charming-cherubs',
        storeName: 'Charming Cherubs',
        legalEntityName: 'Charming Cherubs',
        siteUrl: 'https://charmingcherubsco.com',
        supportEmail: 'charmingcherubs.co@gmail.com',
        currency: 'usd',
        socials: {
          instagram: 'https://www.instagram.com/charmingcherubs.co',
          facebook: 'https://www.facebook.com/charmingcherubs',
          pinterest: 'https://pinterest.com/charmingcherubs',
        },
      },
      shipping: { type: 'flat', flatRate: 15, freeOver: 200 },
    });
    const config = generateStoreConfig(answers);

    expect(config.storeId).toBe('charming-cherubs');
    expect(config.storeName).toBe('Charming Cherubs');
    expect(config.legalEntityName).toBe('Charming Cherubs');
    expect(config.sesFromEmail).toBe('charmingcherubs.co@gmail.com');
    expect(config.shippingRules.flatRate).toBe(15);
    expect(config.shippingRules.freeOver).toBe(200);
    expect(config.socials?.instagram).toContain('instagram.com');
    expect(config.socials?.pinterest).toContain('pinterest.com');
  });
});
