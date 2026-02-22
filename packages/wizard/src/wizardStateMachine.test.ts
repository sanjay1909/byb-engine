/**
 * Tests for wizardStateMachine.ts
 *
 * Covers:
 * - Initial state (idle, first step active)
 * - start() transitions to in_progress
 * - updateStepData() stores data per step
 * - goNext() validates and advances (or reports errors)
 * - goBack() navigates backward without validation
 * - goToStep() jump navigation (forward requires completion, back always ok)
 * - validateCurrentStep() validates without navigating
 * - complete() validates all steps and returns answers
 * - subscribe() listener gets state updates
 * - reset() returns to initial state
 * - Full scenario: complete wizard flow
 */
import { describe, it, expect, vi } from 'vitest';
import { createWizardMachine } from './wizardStateMachine.js';

/** Valid step data for each step — used in multi-step scenario tests. */
const VALID_BUSINESS = {
  storeId: 'test-shop',
  storeName: 'Test Shop',
  siteUrl: 'https://testshop.com',
  supportEmail: 'help@testshop.com',
  currency: 'usd',
};

const VALID_BRANDING = {
  primaryColor: '#171717',
  secondaryColor: '#f3e8ff',
};

const VALID_LAYOUT = {
  pages: [{ pageId: 'home', label: 'Home', enabled: true }],
};

const VALID_FEATURES = {
  blog: true,
  campaigns: false,
  payments: 'stripe',
  analytics: true,
  oe: false,
};

const VALID_SHIPPING = {
  type: 'flat' as const,
  flatRate: 10,
};

const VALID_CLOUD = {
  provider: 'aws' as const,
  region: 'us-east-1',
};

/** Helper: advance wizard through all steps with valid data. */
function advanceToReview(
  wizard: ReturnType<typeof createWizardMachine>,
): void {
  wizard.start();

  // Step 1: Business
  wizard.updateStepData('business', VALID_BUSINESS);
  wizard.goNext();

  // Step 2: Branding
  wizard.updateStepData('branding', VALID_BRANDING);
  wizard.goNext();

  // Step 3: Layout
  wizard.updateStepData('layout', VALID_LAYOUT);
  wizard.goNext();

  // Step 4: Features
  wizard.updateStepData('features', VALID_FEATURES);
  wizard.goNext();

  // Step 5: Shipping
  wizard.updateStepData('shipping', VALID_SHIPPING);
  wizard.goNext();

  // Step 6: Cloud
  wizard.updateStepData('cloud', VALID_CLOUD);
  wizard.goNext();

  // Now at review step
}

