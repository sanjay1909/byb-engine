/**
 * wizardOrchestrator.ts — Orchestrates the full wizard lifecycle.
 *
 * Connects the wizard state machine to the config generator package.
 * When the user completes the wizard, the orchestrator:
 * 1. Validates all steps via the state machine
 * 2. Generates all config files via @byb/config-generator
 * 3. Returns the complete output bundle
 *
 * How it connects to the system:
 * - Input: User interactions (step data updates, navigation)
 * - Output: GeneratedConfigs from @byb/config-generator
 * - The caller writes configs to disk and provisions the store
 * - This is the top-level API for the wizard — the UI layer calls this
 *
 * Design decisions:
 * - The orchestrator wraps the state machine (composition, not inheritance)
 * - It exposes a simpler API than the raw state machine
 * - Config generation only happens on successful completion
 * - The orchestrator is stateful — one instance per wizard session
 */

import {
  generateAllConfigs,
  type GeneratedConfigs,
  type WizardAnswers,
} from '@byb/config-generator';
import {
  createWizardMachine,
  type WizardMachine,
  type WizardState,
  type WizardStateListener,
} from './wizardStateMachine.js';
import type { WizardStepId } from './wizardSteps.js';
import type { ValidationResult, FieldError } from './stepValidators.js';

/**
 * Result of the wizard orchestration — either configs or errors.
 */
export interface WizardResult {
  /** Whether the wizard completed successfully */
  success: boolean;
  /** Generated configs (only present on success) */
  configs?: GeneratedConfigs;
  /** Validated wizard answers (only present on success) */
  answers?: WizardAnswers;
  /** Step errors (only present on failure) */
  stepErrors?: Record<WizardStepId, FieldError[]>;
  /** Error message (only present on critical failure) */
  error?: string;
}

/**
 * The wizard orchestrator interface.
 */
export interface WizardOrchestrator {
  /** Get the current wizard state. */
  getState(): WizardState;

  /** Start the wizard. */
  start(): void;

  /** Update data for a step. */
  updateStep(stepId: WizardStepId, data: unknown): void;

  /** Validate and advance to the next step. */
  next(): ValidationResult;

  /** Go back to the previous step. */
  back(): void;

  /** Jump to a specific step. */
  jumpTo(stepId: WizardStepId): boolean;

  /** Validate the current step. */
  validate(): ValidationResult;

  /**
   * Complete the wizard — validates all steps and generates configs.
   * This is the main action — call this when the user clicks "Generate" on the review step.
   */
  finish(): WizardResult;

  /** Subscribe to state changes. */
  subscribe(listener: WizardStateListener): () => void;

  /** Reset the wizard to start over. */
  reset(): void;

  /** Get the underlying state machine (for advanced usage). */
  getMachine(): WizardMachine;
}

/**
 * Creates a new wizard orchestrator.
 *
 * This is the primary entry point for the wizard UI layer.
 *
 * @returns A WizardOrchestrator instance
 *
 * @example
 * const wizard = createWizardOrchestrator();
 * wizard.start();
 *
 * // User fills out business step
 * wizard.updateStep('business', { storeId: 'my-shop', ... });
 * wizard.next(); // validates and advances
 *
 * // ... more steps ...
 *
 * // User clicks "Generate" on review
 * const result = wizard.finish();
 * if (result.success) {
 *   writeJson('store.config.json', result.configs.storeConfig);
 *   writeJson('theme.json', result.configs.themeConfig);
 *   // ... etc.
 * }
 */
export function createWizardOrchestrator(): WizardOrchestrator {
  const machine = createWizardMachine();

  return {
    getState(): WizardState {
      return machine.getState();
    },

    start(): void {
      machine.start();
    },

    updateStep(stepId: WizardStepId, data: unknown): void {
      machine.updateStepData(stepId, data);
    },

    next(): ValidationResult {
      return machine.goNext();
    },

    back(): void {
      machine.goBack();
    },

    jumpTo(stepId: WizardStepId): boolean {
      return machine.goToStep(stepId);
    },

    validate(): ValidationResult {
      return machine.validateCurrentStep();
    },

    finish(): WizardResult {
      // Step 1: Validate all steps via the state machine
      const completion = machine.complete();

      if (!completion.success) {
        return {
          success: false,
          stepErrors: completion.stepErrors,
        };
      }

      // Step 2: Generate all configs from the validated answers
      try {
        const configs = generateAllConfigs(completion.answers!);
        return {
          success: true,
          configs,
          answers: completion.answers,
        };
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error
              ? err.message
              : 'Unknown error during config generation',
        };
      }
    },

    subscribe(listener: WizardStateListener): () => void {
      return machine.subscribe(listener);
    },

    reset(): void {
      machine.reset();
    },

    getMachine(): WizardMachine {
      return machine;
    },
  };
}
