/**
 * presetGallery.ts — Browsing, filtering, and applying presets.
 *
 * Provides the API for the wizard UI to:
 * - List all available presets
 * - Filter presets by industry, style, or search text
 * - Get a specific preset by ID
 * - Apply a preset to the wizard's branding and layout steps
 *
 * How it connects to the system:
 * - The wizard UI calls listPresets()/filterPresets() to populate the gallery
 * - When the user selects a preset, applyPreset() merges the preset's values
 *   into partial WizardAnswers that can be fed into the wizard orchestrator
 * - The user can then customize any value before proceeding
 *
 * Design decisions:
 * - Filtering is case-insensitive and searches label + description
 * - applyPreset() returns a partial WizardAnswers (branding + layout only)
 * - The preset doesn't override business info, shipping, features, or cloud
 * - Multiple filters can be combined (industry AND style AND search)
 */

import type { WizardBranding, WizardLayout } from '@byb/config-generator';
import type { SitePreset, PresetFilter } from './presetTypes.js';
import { SITE_PRESETS } from './presetDefinitions.js';

/**
 * The result of applying a preset — partial wizard answers.
 * These can be fed directly into wizard.updateStep() calls.
 */
export interface AppliedPreset {
  /** Preset ID for reference */
  presetId: string;
  /** Branding values to apply to the wizard's branding step */
  branding: WizardBranding;
  /** Layout values to apply to the wizard's layout step */
  layout: WizardLayout;
}

/**
 * Lists all available presets.
 *
 * @returns All site presets in the gallery
 */
export function listPresets(): readonly SitePreset[] {
  return SITE_PRESETS;
}

/**
 * Gets a specific preset by ID.
 *
 * @param presetId - The preset ID to look up
 * @returns The preset, or undefined if not found
 */
export function getPreset(presetId: string): SitePreset | undefined {
  return SITE_PRESETS.find((p) => p.id === presetId);
}

/**
 * Filters presets by industry, style, and/or search text.
 * All filter criteria are AND-combined (must match all provided filters).
 *
 * @param filter - The filter criteria
 * @returns Presets matching all criteria
 *
 * @example
 * filterPresets({ industry: 'fashion' });
 * filterPresets({ style: 'minimal', search: 'beauty' });
 */
export function filterPresets(filter: PresetFilter): SitePreset[] {
  let results = [...SITE_PRESETS];

  if (filter.industry) {
    results = results.filter((p) => p.industry === filter.industry);
  }

  if (filter.style) {
    results = results.filter((p) => p.style === filter.style);
  }

  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    results = results.filter(
      (p) =>
        p.label.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower),
    );
  }

  return results;
}

/**
 * Applies a preset to create partial wizard answers.
 * The returned values can be fed directly into wizard.updateStep() calls
 * for the branding and layout steps.
 *
 * @param presetId - The preset ID to apply
 * @returns The applied preset values, or undefined if preset not found
 *
 * @example
 * const applied = applyPreset('elegant-fashion');
 * if (applied) {
 *   wizard.updateStep('branding', applied.branding);
 *   wizard.updateStep('layout', applied.layout);
 * }
 */
export function applyPreset(presetId: string): AppliedPreset | undefined {
  const preset = getPreset(presetId);
  if (!preset) return undefined;

  return {
    presetId: preset.id,
    branding: { ...preset.branding },
    layout: {
      ...preset.layout,
      pages: preset.layout.pages.map((p) => ({ ...p })),
    },
  };
}

/**
 * Returns all unique industries represented in the preset gallery.
 * Useful for populating industry filter dropdowns.
 */
export function getAvailableIndustries(): string[] {
  const industries = new Set(SITE_PRESETS.map((p) => p.industry));
  return [...industries].sort();
}

/**
 * Returns all unique styles represented in the preset gallery.
 * Useful for populating style filter dropdowns.
 */
export function getAvailableStyles(): string[] {
  const styles = new Set(SITE_PRESETS.map((p) => p.style));
  return [...styles].sort();
}
