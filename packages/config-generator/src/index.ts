/**
 * @byb/config-generator — Transforms wizard answers into store configs.
 *
 * This package is the bridge between the onboarding wizard UI and the
 * engine's config file system. It takes wizard answers and produces:
 *
 * 1. store.config.json — Store identity, shipping, socials
 * 2. theme.json — Theme presets with brand colors and typography
 * 3. templates.json — Page layouts with section definitions
 * 4. StoreProfile — Adapter selections + feature flags for @byb/core
 *
 * The generated configs are written to the store's directory:
 *   stores/{storeId}/store.config.json
 *   stores/{storeId}/themes/theme.json
 *   stores/{storeId}/templates/templates.json
 *
 * The StoreProfile is registered with the storeProfileResolver so the
 * provisioning system knows which cloud adapters to use.
 *
 * Usage:
 *   import { generateAllConfigs } from '@byb/config-generator';
 *   const { storeConfig, themeConfig, templateConfig, storeProfile } =
 *     generateAllConfigs(wizardAnswers);
 */

// Types
export type {
  WizardAnswers,
  WizardBusinessInfo,
  WizardShippingRules,
  WizardBranding,
  WizardLayout,
  WizardFeatures,
  WizardCloudTarget,
  StoreConfig,
  ThemeConfig,
  ThemePreset,
  ThemeOverride,
  ThemeSchedule,
  TemplatesConfig,
  PageTemplate,
  TemplateSection,
  ComponentDefaults,
  ShippingRules,
  StoreSocials,
  HeroImages,
} from './types.js';

// Store config generator
export { generateStoreConfig } from './storeConfigGenerator.js';

// Theme generator
export {
  generateThemeConfig,
  buildComponentDefaults,
  lightenColor,
  darkenColor,
} from './themeGenerator.js';

// Template generator
export { generateTemplateConfig } from './templateGenerator.js';

// Store profile generator
export {
  generateStoreProfile,
  getSupportedCloudProviders,
  getAdapterSelectionsForProvider,
} from './storeProfileGenerator.js';

// Convenience: generate all configs at once
export { generateAllConfigs, type GeneratedConfigs } from './generateAllConfigs.js';
