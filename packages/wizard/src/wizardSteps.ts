/**
 * wizardSteps.ts — Defines the wizard step sequence and step metadata.
 *
 * The onboarding wizard is a multi-step form with 7 steps:
 * 1. Business Info — store name, URL, email, currency
 * 2. Branding — colors, fonts, hero style
 * 3. Layout — which pages to include, section preferences
 * 4. Features — blog, campaigns, payments, analytics, OE
 * 5. Shipping — shipping rules (flat rate, free over)
 * 6. Cloud Target — provider (AWS/Azure/GCP), region, custom domain
 * 7. Review — summary of all choices, confirm & generate
 *
 * How it connects to the system:
 * - The step sequence drives the wizard state machine (wizardStateMachine.ts)
 * - Each step's data maps to a section of WizardAnswers from @byb/config-generator
 * - The review step triggers generateAllConfigs() to produce all outputs
 *
 * Design decisions:
 * - Steps are ordered for progressive disclosure (business first, cloud last)
 * - Each step has an ID, label, description, and required flag
 * - Steps can be conditionally skipped (e.g., shipping could be optional)
 * - The step list is a static array — UI renders steps from this definition
 */

/**
 * Unique step identifiers.
 * These are used as keys in the wizard state to track completion.
 */
export type WizardStepId =
  | 'business'
  | 'branding'
  | 'layout'
  | 'features'
  | 'shipping'
  | 'cloud'
  | 'review';

/**
 * Metadata for a single wizard step.
 */
export interface WizardStepDefinition {
  /** Unique step identifier */
  id: WizardStepId;
  /** Display label for the step (shown in sidebar/stepper) */
  label: string;
  /** Short description of what this step collects */
  description: string;
  /** Whether this step is required to complete the wizard */
  required: boolean;
  /** Zero-based index in the step sequence */
  index: number;
}

/**
 * The ordered sequence of wizard steps.
 * This is the single source of truth for step order and metadata.
 */
export const WIZARD_STEPS: readonly WizardStepDefinition[] = [
  {
    id: 'business',
    label: 'Business Info',
    description:
      'Tell us about your business — name, website, contact info, and currency.',
    required: true,
    index: 0,
  },
  {
    id: 'branding',
    label: 'Branding',
    description:
      'Choose your brand colors, fonts, and visual style for your storefront.',
    required: true,
    index: 1,
  },
  {
    id: 'layout',
    label: 'Layout',
    description:
      'Select which pages to include and customize your site structure.',
    required: true,
    index: 2,
  },
  {
    id: 'features',
    label: 'Features',
    description:
      'Enable optional features like blog, campaigns, analytics, and payments.',
    required: true,
    index: 3,
  },
  {
    id: 'shipping',
    label: 'Shipping',
    description:
      'Configure shipping rates and free shipping thresholds.',
    required: true,
    index: 4,
  },
  {
    id: 'cloud',
    label: 'Cloud Setup',
    description:
      'Choose your cloud provider, deployment region, and custom domain.',
    required: true,
    index: 5,
  },
  {
    id: 'review',
    label: 'Review & Generate',
    description:
      'Review your choices and generate your store configuration.',
    required: true,
    index: 6,
  },
] as const;

/**
 * Total number of wizard steps.
 */
export const WIZARD_STEP_COUNT = WIZARD_STEPS.length;

/**
 * Gets a step definition by ID.
 * Throws if the step ID is not found (programming error).
 */
export function getStepDefinition(stepId: WizardStepId): WizardStepDefinition {
  const step = WIZARD_STEPS.find((s) => s.id === stepId);
  if (!step) {
    throw new Error(`Unknown wizard step: '${stepId}'`);
  }
  return step;
}

/**
 * Gets the next step ID after the given step, or null if at the end.
 */
export function getNextStepId(
  currentStepId: WizardStepId,
): WizardStepId | null {
  const current = getStepDefinition(currentStepId);
  const next = WIZARD_STEPS[current.index + 1];
  return next ? next.id : null;
}

/**
 * Gets the previous step ID before the given step, or null if at the start.
 */
export function getPreviousStepId(
  currentStepId: WizardStepId,
): WizardStepId | null {
  const current = getStepDefinition(currentStepId);
  const prev = WIZARD_STEPS[current.index - 1];
  return prev ? prev.id : null;
}
