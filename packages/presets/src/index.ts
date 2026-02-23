/**
 * @byb/presets — Curated site preset gallery for the onboarding wizard.
 *
 * Provides a library of industry-specific full-site presets that bundle
 * theme (colors, fonts, hero style) + layout (pages, sections) + component
 * defaults into one-click starting points.
 *
 * The wizard UI uses this to:
 * - Display a visual preset gallery with previews
 * - Filter presets by industry or visual style
 * - Apply a preset to pre-fill the branding and layout wizard steps
 *
 * Usage:
 *   import { listPresets, filterPresets, applyPreset } from '@byb/presets';
 *
 *   const fashionPresets = filterPresets({ industry: 'fashion' });
 *   const applied = applyPreset('elegant-fashion');
 *   wizard.updateStep('branding', applied.branding);
 *   wizard.updateStep('layout', applied.layout);
 */

// Types
export type {
  SitePreset,
  PresetIndustry,
  PresetStyle,
  PresetFilter,
} from './presetTypes.js';

// Preset definitions
export { SITE_PRESETS, PRESET_COUNT } from './presetDefinitions.js';

// Gallery API
export {
  listPresets,
  getPreset,
  filterPresets,
  applyPreset,
  getAvailableIndustries,
  getAvailableStyles,
  type AppliedPreset,
} from './presetGallery.js';
