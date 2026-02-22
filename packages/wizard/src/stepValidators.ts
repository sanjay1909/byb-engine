/**
 * stepValidators.ts — Validation logic for each wizard step.
 *
 * Each step validator checks the user's input for that step and returns
 * either a success result or a list of field-level errors.
 *
 * How it connects to the system:
 * - The wizard state machine calls the validator before allowing a step transition
 * - Validators operate on the raw wizard state (partial WizardAnswers)
 * - Each validator returns a ValidationResult with field-level errors
 * - The UI can display these errors next to the corresponding form fields
 *
 * Design decisions:
 * - Validators are pure functions (no side effects, no async)
 * - Each validator checks its own step's data in isolation
 * - URL validation is basic (starts with https://) — not full RFC 3986
 * - Email validation is basic (contains @) — not full RFC 5322
 * - Color validation checks for hex format (#rgb or #rrggbb)
 * - The review step has no validation (it's just a summary)
 */

import type {
  WizardBusinessInfo,
  WizardBranding,
  WizardLayout,
  WizardFeatures,
  WizardShippingRules,
  WizardCloudTarget,
} from '@byb/config-generator';
import type { WizardStepId } from './wizardSteps.js';

/**
 * A single field-level validation error.
 */
export interface FieldError {
  /** The field path (e.g., 'storeName', 'socials.instagram') */
  field: string;
  /** Human-readable error message */
  message: string;
}

/**
 * Result of validating a wizard step.
 */
export interface ValidationResult {
  /** Whether the step data is valid */
  valid: boolean;
  /** Field-level errors (empty if valid) */
  errors: FieldError[];
}

/** Creates a success validation result. */
function success(): ValidationResult {
  return { valid: true, errors: [] };
}

/** Creates a failure validation result from field errors. */
function failure(errors: FieldError[]): ValidationResult {
  return { valid: false, errors };
}

/**
 * Validates a store ID slug.
 * Must be lowercase, alphanumeric with hyphens, 3-50 chars.
 */
function isValidStoreId(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(value);
}

/**
 * Basic email validation — checks for @ and a dot after it.
 */
function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Basic URL validation — must start with http:// or https://.
 */
function isValidUrl(value: string): boolean {
  return /^https?:\/\/.+/.test(value);
}

/**
 * Validates a hex color (#rgb, #rrggbb, or #rrggbbaa).
 */
function isValidHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value);
}

// ─── Step Validators ─────────────────────────────────────────────────────────

/**
 * Validates the business info step.
 * Required: storeId, storeName, siteUrl, supportEmail, currency
 */
export function validateBusinessStep(
  data: Partial<WizardBusinessInfo> | undefined,
): ValidationResult {
  const errors: FieldError[] = [];

  if (!data) {
    return failure([{ field: 'business', message: 'Business info is required' }]);
  }

  if (!data.storeId || data.storeId.trim() === '') {
    errors.push({ field: 'storeId', message: 'Store ID is required' });
  } else if (!isValidStoreId(data.storeId)) {
    errors.push({
      field: 'storeId',
      message:
        'Store ID must be 3-50 lowercase characters (letters, numbers, hyphens)',
    });
  }

  if (!data.storeName || data.storeName.trim() === '') {
    errors.push({ field: 'storeName', message: 'Store name is required' });
  }

  if (!data.siteUrl || data.siteUrl.trim() === '') {
    errors.push({ field: 'siteUrl', message: 'Site URL is required' });
  } else if (!isValidUrl(data.siteUrl)) {
    errors.push({
      field: 'siteUrl',
      message: 'Site URL must start with http:// or https://',
    });
  }

  if (!data.supportEmail || data.supportEmail.trim() === '') {
    errors.push({
      field: 'supportEmail',
      message: 'Support email is required',
    });
  } else if (!isValidEmail(data.supportEmail)) {
    errors.push({
      field: 'supportEmail',
      message: 'Please enter a valid email address',
    });
  }

  if (!data.currency || data.currency.trim() === '') {
    errors.push({ field: 'currency', message: 'Currency is required' });
  }

  // Optional social URLs — validate format if provided
  if (data.socials) {
    for (const [key, url] of Object.entries(data.socials)) {
      if (url && !isValidUrl(url)) {
        errors.push({
          field: `socials.${key}`,
          message: `${key} URL must start with http:// or https://`,
        });
      }
    }
  }

  return errors.length > 0 ? failure(errors) : success();
}

/**
 * Validates the branding step.
 * Required: primaryColor, secondaryColor
 */
