/**
 * Integration test for generateAllConfigs.ts
 *
 * Tests the complete pipeline: wizard answers → all 4 configs.
 * Verifies that all generators work together and produce consistent output.
 *
 * Covers:
 * - All 5 outputs are present and well-formed
 * - StoreConfig matches business info
 * - ThemeConfig has a default preset with branding colors
 * - TemplatesConfig has the requested pages
 * - ComponentDefaults reflect branding choices
 * - StoreProfile maps to correct cloud adapters
 * - Scenario: full charming-cherubs wizard → complete config set
 * - Scenario: minimal wizard (just home page, no extras)
 * - Scenario: Azure target (different adapters)
 */
import { describe, it, expect } from 'vitest';
import { generateAllConfigs } from './generateAllConfigs.js';
import type { WizardAnswers } from './types.js';

/** Full charming-cherubs-like wizard answers. */
const CHARMING_CHERUBS_ANSWERS: WizardAnswers = {
  business: {
    storeId: 'charming-cherubs',
    storeName: 'Charming Cherubs',
    legalEntityName: 'Charming Cherubs LLC',
    siteUrl: 'https://charmingcherubsco.com',
    supportEmail: 'charmingcherubs.co@gmail.com',
    currency: 'usd',
    socials: {
      instagram: 'https://www.instagram.com/charmingcherubs.co',
      facebook: 'https://www.facebook.com/charmingcherubs',
      pinterest: 'https://pinterest.com/charmingcherubs',
    },
  },
  shipping: {
    type: 'flat',
    flatRate: 15,
    freeOver: 200,
  },
  branding: {
    primaryColor: '#171717',
    secondaryColor: '#f3e8ff',
    backgroundColor: '#fff6fb',
    displayFont: 'Cinzel',
    bodyFont: 'Poppins',
    buttonStyle: 'solid',
    cardStyle: 'elevated',
    heroStyle: 'blob',
  },
  layout: {
    pages: [
      { pageId: 'home', label: 'Home', enabled: true },
      { pageId: 'story', label: 'Our Story', enabled: true },
      { pageId: 'contact', label: 'Contact', enabled: true },
    ],
    includeBlog: true,
  },
  features: {
    blog: true,
    campaigns: true,
    payments: 'stripe',
    analytics: true,
    oe: true,
  },
  cloud: {
    provider: 'aws',
    region: 'us-east-1',
    customDomain: 'charmingcherubsco.com',
  },
};

/** Minimal wizard answers. */
const MINIMAL_ANSWERS: WizardAnswers = {
  business: {
    storeId: 'tiny-shop',
    storeName: 'Tiny Shop',
    siteUrl: 'https://tiny.shop',
    supportEmail: 'hi@tiny.shop',
    currency: 'eur',
  },
  shipping: {
    type: 'flat',
    flatRate: 5,
  },
  branding: {
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
  },
  layout: {
    pages: [{ pageId: 'home', label: 'Home', enabled: true }],
  },
  features: {
    blog: false,
    campaigns: false,
    payments: false,
    analytics: false,
    oe: false,
  },
  cloud: {
    provider: 'aws',
    region: 'eu-west-1',
  },
};