describe('createWizardMachine', () => {
  describe('initial state', () => {
    it('starts in idle status', () => {
      const wizard = createWizardMachine();
      expect(wizard.getState().status).toBe('idle');
    });

    it('starts on the business step', () => {
      const wizard = createWizardMachine();
      expect(wizard.getState().currentStepId).toBe('business');
    });

    it('first step is active, rest are pending', () => {
      const wizard = createWizardMachine();
      const state = wizard.getState();
      expect(state.steps.business.status).toBe('active');
      expect(state.steps.branding.status).toBe('pending');
      expect(state.steps.review.status).toBe('pending');
    });

    it('starts with empty data', () => {
      const wizard = createWizardMachine();
      expect(wizard.getState().data).toEqual({});
    });
  });

  describe('start()', () => {
    it('transitions to in_progress', () => {
      const wizard = createWizardMachine();
      wizard.start();
      expect(wizard.getState().status).toBe('in_progress');
    });

    it('does nothing if already started', () => {
      const wizard = createWizardMachine();
      wizard.start();
      wizard.start(); // second call is a no-op
      expect(wizard.getState().status).toBe('in_progress');
    });
  });

  describe('updateStepData()', () => {
    it('stores data for a step', () => {
      const wizard = createWizardMachine();
      wizard.start();
      wizard.updateStepData('business', VALID_BUSINESS);
      expect(wizard.getState().data.business).toEqual(VALID_BUSINESS);
    });

    it('overwrites previous data for the same step', () => {
      const wizard = createWizardMachine();
      wizard.start();
      wizard.updateStepData('business', { storeId: 'old' });
      wizard.updateStepData('business', VALID_BUSINESS);
      expect(wizard.getState().data.business).toEqual(VALID_BUSINESS);
    });

    it('does not store data for review step', () => {
      const wizard = createWizardMachine();
      wizard.start();
      wizard.updateStepData('review', { something: 'ignored' });
      expect(wizard.getState().data).toEqual({});
    });
  });

  describe('goNext()', () => {
    it('validates and advances on success', () => {
      const wizard = createWizardMachine();
      wizard.start();
      wizard.updateStepData('business', VALID_BUSINESS);
      const result = wizard.goNext();

      expect(result.valid).toBe(true);
      expect(wizard.getState().currentStepId).toBe('branding');
      expect(wizard.getState().steps.business.status).toBe('completed');
      expect(wizard.getState().steps.branding.status).toBe('active');
    });

    it('stays on current step with errors on failure', () => {
      const wizard = createWizardMachine();
      wizard.start();
      wizard.updateStepData('business', {}); // invalid
      const result = wizard.goNext();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(wizard.getState().currentStepId).toBe('business');
      expect(wizard.getState().steps.business.status).toBe('error');
    });

    it('stores validation errors in step state', () => {
      const wizard = createWizardMachine();
      wizard.start();
      wizard.updateStepData('business', { storeId: '' });
      wizard.goNext();

      const errors = wizard.getState().steps.business.errors;
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].field).toBe('storeId');
    });
  });

  describe('goBack()', () => {
    it('moves to previous step', () => {
      const wizard = createWizardMachine();
      wizard.start();
      wizard.updateStepData('business', VALID_BUSINESS);
      wizard.goNext(); // now on branding

      wizard.goBack();
      expect(wizard.getState().currentStepId).toBe('business');
    });

    it('does nothing on first step', () => {
      const wizard = createWizardMachine();
      wizard.start();
      wizard.goBack();
      expect(wizard.getState().currentStepId).toBe('business');
    });

    it('preserves step data when going back', () => {
      const wizard = createWizardMachine();
      wizard.start();
      wizard.updateStepData('business', VALID_BUSINESS);
      wizard.goNext();
      wizard.updateStepData('branding', VALID_BRANDING);

      wizard.goBack();
      // Business data is preserved
      expect(wizard.getState().data.business).toEqual(VALID_BUSINESS);
      // Branding data is also preserved
      expect(wizard.getState().data.branding).toEqual(VALID_BRANDING);
    });
  });

  describe('goToStep()', () => {
    it('can jump back to a previous step', () => {
      const wizard = createWizardMachine();
      wizard.start();
      wizard.updateStepData('business', VALID_BUSINESS);
      wizard.goNext(); // branding
      wizard.updateStepData('branding', VALID_BRANDING);
      wizard.goNext(); // layout

      const ok = wizard.goToStep('business');
      expect(ok).toBe(true);
      expect(wizard.getState().currentStepId).toBe('business');
    });

    it('cannot jump forward past incomplete steps', () => {
      const wizard = createWizardMachine();
      wizard.start();

      const ok = wizard.goToStep('cloud');
      expect(ok).toBe(false);
      expect(wizard.getState().currentStepId).toBe('business');
    });

    it('returns true for current step (no-op)', () => {
      const wizard = createWizardMachine();
      wizard.start();
      expect(wizard.goToStep('business')).toBe(true);
    });
  });

  describe('validateCurrentStep()', () => {
    it('validates without navigating', () => {
      const wizard = createWizardMachine();
      wizard.start();
      wizard.updateStepData('business', VALID_BUSINESS);

      const result = wizard.validateCurrentStep();
      expect(result.valid).toBe(true);
      // Still on the same step
      expect(wizard.getState().currentStepId).toBe('business');
    });

    it('sets error status on invalid', () => {
      const wizard = createWizardMachine();
      wizard.start();
      wizard.updateStepData('business', {});

      const result = wizard.validateCurrentStep();
      expect(result.valid).toBe(false);
      expect(wizard.getState().steps.business.status).toBe('error');
    });
  });

  describe('complete()', () => {
    it('returns success with answers when all steps valid', () => {
      const wizard = createWizardMachine();
      advanceToReview(wizard);

      const result = wizard.complete();
      expect(result.success).toBe(true);
      expect(result.answers).toBeDefined();
      expect(result.answers!.business.storeId).toBe('test-shop');
      expect(result.answers!.cloud.provider).toBe('aws');
    });

    it('marks wizard as completed on success', () => {
      const wizard = createWizardMachine();
      advanceToReview(wizard);
      wizard.complete();

      expect(wizard.getState().status).toBe('completed');
    });

    it('returns failure with step errors if any step is invalid', () => {
      const wizard = createWizardMachine();
      wizard.start();
      // Only fill business, skip the rest
      wizard.updateStepData('business', VALID_BUSINESS);

      const result = wizard.complete();
      expect(result.success).toBe(false);
      expect(result.stepErrors).toBeDefined();
      // Branding should have errors since it wasn't filled
      expect(result.stepErrors!.branding.length).toBeGreaterThan(0);
    });

    it('does not change status on failure', () => {
      const wizard = createWizardMachine();
      wizard.start();
      wizard.complete();

      expect(wizard.getState().status).not.toBe('completed');
    });
  });

  describe('subscribe()', () => {
    it('calls listener on state changes', () => {
      const wizard = createWizardMachine();
      const listener = vi.fn();
      wizard.subscribe(listener);

      wizard.start();
      expect(listener).toHaveBeenCalled();
    });

    it('returns unsubscribe function', () => {
      const wizard = createWizardMachine();
      const listener = vi.fn();
      const unsubscribe = wizard.subscribe(listener);

      unsubscribe();
      wizard.start();
      // listener should NOT be called after unsubscribe
      expect(listener).not.toHaveBeenCalled();
    });

    it('receives the updated state', () => {
      const wizard = createWizardMachine();
      let receivedState: any;
      wizard.subscribe((state) => {
        receivedState = state;
      });

      wizard.start();
      expect(receivedState.status).toBe('in_progress');
    });
  });

  describe('reset()', () => {
    it('returns to initial state', () => {
      const wizard = createWizardMachine();
      wizard.start();
      wizard.updateStepData('business', VALID_BUSINESS);
      wizard.goNext();

      wizard.reset();
      expect(wizard.getState().status).toBe('idle');
      expect(wizard.getState().currentStepId).toBe('business');
      expect(wizard.getState().data).toEqual({});
    });

    it('notifies subscribers', () => {
      const wizard = createWizardMachine();
      wizard.start();
      const listener = vi.fn();
      wizard.subscribe(listener);

      wizard.reset();
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('full scenario: complete wizard flow', () => {
    it('walks through all steps and produces valid answers', () => {
      const wizard = createWizardMachine();

      // Start
      wizard.start();
      expect(wizard.getState().status).toBe('in_progress');

      // Step 1: Business
      expect(wizard.getState().currentStepId).toBe('business');
      wizard.updateStepData('business', VALID_BUSINESS);
      expect(wizard.goNext().valid).toBe(true);

      // Step 2: Branding
      expect(wizard.getState().currentStepId).toBe('branding');
      wizard.updateStepData('branding', VALID_BRANDING);
      expect(wizard.goNext().valid).toBe(true);

      // Step 3: Layout
      expect(wizard.getState().currentStepId).toBe('layout');
      wizard.updateStepData('layout', VALID_LAYOUT);
      expect(wizard.goNext().valid).toBe(true);

      // Step 4: Features
      expect(wizard.getState().currentStepId).toBe('features');
      wizard.updateStepData('features', VALID_FEATURES);
      expect(wizard.goNext().valid).toBe(true);

      // Step 5: Shipping
      expect(wizard.getState().currentStepId).toBe('shipping');
      wizard.updateStepData('shipping', VALID_SHIPPING);
      expect(wizard.goNext().valid).toBe(true);

      // Step 6: Cloud
      expect(wizard.getState().currentStepId).toBe('cloud');
      wizard.updateStepData('cloud', VALID_CLOUD);
      expect(wizard.goNext().valid).toBe(true);

      // Step 7: Review
      expect(wizard.getState().currentStepId).toBe('review');

      // Complete
      const result = wizard.complete();
      expect(result.success).toBe(true);
      expect(result.answers!.business.storeId).toBe('test-shop');
      expect(result.answers!.branding.primaryColor).toBe('#171717');
      expect(result.answers!.layout.pages).toHaveLength(1);
      expect(result.answers!.features.payments).toBe('stripe');
      expect(result.answers!.shipping.type).toBe('flat');
      expect(result.answers!.cloud.provider).toBe('aws');

      expect(wizard.getState().status).toBe('completed');
    });

    it('allows editing a previous step and returning', () => {
      const wizard = createWizardMachine();
      advanceToReview(wizard);

      // Go back to branding to change colors
      wizard.goToStep('branding');
      expect(wizard.getState().currentStepId).toBe('branding');

      wizard.updateStepData('branding', {
        primaryColor: '#ff0000',
        secondaryColor: '#0000ff',
      });

      // Advance back through to review
      wizard.goNext(); // layout
      wizard.goNext(); // features
      wizard.goNext(); // shipping
      wizard.goNext(); // cloud
      wizard.goNext(); // review

      const result = wizard.complete();
      expect(result.success).toBe(true);
      expect(result.answers!.branding.primaryColor).toBe('#ff0000');
    });
  });
});