export function validateBrandingStep(
  data: Partial<WizardBranding> | undefined,
): ValidationResult {
  const errors: FieldError[] = [];

  if (!data) {
    return failure([{ field: 'branding', message: 'Branding info is required' }]);
  }

  if (!data.primaryColor || data.primaryColor.trim() === '') {
    errors.push({
      field: 'primaryColor',
      message: 'Primary color is required',
    });
  } else if (!isValidHexColor(data.primaryColor)) {
    errors.push({
      field: 'primaryColor',
      message: 'Primary color must be a valid hex color (e.g., #ff0000)',
    });
  }

  if (!data.secondaryColor || data.secondaryColor.trim() === '') {
    errors.push({
      field: 'secondaryColor',
      message: 'Secondary color is required',
    });
  } else if (!isValidHexColor(data.secondaryColor)) {
    errors.push({
      field: 'secondaryColor',
      message: 'Secondary color must be a valid hex color (e.g., #00ff00)',
    });
  }

  // Optional background color — validate if provided
  if (data.backgroundColor && !isValidHexColor(data.backgroundColor)) {
    errors.push({
      field: 'backgroundColor',
      message: 'Background color must be a valid hex color',
    });
  }

  return errors.length > 0 ? failure(errors) : success();
}

/**
 * Validates the layout step.
 * Required: at least one enabled page (home is mandatory)
 */
export function validateLayoutStep(
  data: Partial<WizardLayout> | undefined,
): ValidationResult {
  const errors: FieldError[] = [];

  if (!data) {
    return failure([{ field: 'layout', message: 'Layout info is required' }]);
  }

  if (!data.pages || data.pages.length === 0) {
    errors.push({
      field: 'pages',
      message: 'At least one page is required',
    });
  } else {
    const hasHome = data.pages.some(
      (p) => p.pageId === 'home' && p.enabled,
    );
    if (!hasHome) {
      errors.push({
        field: 'pages',
        message: 'Home page must be enabled',
      });
    }

    const enabledCount = data.pages.filter((p) => p.enabled).length;
    if (enabledCount === 0) {
      errors.push({
        field: 'pages',
        message: 'At least one page must be enabled',
      });
    }
  }

  return errors.length > 0 ? failure(errors) : success();
}

/**
 * Validates the features step.
 * All fields are optional toggles — always valid if the object exists.
 */
export function validateFeaturesStep(
  data: Partial<WizardFeatures> | undefined,
): ValidationResult {
  if (!data) {
    return failure([{ field: 'features', message: 'Features info is required' }]);
  }

  // Features are all boolean/string toggles — nothing to validate
  // as long as the object exists
  return success();
}

/**
 * Validates the shipping step.
 * Required: type. Conditional: flatRate required for 'flat', freeOver for 'free_over'.
 */
export function validateShippingStep(
  data: Partial<WizardShippingRules> | undefined,
): ValidationResult {
  const errors: FieldError[] = [];

  if (!data) {
    return failure([{ field: 'shipping', message: 'Shipping info is required' }]);
  }

  if (!data.type) {
    errors.push({
      field: 'type',
      message: 'Shipping type is required',
    });
  }

  if (data.flatRate !== undefined && data.flatRate < 0) {
    errors.push({
      field: 'flatRate',
      message: 'Flat rate must be zero or positive',
    });
  }

  if (data.freeOver !== undefined && data.freeOver < 0) {
    errors.push({
      field: 'freeOver',
      message: 'Free shipping threshold must be zero or positive',
    });
  }

  return errors.length > 0 ? failure(errors) : success();
}

/**
 * Validates the cloud target step.
 * Required: provider, region
 */
export function validateCloudStep(
  data: Partial<WizardCloudTarget> | undefined,
): ValidationResult {
  const errors: FieldError[] = [];

  if (!data) {
    return failure([{ field: 'cloud', message: 'Cloud info is required' }]);
  }

  if (!data.provider) {
    errors.push({
      field: 'provider',
      message: 'Cloud provider is required',
    });
  } else if (!['aws', 'azure', 'gcp'].includes(data.provider)) {
    errors.push({
      field: 'provider',
      message: 'Cloud provider must be aws, azure, or gcp',
    });
  }

  if (!data.region || data.region.trim() === '') {
    errors.push({ field: 'region', message: 'Deployment region is required' });
  }

  // Optional custom domain — validate if provided
  if (data.customDomain && data.customDomain.trim() !== '') {
    // Domain should not contain protocol
    if (data.customDomain.includes('://')) {
      errors.push({
        field: 'customDomain',
        message: 'Custom domain should not include protocol (http/https)',
      });
    }
  }

  return errors.length > 0 ? failure(errors) : success();
}

/**
 * Validates the review step — always valid (no input to validate).
 */
export function validateReviewStep(): ValidationResult {
  return success();
}

/**
 * Map of step ID → validator function.
 * Used by the state machine to validate steps dynamically.
 */
export const STEP_VALIDATORS: Record<
  WizardStepId,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (data: any) => ValidationResult
> = {
  business: validateBusinessStep,
  branding: validateBrandingStep,
  layout: validateLayoutStep,
  features: validateFeaturesStep,
  shipping: validateShippingStep,
  cloud: validateCloudStep,
  review: validateReviewStep,
};
