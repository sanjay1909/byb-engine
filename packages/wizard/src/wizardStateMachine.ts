/**
 * wizardStateMachine.ts — Multi-step wizard state machine.
 *
 * Manages the wizard's lifecycle: which step is active, what data has been
 * collected, validation state, and navigation between steps.
 *
 * How it connects to the system:
 * - The UI layer (React or other) creates a wizard instance and subscribes
 *   to state changes. It calls goNext(), goBack(), updateStepData() etc.
 * - On the final step, calling complete() triggers config generation via
 *   the @byb/config-generator package.
 * - The state machine is framework-agnostic — no React, no DOM, no side effects.
 *
 * Design decisions:
 * - State is held in a plain object (WizardState) — serializable to JSON
 * - Navigation validates the current step before allowing forward movement
 * - Backward navigation is always allowed (no validation needed)
 * - The machine emits state snapshots via a listener callback (pub/sub)
 * - Step data is stored per-step so back/forward preserves user input
 * - The machine is not async — config generation happens synchronously
 */

import type { WizardAnswers } from '@byb/config-generator';
import {
  type WizardStepId,
  WIZARD_STEPS,
  getNextStepId,
  getPreviousStepId,
} from './wizardSteps.js';
import {
  STEP_VALIDATORS,
  type ValidationResult,
  type FieldError,
} from './stepValidators.js';

/**
 * Status of the wizard overall.
 */
export type WizardStatus =
  | 'idle' // Not started
  | 'in_progress' // User is filling out steps
  | 'completed' // All steps done, configs generated
  | 'error'; // Something went wrong during generation

/**
 * Status of an individual wizard step.
 */
export type StepStatus =
  | 'pending' // Not yet visited
  | 'active' // Currently being filled out
  | 'completed' // Passed validation and moved on
  | 'error'; // Has validation errors

/**
 * Per-step state tracked by the machine.
 */
export interface StepState {
  status: StepStatus;
  errors: FieldError[];
}

/**
 * The complete wizard state.
 * This is a plain object — can be serialized to JSON for persistence.
 */
export interface WizardState {
  /** Overall wizard status */
  status: WizardStatus;
  /** Current active step ID */
  currentStepId: WizardStepId;
  /** Per-step status tracking */
  steps: Record<WizardStepId, StepState>;
  /** Accumulated wizard data (partial until complete) */
  data: Partial<WizardAnswers>;
  /** Error message if status is 'error' */
  error?: string;
}

/**
 * Listener callback type — called whenever wizard state changes.
 */
export type WizardStateListener = (state: WizardState) => void;

/**
 * The wizard state machine interface.
 */
export interface WizardMachine {
  /** Get the current state snapshot. */
  getState(): WizardState;

  /** Start the wizard (transitions from idle to in_progress). */
  start(): void;

  /** Update data for the current step. Does NOT validate or navigate. */
  updateStepData(stepId: WizardStepId, data: unknown): void;

  /** Validate the current step and move to the next one if valid. */
  goNext(): ValidationResult;

  /** Move to the previous step (no validation required). */
  goBack(): void;

  /** Jump to a specific step (only allowed for completed or current steps). */
  goToStep(stepId: WizardStepId): boolean;

  /** Validate the current step without navigating. */
  validateCurrentStep(): ValidationResult;

  /** Complete the wizard — validates all steps, returns final answers. */
  complete(): WizardCompletionResult;

  /** Subscribe to state changes. Returns an unsubscribe function. */
  subscribe(listener: WizardStateListener): () => void;

  /** Reset the wizard to its initial state. */
  reset(): void;
}

/**
 * Result of completing the wizard.
 */
export interface WizardCompletionResult {
  /** Whether completion succeeded */
  success: boolean;
  /** The validated wizard answers (only present if success is true) */
  answers?: WizardAnswers;
  /** Step-level errors (only present if success is false) */
  stepErrors?: Record<WizardStepId, FieldError[]>;
}

/**
 * Creates the initial wizard state.
 */
function createInitialState(): WizardState {
  const steps: Record<string, StepState> = {};
  for (const step of WIZARD_STEPS) {
    steps[step.id] = { status: 'pending', errors: [] };
  }
  // Mark first step as active
  steps[WIZARD_STEPS[0].id].status = 'active';

  return {
    status: 'idle',
    currentStepId: WIZARD_STEPS[0].id,
    steps: steps as Record<WizardStepId, StepState>,
    data: {},
  };
}

/**
 * Maps a WizardStepId to the corresponding key in WizardAnswers.
 * Most steps map directly, but we need to handle the data key mapping.
 */
function getDataKeyForStep(
  stepId: WizardStepId,
): keyof WizardAnswers | null {
  const mapping: Record<WizardStepId, keyof WizardAnswers | null> = {
    business: 'business',
    branding: 'branding',
    layout: 'layout',
    features: 'features',
    shipping: 'shipping',
    cloud: 'cloud',
    review: null, // Review step doesn't collect data
  };
  return mapping[stepId];
}

/**
 * Creates a new wizard state machine.
 *
 * @returns A WizardMachine instance for controlling the wizard flow
 *
 * @example
 * const wizard = createWizardMachine();
 * wizard.subscribe((state) => console.log(state.currentStepId));
 * wizard.start();
 * wizard.updateStepData('business', { storeId: 'my-shop', ... });
 * wizard.goNext(); // validates and moves to branding step
 */
