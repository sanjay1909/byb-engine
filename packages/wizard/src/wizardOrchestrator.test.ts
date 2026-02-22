/**
 * Integration tests for wizardOrchestrator.ts
 *
 * Tests the complete pipeline: wizard interactions → config generation.
 * These are end-to-end scenario tests that verify:
 * - Full wizard flow produces all expected config outputs
 * - Generated configs match the wizard's input data
 * - StoreProfile connects to the correct cloud adapters
 * - Partial completion returns meaningful error information
 * - Reset clears everything and allows starting over
 * - Charming Cherubs scenario produces engine-compatible output
 */
import { describe, it, expect, vi } from 'vitest';
import { createWizardOrchestrator } from './wizardOrchestrator.js';
import type { WizardStepId } from './wizardSteps.js';

/** Complete valid wizard data for a minimal store. */
const MINIMAL_STORE = {
  business: {
    storeId: 'tiny-shop',
    storeName: 'Tiny Shop',
    siteUrl: 'https://tiny.shop',
    supportEmail: 'hi@tiny.shop',
    currency: 'eur',
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
  shipping: {
    type: 'flat' as const,
    flatRate: 5,
  },
  cloud: {
    provider: 'aws' as const,
    region: 'eu-west-1',
  },
};

/** Full charming-cherubs wizard data. */
const CHARMING_CHERUBS = {
  business: {
    storeId: 'charming-cherubs',
    storeName: 'Charming Cherubs',
    legalEntityName: 'Charming Cherubs LLC',
    siteUrl: 'https://charmingcherubsco.com',
    supportEmail: 'charmingcherubs.co@gmail.com',
    currency: 'usd',
    socials: {
      instagram: 'https://instagram.com/charmingcherubs',
      pinterest: 'https://pinterest.com/charmingcherubs',
    },
  },
  branding: {
    primaryColor: '#171717',
    secondaryColor: '#f3e8ff',
    backgroundColor: '#fff6fb',
    displayFont: 'Cinzel',
    bodyFont: 'Poppins',
    buttonStyle: 'solid' as const,
    cardStyle: 'elevated' as const,
    heroStyle: 'blob' as const,
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
    payments: 'stripe' as const,
    analytics: true,
    oe: true,
  },
  shipping: {
    type: 'flat' as const,
    flatRate: 15,
    freeOver: 200,
  },
  cloud: {
    provider: 'aws' as const,
    region: 'us-east-1',
    customDomain: 'charmingcherubsco.com',
  },
};

/** Helper: run the wizard through all steps and finish. */
function runFullWizard(
  data: typeof MINIMAL_STORE | typeof CHARMING_CHERUBS,
) {
  const wizard = createWizardOrchestrator();
  wizard.start();

  // Fill all steps
  const steps: Array<[WizardStepId, unknown]> = [
    ['business', data.business],
    ['branding', data.branding],
    ['layout', data.layout],
    ['features', data.features],
    ['shipping', data.shipping],
    ['cloud', data.cloud],
  ];

  for (const [stepId, stepData] of steps) {
    wizard.updateStep(stepId, stepData);
    const result = wizard.next();
    if (!result.valid) {
      throw new Error(
        `Step ${stepId} failed validation: ${JSON.stringify(result.errors)}`,
      );
    }
  }

  return wizard;
}

describe('WizardOrchestrator', () => {
  describe('basic operations', () => {
    it('starts in idle state', () => {
      const wizard = createWizardOrchestrator();
      expect(wizard.getState().status).toBe('idle');
    });

    it('transitions to in_progress on start', () => {
      const wizard = createWizardOrchestrator();
      wizard.start();
      expect(wizard.getState().status).toBe('in_progress');
    });

    it('exposes the underlying machine', () => {
      const wizard = createWizardOrchestrator();
      expect(wizard.getMachine()).toBeDefined();
      expect(wizard.getMachine().getState).toBeDefined();
    });

    it('subscribe notifies on state changes', () => {
      const wizard = createWizardOrchestrator();
      const listener = vi.fn();
      wizard.subscribe(listener);
      wizard.start();
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('scenario: minimal store wizard', () => {
    it('completes wizard and generates all configs', () => {
      const wizard = runFullWizard(MINIMAL_STORE);
      const result = wizard.finish();

      expect(result.success).toBe(true);
      expect(result.configs).toBeDefined();
      expect(result.answers).toBeDefined();
    });

    it('generates correct store config', () => {
      const wizard = runFullWizard(MINIMAL_STORE);
      const result = wizard.finish();

      const config = result.configs!.storeConfig;
      expect(config.storeId).toBe('tiny-shop');
      expect(config.storeName).toBe('Tiny Shop');
      expect(config.currency).toBe('eur');
      expect(config.shippingRules.type).toBe('flat');
      expect(config.shippingRules.flatRate).toBe(5);
    });

    it('generates correct theme config', () => {
      const wizard = runFullWizard(MINIMAL_STORE);
      const result = wizard.finish();

      const theme = result.configs!.themeConfig;
      expect(theme.presets).toHaveLength(1);
      expect(theme.presets[0].id).toBe('default');
      expect(theme.instant.enabled).toBe(true);
    });

    it('generates single-page template config', () => {
      const wizard = runFullWizard(MINIMAL_STORE);
      const result = wizard.finish();

      const templates = result.configs!.templateConfig;
      expect(templates.pages).toHaveLength(1);
      expect(templates.pages[0].pageId).toBe('home');
    });

    it('generates store profile with AWS adapters', () => {
      const wizard = runFullWizard(MINIMAL_STORE);
      const result = wizard.finish();

      const profile = result.configs!.storeProfile;
      expect(profile.adapters.db).toBe('dynamodb');
      expect(profile.adapters.storage).toBe('s3');
      expect(profile.deployment.region).toBe('eu-west-1');
    });

    it('generates store profile with all features disabled', () => {
      const wizard = runFullWizard(MINIMAL_STORE);
      const result = wizard.finish();

      const profile = result.configs!.storeProfile;
      expect(profile.features.blog).toBe(false);
      expect(profile.features.campaigns).toBe(false);
      expect(profile.features.payments).toBe(false);
    });
  });

  describe('scenario: charming cherubs full store', () => {
    it('produces complete config set', () => {
      const wizard = runFullWizard(CHARMING_CHERUBS);
      const result = wizard.finish();

      expect(result.success).toBe(true);
      expect(result.configs).toBeDefined();
    });

    it('store config has socials and legal name', () => {
      const wizard = runFullWizard(CHARMING_CHERUBS);
      const result = wizard.finish();

      const config = result.configs!.storeConfig;
      expect(config.legalEntityName).toBe('Charming Cherubs LLC');
      expect(config.socials?.instagram).toContain('instagram.com');
      expect(config.shippingRules.freeOver).toBe(200);
    });

    it('theme has blob hero style and custom fonts', () => {
      const wizard = runFullWizard(CHARMING_CHERUBS);
      const result = wizard.finish();

      const theme = result.configs!.themeConfig;
      const overrides = theme.presets[0].overrides;
      expect(overrides.typography?.fonts?.display).toBe('Cinzel');
      expect(overrides.studio?.frames?.hero?.style).toBe('blob1');
      expect(overrides.hero?.background).toBe('#fff6fb');
    });

    it('template has 4 pages (home, story, contact, blog)', () => {
      const wizard = runFullWizard(CHARMING_CHERUBS);
      const result = wizard.finish();

      const pages = result.configs!.templateConfig.pages;
      expect(pages).toHaveLength(4);
      expect(pages.map((p) => p.pageId)).toEqual([
        'home',
        'story',
        'contact',
        'blog',
      ]);
    });

    it('profile has Stripe payments and custom domain', () => {
      const wizard = runFullWizard(CHARMING_CHERUBS);
      const result = wizard.finish();

      const profile = result.configs!.storeProfile;
      expect(profile.features.payments).toBe('stripe');
      expect(profile.deployment.customDomain).toBe('charmingcherubsco.com');
    });
  });

  describe('error handling', () => {
    it('returns step errors when wizard is incomplete', () => {
      const wizard = createWizardOrchestrator();
      wizard.start();
      // Only fill business
      wizard.updateStep('business', MINIMAL_STORE.business);

      const result = wizard.finish();
      expect(result.success).toBe(false);
      expect(result.stepErrors).toBeDefined();
    });

    it('next() returns errors for invalid data', () => {
      const wizard = createWizardOrchestrator();
      wizard.start();
      wizard.updateStep('business', { storeId: 'BAD' });

      const result = wizard.next();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('validate() checks current step without advancing', () => {
      const wizard = createWizardOrchestrator();
      wizard.start();
      wizard.updateStep('business', MINIMAL_STORE.business);

      const result = wizard.validate();
      expect(result.valid).toBe(true);
      expect(wizard.getState().currentStepId).toBe('business');
    });
  });

  describe('navigation', () => {
    it('back() goes to previous step', () => {
      const wizard = createWizardOrchestrator();
      wizard.start();
      wizard.updateStep('business', MINIMAL_STORE.business);
      wizard.next();

      wizard.back();
      expect(wizard.getState().currentStepId).toBe('business');
    });

    it('jumpTo() allows going back to completed steps', () => {
      const wizard = runFullWizard(MINIMAL_STORE);

      expect(wizard.jumpTo('business')).toBe(true);
      expect(wizard.getState().currentStepId).toBe('business');
    });
  });

  describe('reset', () => {
    it('clears everything and allows starting over', () => {
      const wizard = runFullWizard(MINIMAL_STORE);
      wizard.finish();

      wizard.reset();
      expect(wizard.getState().status).toBe('idle');
      expect(wizard.getState().data).toEqual({});

      // Can start over
      wizard.start();
      expect(wizard.getState().status).toBe('in_progress');
    });
  });
});