describe('generateAllConfigs', () => {
  it('returns all 5 outputs', () => {
    const result = generateAllConfigs(MINIMAL_ANSWERS);

    expect(result.storeConfig).toBeDefined();
    expect(result.themeConfig).toBeDefined();
    expect(result.templateConfig).toBeDefined();
    expect(result.componentDefaults).toBeDefined();
    expect(result.storeProfile).toBeDefined();
  });

  describe('scenario: charming-cherubs full config', () => {
    const result = generateAllConfigs(CHARMING_CHERUBS_ANSWERS);

    it('storeConfig has correct identity', () => {
      expect(result.storeConfig.storeId).toBe('charming-cherubs');
      expect(result.storeConfig.storeName).toBe('Charming Cherubs');
      expect(result.storeConfig.legalEntityName).toBe('Charming Cherubs LLC');
      expect(result.storeConfig.siteUrl).toBe('https://charmingcherubsco.com');
      expect(result.storeConfig.currency).toBe('usd');
    });

    it('storeConfig has shipping rules', () => {
      expect(result.storeConfig.shippingRules).toEqual({
        type: 'flat',
        flatRate: 15,
        freeOver: 200,
      });
    });

    it('storeConfig has socials', () => {
      expect(result.storeConfig.socials?.instagram).toContain('instagram.com');
      expect(result.storeConfig.socials?.pinterest).toContain('pinterest.com');
    });

    it('themeConfig has a default preset with brand overrides', () => {
      expect(result.themeConfig.presets).toHaveLength(1);
      expect(result.themeConfig.presets[0].id).toBe('default');
      expect(result.themeConfig.presets[0].label).toBe(
        'Charming Cherubs Theme',
      );

      const overrides = result.themeConfig.presets[0].overrides;
      expect(overrides.typography?.fonts?.display).toBe('Cinzel');
      expect(overrides.typography?.fonts?.body).toBe('Poppins');
      expect(overrides.hero?.titleColor).toBe('#171717');
      expect(overrides.hero?.accentColor).toBe('#f3e8ff');
      expect(overrides.hero?.background).toBe('#fff6fb');
      expect(overrides.studio?.frames?.hero?.style).toBe('blob1');
    });

    it('themeConfig has instant activation', () => {
      expect(result.themeConfig.instant.enabled).toBe(true);
      expect(result.themeConfig.instant.themeId).toBe('default');
    });

    it('templateConfig has 4 pages (home, story, contact, blog)', () => {
      expect(result.templateConfig.pages).toHaveLength(4);
      const pageIds = result.templateConfig.pages.map((p) => p.pageId);
      expect(pageIds).toEqual(['home', 'story', 'contact', 'blog']);
    });

    it('templateConfig home page has 6 sections', () => {
      const home = result.templateConfig.pages.find(
        (p) => p.pageId === 'home',
      );
      expect(home!.layout).toHaveLength(6);
      expect(home!.layout[0].type).toBe('home-header');
      expect(home!.layout[1].type).toBe('home-hero');
    });

    it('componentDefaults match branding choices', () => {
      expect(result.componentDefaults.button).toBe('solid');
      expect(result.componentDefaults.card).toBe('elevated');
    });

    it('storeProfile maps to AWS adapters', () => {
      expect(result.storeProfile.profileId).toBe('store-charming-cherubs');
      expect(result.storeProfile.adapters.db).toBe('dynamodb');
      expect(result.storeProfile.adapters.storage).toBe('s3');
      expect(result.storeProfile.adapters.infra).toBe('aws-cdk');
    });

    it('storeProfile has all features enabled', () => {
      expect(result.storeProfile.features.blog).toBe(true);
      expect(result.storeProfile.features.campaigns).toBe(true);
      expect(result.storeProfile.features.payments).toBe('stripe');
      expect(result.storeProfile.features.analytics).toBe(true);
      expect(result.storeProfile.features.oe).toBe(true);
    });

    it('storeProfile has deployment with custom domain', () => {
      expect(result.storeProfile.deployment.region).toBe('us-east-1');
      expect(result.storeProfile.deployment.customDomain).toBe(
        'charmingcherubsco.com',
      );
    });
  });

  describe('scenario: minimal shop (home only, no extras)', () => {
    const result = generateAllConfigs(MINIMAL_ANSWERS);

    it('storeConfig has minimal fields', () => {
      expect(result.storeConfig.storeId).toBe('tiny-shop');
      expect(result.storeConfig.legalEntityName).toBeUndefined();
      expect(result.storeConfig.socials).toBeUndefined();
      expect(result.storeConfig.supportPhone).toBeUndefined();
    });

    it('templateConfig has only home page', () => {
      expect(result.templateConfig.pages).toHaveLength(1);
      expect(result.templateConfig.pages[0].pageId).toBe('home');
    });

    it('storeProfile has all features disabled', () => {
      expect(result.storeProfile.features.blog).toBe(false);
      expect(result.storeProfile.features.campaigns).toBe(false);
      expect(result.storeProfile.features.payments).toBe(false);
      expect(result.storeProfile.features.analytics).toBe(false);
      expect(result.storeProfile.features.oe).toBe(false);
    });

    it('componentDefaults use engine defaults', () => {
      expect(result.componentDefaults.button).toBe('solid');
      expect(result.componentDefaults.card).toBe('elevated');
      expect(result.componentDefaults.input).toBe('filled');
    });
  });

  describe('scenario: Azure target', () => {
    it('maps to Azure adapter IDs', () => {
      const azureAnswers: WizardAnswers = {
        ...MINIMAL_ANSWERS,
        cloud: { provider: 'azure', region: 'eastus' },
      };
      const result = generateAllConfigs(azureAnswers);

      expect(result.storeProfile.adapters.db).toBe('cosmos-db');
      expect(result.storeProfile.adapters.storage).toBe('blob-storage');
      expect(result.storeProfile.adapters.infra).toBe('azure-arm');
      expect(result.storeProfile.deployment.region).toBe('eastus');
    });
  });

  describe('cross-generator consistency', () => {
    it('storeConfig.storeId matches storeProfile.match.storeId', () => {
      const result = generateAllConfigs(CHARMING_CHERUBS_ANSWERS);
      expect(result.storeConfig.storeId).toBe(
        result.storeProfile.match.storeId,
      );
    });

    it('storeConfig.storeName is used in theme preset label', () => {
      const result = generateAllConfigs(CHARMING_CHERUBS_ANSWERS);
      expect(result.themeConfig.presets[0].label).toContain(
        result.storeConfig.storeName,
      );
    });

    it('blog feature flag controls blog page inclusion', () => {
      // With blog enabled
      const withBlog = generateAllConfigs({
        ...MINIMAL_ANSWERS,
        layout: {
          ...MINIMAL_ANSWERS.layout,
          includeBlog: true,
        },
        features: { ...MINIMAL_ANSWERS.features, blog: true },
      });
      expect(
        withBlog.templateConfig.pages.some((p) => p.pageId === 'blog'),
      ).toBe(true);
      expect(withBlog.storeProfile.features.blog).toBe(true);

      // With blog disabled
      const noBlog = generateAllConfigs({
        ...MINIMAL_ANSWERS,
        layout: {
          ...MINIMAL_ANSWERS.layout,
          includeBlog: true,
        },
        features: { ...MINIMAL_ANSWERS.features, blog: false },
      });
      expect(
        noBlog.templateConfig.pages.some((p) => p.pageId === 'blog'),
      ).toBe(false);
      expect(noBlog.storeProfile.features.blog).toBe(false);
    });
  });
});
