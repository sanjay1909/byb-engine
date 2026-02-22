/**
 * Tests for themeGenerator.ts
 *
 * Covers:
 * - Creates a default preset from branding choices
 * - Derives typography overrides from font selections
 * - Derives hero color overrides from primary/secondary colors
 * - Generates gradient overrides
 * - Maps hero style to studio frame style
 * - Defaults to engine fonts when not specified
 * - Component defaults merge wizard choices with engine defaults
 * - Instant activation is enabled with 'default' theme
 * - No schedules by default
 * - Color utility functions (lighten/darken)
 */
import { describe, it, expect } from 'vitest';
import {
  generateThemeConfig,
  buildComponentDefaults,
  lightenColor,
  darkenColor,
} from './themeGenerator.js';
import type { WizardAnswers } from './types.js';

function createMinimalAnswers(
  overrides?: Partial<WizardAnswers>,
): WizardAnswers {
  return {
    business: {
      storeId: 'test-store',
      storeName: 'Test Store',
      siteUrl: 'https://teststore.com',
      supportEmail: 'help@teststore.com',
      currency: 'usd',
      ...overrides?.business,
    },
    shipping: {
      type: 'flat',
      flatRate: 10,
      ...overrides?.shipping,
    },
    branding: {
      primaryColor: '#171717',
      secondaryColor: '#f3e8ff',
      ...overrides?.branding,
    },
    layout: {
      pages: [{ pageId: 'home', label: 'Home', enabled: true }],
      ...overrides?.layout,
    },
    features: {
      blog: true,
      campaigns: false,
      payments: 'stripe',
      analytics: true,
      oe: false,
      ...overrides?.features,
    },
    cloud: {
      provider: 'aws',
      region: 'us-east-1',
      ...overrides?.cloud,
    },
  };
}

describe('generateThemeConfig', () => {
  it('creates a single default preset', () => {
    const theme = generateThemeConfig(createMinimalAnswers());

    expect(theme.presets).toHaveLength(1);
    expect(theme.presets[0].id).toBe('default');
    expect(theme.presets[0].label).toBe('Test Store Theme');
  });

  it('derives typography overrides from font selections', () => {
    const theme = generateThemeConfig(
      createMinimalAnswers({
        branding: {
          primaryColor: '#000',
          secondaryColor: '#fff',
          displayFont: 'Playfair Display',
          bodyFont: 'Inter',
        },
      }),
    );

    const fonts = theme.presets[0].overrides.typography?.fonts;
    expect(fonts?.display).toBe('Playfair Display');
    expect(fonts?.body).toBe('Inter');
    expect(fonts?.handwritten).toBe('Caveat'); // always default
  });

  it('uses default fonts when not specified', () => {
    const theme = generateThemeConfig(createMinimalAnswers());
    const fonts = theme.presets[0].overrides.typography?.fonts;

    expect(fonts?.display).toBe('Cinzel');
    expect(fonts?.body).toBe('Poppins');
  });

  it('derives hero colors from primary/secondary', () => {
    const theme = generateThemeConfig(
      createMinimalAnswers({
        branding: {
          primaryColor: '#ff0000',
          secondaryColor: '#00ff00',
          backgroundColor: '#fafafa',
        },
      }),
    );

    const hero = theme.presets[0].overrides.hero;
    expect(hero?.titleColor).toBe('#ff0000');
    expect(hero?.accentColor).toBe('#00ff00');
    expect(hero?.background).toBe('#fafafa');
  });

  it('defaults background to white when not specified', () => {
    const theme = generateThemeConfig(
      createMinimalAnswers({
        branding: { primaryColor: '#000', secondaryColor: '#fff' },
      }),
    );

    expect(theme.presets[0].overrides.hero?.background).toBe('#ffffff');
  });

  it('generates gradient from primary → secondary', () => {
    const theme = generateThemeConfig(
      createMinimalAnswers({
        branding: { primaryColor: '#aa0000', secondaryColor: '#00aa00' },
      }),
    );

    const gradient = theme.presets[0].overrides.gradients?.primary;
    expect(gradient).toContain('#aa0000');
    expect(gradient).toContain('#00aa00');
    expect(gradient).toContain('linear-gradient');
  });

  it('maps blob heroStyle to blob1 frame style', () => {
    const theme = generateThemeConfig(
      createMinimalAnswers({
        branding: {
          primaryColor: '#000',
          secondaryColor: '#ccc',
          heroStyle: 'blob',
        },
      }),
    );

    const studio = theme.presets[0].overrides.studio;
    expect(studio?.frames?.hero?.style).toBe('blob1');
  });

  it('maps classic heroStyle to rounded frame style', () => {
    const theme = generateThemeConfig(
      createMinimalAnswers({
        branding: {
          primaryColor: '#000',
          secondaryColor: '#ccc',
          heroStyle: 'classic',
        },
      }),
    );

    expect(theme.presets[0].overrides.studio?.frames?.hero?.style).toBe(
      'rounded',
    );
  });

  it('does not include studio when heroStyle is not specified', () => {
    const theme = generateThemeConfig(
      createMinimalAnswers({
        branding: { primaryColor: '#000', secondaryColor: '#fff' },
      }),
    );

    expect(theme.presets[0].overrides.studio).toBeUndefined();
  });

  it('enables instant activation with default theme', () => {
    const theme = generateThemeConfig(createMinimalAnswers());

    expect(theme.instant.enabled).toBe(true);
    expect(theme.instant.themeId).toBe('default');
  });

  it('starts with no schedules', () => {
    const theme = generateThemeConfig(createMinimalAnswers());
    expect(theme.schedules).toEqual([]);
  });

  it('sets updatedAt on preset and config', () => {
    const before = new Date().toISOString();
    const theme = generateThemeConfig(createMinimalAnswers());
    const after = new Date().toISOString();

    // updatedAt should be between before and after
    expect(theme.updatedAt >= before).toBe(true);
    expect(theme.updatedAt <= after).toBe(true);
    expect(theme.presets[0].updatedAt >= before).toBe(true);
  });
});

