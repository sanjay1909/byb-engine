/**
 * themeGenerator.ts — Generates theme.json from wizard branding answers.
 *
 * Takes the branding preferences (colors, fonts, styles) from the wizard
 * and produces a ThemeConfig object matching the engine's runtime format.
 *
 * How it connects to the system:
 * - Input: WizardAnswers (branding section)
 * - Output: ThemeConfig (written to stores/{storeId}/themes/theme.json)
 * - The engine's frontend loads this via Vite's __STORE_THEME__
 * - ThemeProvider reads presets and applies overrides as CSS variables
 *
 * Design decisions:
 * - Creates a single "default" preset from the wizard's branding choices
 * - The preset contains overrides for colors, typography, and hero styling
 * - No schedules by default (user can add them in the admin dashboard later)
 * - Instant activation is enabled with the default theme
 * - Color derivation: generates surface, muted, border from primary/secondary
 */

import type {
  WizardAnswers,
  ThemeConfig,
  ThemePreset,
  ThemeOverride,
  ComponentDefaults,
} from './types.js';

/**
 * Default component style preferences.
 * Used as the baseline when the wizard doesn't specify all style choices.
 */
const DEFAULT_COMPONENT_DEFAULTS: ComponentDefaults = {
  button: 'solid',
  card: 'elevated',
  input: 'filled',
  checkbox: 'rounded',
  toggle: 'ios',
  badge: 'filled',
};

/**
 * Default fonts when the wizard doesn't specify.
 */
const DEFAULT_FONTS = {
  display: 'Cinzel',
  body: 'Poppins',
  handwritten: 'Caveat',
};

/**
 * Derives a lighter shade of a hex color by blending with white.
 * Used to generate surface/muted colors from the primary or background color.
 *
 * @param hex - The hex color (e.g., '#171717')
 * @param factor - How much to lighten (0 = no change, 1 = pure white)
 * @returns A lightened hex color
 */
export function lightenColor(hex: string, factor: number): string {
  // Remove # prefix
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);

  const newR = Math.round(r + (255 - r) * factor);
  const newG = Math.round(g + (255 - g) * factor);
  const newB = Math.round(b + (255 - b) * factor);

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Derives a darker shade of a hex color by blending towards black.
 *
 * @param hex - The hex color
 * @param factor - How much to darken (0 = no change, 1 = pure black)
 * @returns A darkened hex color
 */
export function darkenColor(hex: string, factor: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);

  const newR = Math.round(r * (1 - factor));
  const newG = Math.round(g * (1 - factor));
  const newB = Math.round(b * (1 - factor));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Builds a ThemeOverride from the wizard's branding choices.
 * This contains the custom values that differ from the engine's built-in defaults.
 */
function buildThemeOverride(answers: WizardAnswers): ThemeOverride {
  const { branding } = answers;
  const override: ThemeOverride = {};

  // Typography overrides
  const displayFont = branding.displayFont ?? DEFAULT_FONTS.display;
  const bodyFont = branding.bodyFont ?? DEFAULT_FONTS.body;

  override.typography = {
    fonts: {
      display: displayFont,
      body: bodyFont,
      handwritten: DEFAULT_FONTS.handwritten,
    },
  };

  // Hero styling based on primary/secondary colors
  const bgColor = branding.backgroundColor ?? '#ffffff';
  override.hero = {
    background: bgColor,
    titleColor: branding.primaryColor,
    subtitleColor: darkenColor(branding.secondaryColor, 0.2),
    accentColor: branding.secondaryColor,
  };

  // Gradient overrides from primary/secondary
  override.gradients = {
    primary: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})`,
  };

  // Studio overrides for frame/background styling
  if (branding.heroStyle) {
    const frameStyle =
      branding.heroStyle === 'blob'
        ? 'blob1'
        : branding.heroStyle === 'classic'
          ? 'rounded'
          : branding.heroStyle;
    override.studio = {
      backgroundStyle: 'clean',
      frames: {
        hero: {
          style: frameStyle,
          color: branding.secondaryColor,
        },
        product: {
          style: 'rounded',
          color: lightenColor(branding.secondaryColor, 0.3),
        },
      },
    };
  }

  return override;
}

/**
 * Builds component defaults, using wizard preferences where specified.
 */
export function buildComponentDefaults(
  answers: WizardAnswers,
): ComponentDefaults {
  return {
    ...DEFAULT_COMPONENT_DEFAULTS,
    ...(answers.branding.buttonStyle && {
      button: answers.branding.buttonStyle,
    }),
    ...(answers.branding.cardStyle && { card: answers.branding.cardStyle }),
  };
}

/**
 * Generates a ThemeConfig from wizard answers.
 *
 * Creates a "default" preset with overrides derived from the branding choices,
 * enables instant activation, and starts with no schedules.
 *
 * @param answers - The complete wizard answers
 * @returns A ThemeConfig ready to be serialized to theme.json
 *
 * @example
 * const theme = generateThemeConfig({
 *   branding: { primaryColor: '#171717', secondaryColor: '#f3e8ff' },
 *   ...
 * });
 * // → { presets: [{ id: 'default', ... }], instant: { enabled: true, themeId: 'default' } }
 */
export function generateThemeConfig(answers: WizardAnswers): ThemeConfig {
  const now = new Date().toISOString();
  const override = buildThemeOverride(answers);

  const defaultPreset: ThemePreset = {
    id: 'default',
    label: `${answers.business.storeName} Theme`,
    overrides: override,
    updatedAt: now,
  };

  return {
    presets: [defaultPreset],
    schedules: [],
    instant: {
      enabled: true,
      themeId: 'default',
    },
    updatedAt: now,
  };
}
