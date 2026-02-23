/**
 * presetTypes.ts — Types for the template preset gallery.
 *
 * A "preset" is a complete site starting point that bundles:
 * - Theme overrides (colors, fonts, hero style)
 * - Component defaults (button, card, input styles)
 * - Page layout (which pages and sections to include)
 * - Metadata (industry, style, description, preview image)
 *
 * How it connects to the system:
 * - The wizard's branding + layout steps can offer presets as starting points
 * - Selecting a preset pre-fills the WizardAnswers with the preset's values
 * - The user can further customize after selecting a preset
 * - Presets are static data — no API calls, no database lookups
 *
 * Design decisions:
 * - Each preset has a unique ID and a human-readable label
 * - Presets are tagged with industry and style for filtering/search
 * - The branding/layout fields match WizardBranding and WizardLayout types
 *   so they can be directly applied to wizard state
 * - Presets don't include business info, shipping, features, or cloud —
 *   those are always user-specific
 */

import type {
  WizardBranding,
  WizardLayout,
  ComponentDefaults,
} from '@byb/config-generator';

/**
 * Industry categories for preset tagging.
 * Used to filter presets in the wizard's preset gallery.
 */
export type PresetIndustry =
  | 'fashion'
  | 'food'
  | 'electronics'
  | 'home'
  | 'beauty'
  | 'kids'
  | 'sports'
  | 'art'
  | 'general';

/**
 * Visual style categories for preset tagging.
 */
export type PresetStyle =
  | 'minimal'
  | 'bold'
  | 'elegant'
  | 'playful'
  | 'modern'
  | 'classic'
  | 'rustic';

/**
 * A complete site preset — bundles theme + layout + metadata.
 */
export interface SitePreset {
  /** Unique preset identifier (e.g., 'elegant-fashion') */
  id: string;
  /** Human-readable preset name (e.g., 'Elegant Fashion') */
  label: string;
  /** Short description shown in the gallery (1-2 sentences) */
  description: string;
  /** Industry tag for filtering */
  industry: PresetIndustry;
  /** Visual style tag for filtering */
  style: PresetStyle;
  /** Preview image URL (relative path or CDN URL) */
  previewImage?: string;
  /** Branding values — maps directly to WizardBranding */
  branding: WizardBranding;
  /** Layout values — maps directly to WizardLayout */
  layout: WizardLayout;
  /** Component style defaults */
  componentDefaults: ComponentDefaults;
}

/**
 * Filter criteria for browsing the preset gallery.
 */
export interface PresetFilter {
  /** Filter by industry */
  industry?: PresetIndustry;
  /** Filter by visual style */
  style?: PresetStyle;
  /** Free-text search across label and description */
  search?: string;
}