describe('buildComponentDefaults', () => {
  it('uses wizard button style when provided', () => {
    const defaults = buildComponentDefaults(
      createMinimalAnswers({
        branding: {
          primaryColor: '#000',
          secondaryColor: '#fff',
          buttonStyle: 'pill',
        },
      }),
    );
    expect(defaults.button).toBe('pill');
  });

  it('uses wizard card style when provided', () => {
    const defaults = buildComponentDefaults(
      createMinimalAnswers({
        branding: {
          primaryColor: '#000',
          secondaryColor: '#fff',
          cardStyle: 'bordered',
        },
      }),
    );
    expect(defaults.card).toBe('bordered');
  });

  it('falls back to engine defaults for unspecified styles', () => {
    const defaults = buildComponentDefaults(createMinimalAnswers());

    expect(defaults.button).toBe('solid');
    expect(defaults.card).toBe('elevated');
    expect(defaults.input).toBe('filled');
    expect(defaults.checkbox).toBe('rounded');
    expect(defaults.toggle).toBe('ios');
    expect(defaults.badge).toBe('filled');
  });
});

describe('lightenColor', () => {
  it('lightens black towards white', () => {
    const result = lightenColor('#000000', 0.5);
    expect(result).toBe('#808080');
  });

  it('returns white at factor 1', () => {
    expect(lightenColor('#000000', 1)).toBe('#ffffff');
  });

  it('returns same color at factor 0', () => {
    expect(lightenColor('#ff0000', 0)).toBe('#ff0000');
  });
});

describe('darkenColor', () => {
  it('darkens white towards black', () => {
    const result = darkenColor('#ffffff', 0.5);
    expect(result).toBe('#808080');
  });

  it('returns black at factor 1', () => {
    expect(darkenColor('#ffffff', 1)).toBe('#000000');
  });

  it('returns same color at factor 0', () => {
    expect(darkenColor('#ff0000', 0)).toBe('#ff0000');
  });
});