export function createWizardMachine(): WizardMachine {
  let state = createInitialState();
  const listeners = new Set<WizardStateListener>();

  /** Notify all subscribers of a state change. */
  function notify(): void {
    for (const listener of listeners) {
      listener(state);
    }
  }

  /** Create a new state object (immutable updates). */
  function setState(updates: Partial<WizardState>): void {
    state = { ...state, ...updates };
    notify();
  }

  /** Update a specific step's state. */
  function setStepState(
    stepId: WizardStepId,
    updates: Partial<StepState>,
  ): void {
    state = {
      ...state,
      steps: {
        ...state.steps,
        [stepId]: { ...state.steps[stepId], ...updates },
      },
    };
    notify();
  }

  /** Get the data for the current step from the wizard state. */
  function getStepData(stepId: WizardStepId): unknown {
    const dataKey = getDataKeyForStep(stepId);
    if (!dataKey) return undefined;
    return state.data[dataKey];
  }

  return {
    getState(): WizardState {
      return state;
    },

    start(): void {
      if (state.status !== 'idle') return;
      setState({ status: 'in_progress' });
      setStepState(WIZARD_STEPS[0].id, { status: 'active' });
    },

    updateStepData(stepId: WizardStepId, data: unknown): void {
      const dataKey = getDataKeyForStep(stepId);
      if (!dataKey) return; // review step has no data key

      state = {
        ...state,
        data: {
          ...state.data,
          [dataKey]: data,
        },
      };
      notify();
    },

    goNext(): ValidationResult {
      const currentStepId = state.currentStepId;
      const validator = STEP_VALIDATORS[currentStepId];
      const stepData = getStepData(currentStepId);
      const result = validator(stepData);

      if (!result.valid) {
        // Mark step as having errors
        setStepState(currentStepId, {
          status: 'error',
          errors: result.errors,
        });
        return result;
      }

      // Mark current step as completed
      setStepState(currentStepId, { status: 'completed', errors: [] });

      // Move to next step
      const nextStepId = getNextStepId(currentStepId);
      if (nextStepId) {
        setState({ currentStepId: nextStepId });
        setStepState(nextStepId, { status: 'active' });
      }

      return result;
    },

    goBack(): void {
      const prevStepId = getPreviousStepId(state.currentStepId);
      if (!prevStepId) return;

      // Mark current step back to pending (preserve its data though)
      setStepState(state.currentStepId, { status: 'pending', errors: [] });

      // Go back
      setState({ currentStepId: prevStepId });
      setStepState(prevStepId, { status: 'active' });
    },

    goToStep(stepId: WizardStepId): boolean {
      // Can only jump to completed steps or the current step
      const targetStep = WIZARD_STEPS.find((s) => s.id === stepId);
      if (!targetStep) return false;

      const currentIndex = WIZARD_STEPS.findIndex(
        (s) => s.id === state.currentStepId,
      );
      const targetIndex = targetStep.index;

      // Can go back to any previous step
      if (targetIndex < currentIndex) {
        // Mark current step as pending
        setStepState(state.currentStepId, { status: 'pending', errors: [] });
        setState({ currentStepId: stepId });
        setStepState(stepId, { status: 'active' });
        return true;
      }

      // Can go to current step (no-op)
      if (targetIndex === currentIndex) return true;

      // Can only go forward if all intermediate steps are completed
      for (let i = currentIndex; i < targetIndex; i++) {
        const intermediateStep = WIZARD_STEPS[i];
        if (state.steps[intermediateStep.id].status !== 'completed') {
          return false;
        }
      }

      setStepState(state.currentStepId, { status: 'completed', errors: [] });
      setState({ currentStepId: stepId });
      setStepState(stepId, { status: 'active' });
      return true;
    },

    validateCurrentStep(): ValidationResult {
      const validator = STEP_VALIDATORS[state.currentStepId];
      const stepData = getStepData(state.currentStepId);
      const result = validator(stepData);

      if (!result.valid) {
        setStepState(state.currentStepId, {
          status: 'error',
          errors: result.errors,
        });
      } else {
        setStepState(state.currentStepId, {
          status: state.steps[state.currentStepId].status === 'error'
            ? 'active'
            : state.steps[state.currentStepId].status,
          errors: [],
        });
      }

      return result;
    },

    complete(): WizardCompletionResult {
      // Validate ALL steps (not just current)
      const stepErrors: Record<string, FieldError[]> = {};
      let hasErrors = false;

      for (const step of WIZARD_STEPS) {
        if (step.id === 'review') continue; // Skip review validation

        const validator = STEP_VALIDATORS[step.id];
        const stepData = getStepData(step.id);
        const result = validator(stepData);

        if (!result.valid) {
          stepErrors[step.id] = result.errors;
          hasErrors = true;
          setStepState(step.id, { status: 'error', errors: result.errors });
        }
      }

      if (hasErrors) {
        return {
          success: false,
          stepErrors: stepErrors as Record<WizardStepId, FieldError[]>,
        };
      }

      // All steps valid — cast data to WizardAnswers
      setState({ status: 'completed' });

      return {
        success: true,
        answers: state.data as WizardAnswers,
      };
    },

    subscribe(listener: WizardStateListener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    reset(): void {
      state = createInitialState();
      notify();
    },
  };
}
