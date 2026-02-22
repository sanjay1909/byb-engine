/**
 * @byb/wizard — Onboarding wizard state machine and orchestrator.
 *
 * This package provides the complete wizard lifecycle management:
 * - Step definitions (7 steps: business, branding, layout, features, shipping, cloud, review)
 * - Step validators (per-step input validation with field-level errors)
 * - State machine (step transitions, navigation, validation)
 * - Orchestrator (connects state machine to @byb/config-generator)
 *
 * The wizard is framework-agnostic — no React, no DOM. The UI layer
 * (React, Vue, etc.) creates an orchestrator instance and subscribes
 * to state changes to render the wizard UI.
 *
 * Usage:
 *   import { createWizardOrchestrator } from '@byb/wizard';
 *
 *   const wizard = createWizardOrchestrator();
 *   wizard.subscribe((state) => renderUI(state));
 *   wizard.start();
 *   wizard.updateStep('business', { storeId: 'my-shop', ... });
 *   wizard.next(); // validates and advances
 *   // ... more steps ...
 *   const result = wizard.finish(); // generates all configs
 */

// Step definitions
export {
  WIZARD_STEPS,
  WIZARD_STEP_COUNT,
  getStepDefinition,
  getNextStepId,
  getPreviousStepId,
  type WizardStepId,
  type WizardStepDefinition,
} from './wizardSteps.js';

// Step validators
export {
  validateBusinessStep,
  validateBrandingStep,
  validateLayoutStep,
  validateFeaturesStep,
  validateShippingStep,
  validateCloudStep,
  validateReviewStep,
  STEP_VALIDATORS,
  type ValidationResult,
  type FieldError,
} from './stepValidators.js';

// State machine
export {
  createWizardMachine,
  type WizardMachine,
  type WizardState,
  type WizardStatus,
  type StepStatus,
  type StepState,
  type WizardStateListener,
  type WizardCompletionResult,
} from './wizardStateMachine.js';

// Orchestrator (primary API)
export {
  createWizardOrchestrator,
  type WizardOrchestrator,
  type WizardResult,
} from './wizardOrchestrator.js';
