/**
 * generateAllConfigs.ts — One-call generator for all store configuration files.
 *
 * Orchestrates all four generators (store config, theme, templates, profile)
 * from a single WizardAnswers input. This is the primary entry point for
 * the wizard's "generate" action.
 *
 * How it connects to the system:
 * - Called by the wizard's review/submit step
 * - Returns all four outputs in one call
 * - The caller writes the JSON files to disk and registers the profile
 *
 * Usage:
 *   const result = generateAllConfigs(wizardAnswers);
 *   // Write result.storeConfig to stores/{storeId}/store.config.json
 *   // Write result.themeConfig to stores/{storeId}/themes/theme.json
 *   // Write result.templateConfig to stores/{storeId}/templates/templates.json
 *   // Register result.storeProfile with the storeProfileResolver
 */

import type { StoreProfile } from '@byb/core';
import type {
  WizardAnswers,
  StoreConfig,
  ThemeConfig,
  TemplatesConfig,
  ComponentDefaults,
} from './types.js';
import { generateStoreConfig } from './storeConfigGenerator.js';
import { generateThemeConfig, buildComponentDefaults } from './themeGenerator.js';
import { generateTemplateConfig } from './templateGenerator.js';
import { generateStoreProfile } from './storeProfileGenerator.js';

/**
 * The complete output of the config generation pipeline.
 */
export interface GeneratedConfigs {
  /** Store identity config → store.config.json */
  storeConfig: StoreConfig;
  /** Theme presets config → themes/theme.json */
  themeConfig: ThemeConfig;
  /** Page templates config → templates/templates.json */
  templateConfig: TemplatesConfig;
  /** Component style defaults (for storefront rendering) */
  componentDefaults: ComponentDefaults;
  /** Store profile for adapter resolution → storeProfileResolver */
  storeProfile: StoreProfile;
}

/**
 * Generates all store configuration files from wizard answers.
 *
 * This is the main entry point — call this once after the wizard completes
 * to get all the config objects needed to set up a new store.
 *
 * @param answers - The complete wizard answers
 * @returns All generated configs + the store profile
 *
 * @example
 * const { storeConfig, themeConfig, templateConfig, storeProfile } =
 *   generateAllConfigs(wizardAnswers);
 *
 * // Write to disk
 * writeJson(`stores/${storeConfig.storeId}/store.config.json`, storeConfig);
 * writeJson(`stores/${storeConfig.storeId}/themes/theme.json`, themeConfig);
 * writeJson(`stores/${storeConfig.storeId}/templates/templates.json`, templateConfig);
 *
 * // Register profile for adapter resolution
 * profileResolver.addProfile(storeProfile);
 */
export function generateAllConfigs(answers: WizardAnswers): GeneratedConfigs {
  return {
    storeConfig: generateStoreConfig(answers),
    themeConfig: generateThemeConfig(answers),
    templateConfig: generateTemplateConfig(answers),
    componentDefaults: buildComponentDefaults(answers),
    storeProfile: generateStoreProfile(answers),
  };
}
