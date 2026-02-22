/**
 * storeConfigGenerator.ts — Generates store.config.json from wizard answers.
 *
 * Takes the business info, shipping, and feature selections from the wizard
 * and produces a StoreConfig object matching the engine's runtime format.
 *
 * How it connects to the system:
 * - Input: WizardAnswers (business + shipping sections)
 * - Output: StoreConfig (written to stores/{storeId}/store.config.json)
 * - The engine's frontend loads this at build time via Vite's __STORE_CONFIG__
 * - The backend reads it for email routing, order processing, etc.
 *
 * Design decisions:
 * - sesFromEmail defaults to supportEmail (can be overridden later)
 * - internalOrdersEmail defaults to supportEmail
 * - heroImages starts empty — populated later by the theme/hero editor
 * - apiBaseUrl is left undefined — set during cloud provisioning
 */

import type { WizardAnswers, StoreConfig } from './types.js';

/**
 * Generates a StoreConfig from wizard answers.
 *
 * @param answers - The complete wizard answers
 * @returns A StoreConfig ready to be serialized to store.config.json
 *
 * @example
 * const config = generateStoreConfig({
 *   business: { storeId: 'my-shop', storeName: 'My Shop', ... },
 *   shipping: { type: 'flat', flatRate: 10 },
 *   ...
 * });
 * // → { storeId: 'my-shop', storeName: 'My Shop', ... }
 */
export function generateStoreConfig(answers: WizardAnswers): StoreConfig {
  const { business, shipping } = answers;

  const config: StoreConfig = {
    storeId: business.storeId,
    storeName: business.storeName,
    siteUrl: business.siteUrl,
    supportEmail: business.supportEmail,
    currency: business.currency,
    shippingRules: {
      type: shipping.type,
    },
    // Default email addresses to supportEmail
    sesFromEmail: business.supportEmail,
    internalOrdersEmail: business.supportEmail,
    // Hero images start empty — wizard's branding step or hero editor populates these
    heroImages: {},
  };

  // Optional fields — only include if provided
  if (business.legalEntityName) {
    config.legalEntityName = business.legalEntityName;
  }

  if (business.supportPhone) {
    config.supportPhone = business.supportPhone;
  }

  if (business.socials && Object.keys(business.socials).length > 0) {
    config.socials = { ...business.socials };
  }

  // Shipping details
  if (shipping.flatRate !== undefined) {
    config.shippingRules.flatRate = shipping.flatRate;
  }
  if (shipping.freeOver !== undefined) {
    config.shippingRules.freeOver = shipping.freeOver;
  }

  return config;
}
