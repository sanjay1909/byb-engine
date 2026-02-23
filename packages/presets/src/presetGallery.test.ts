/**
 * Tests for presetGallery.ts and presetDefinitions.ts
 *
 * Covers:
 * - Preset library integrity (all presets have required fields)
 * - listPresets() returns all presets
 * - getPreset() finds by ID
 * - filterPresets() by industry, style, search text, and combinations
 * - applyPreset() returns branding + layout for wizard
 * - getAvailableIndustries() and getAvailableStyles() return unique values
 * - Preset branding fields are valid for the wizard's step validator
 * - Scenario: apply charming-cherubs-like preset (playful-kids)
 */
import { describe, it, expect } from 'vitest';
import {
  listPresets,
  getPreset,
  filterPresets,
  applyPreset,
  getAvailableIndustries,
  getAvailableStyles,
} from './presetGallery.js';
import { SITE_PRESETS, PRESET_COUNT } from './presetDefinitions.js';

describe('presetDefinitions', () => {
  it('has at least 10 presets', () => {
    expect(PRESET_COUNT).toBeGreaterThanOrEqual(10);
  });

  it('every preset has a unique ID', () => {
    const ids = SITE_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every preset has required fields', () => {
    for (const preset of SITE_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.label).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(preset.industry).toBeTruthy();
      expect(preset.style).toBeTruthy();
      expect(preset.branding).toBeDefined();
      expect(preset.layout).toBeDefined();
      expect(preset.componentDefaults).toBeDefined();
    }
  });

  it('every preset has valid hex colors in branding', () => {
    const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
    for (const preset of SITE_PRESETS) {
      expect(preset.branding.primaryColor).toMatch(hexRegex);
      expect(preset.branding.secondaryColor).toMatch(hexRegex);
      if (preset.branding.backgroundColor) {
        expect(preset.branding.backgroundColor).toMatch(hexRegex);
      }
    }
  });

  it('every preset has home page enabled in layout', () => {
    for (const preset of SITE_PRESETS) {
      const homePage = preset.layout.pages.find((p) => p.pageId === 'home');
      expect(homePage).toBeDefined();
      expect(homePage!.enabled).toBe(true);
    }
  });

  it('every preset has valid component defaults', () => {
    for (const preset of SITE_PRESETS) {
      expect(['solid', 'outline', 'ghost', 'pill']).toContain(
        preset.componentDefaults.button,
      );
      expect(['flat', 'bordered', 'elevated']).toContain(
        preset.componentDefaults.card,
      );
      expect(['default', 'filled', 'underline']).toContain(
        preset.componentDefaults.input,
      );
    }
  });
});

describe('listPresets', () => {
  it('returns all presets', () => {
    const presets = listPresets();
    expect(presets.length).toBe(PRESET_COUNT);
  });

  it('returns the same reference (immutable)', () => {
    expect(listPresets()).toBe(listPresets());
  });
});

describe('getPreset', () => {
  it('finds a preset by ID', () => {
    const preset = getPreset('playful-kids');
    expect(preset).toBeDefined();
    expect(preset!.label).toBe('Playful Kids');
  });

  it('returns undefined for unknown ID', () => {
    expect(getPreset('nonexistent')).toBeUndefined();
  });

  it('finds the clean-starter preset', () => {
    const preset = getPreset('clean-starter');
    expect(preset).toBeDefined();
    expect(preset!.industry).toBe('general');
  });
});

describe('filterPresets', () => {
  it('filters by industry', () => {
    const fashion = filterPresets({ industry: 'fashion' });
    expect(fashion.length).toBeGreaterThanOrEqual(2);
    expect(fashion.every((p) => p.industry === 'fashion')).toBe(true);
  });

  it('filters by style', () => {
    const minimal = filterPresets({ style: 'minimal' });
    expect(minimal.length).toBeGreaterThanOrEqual(1);
    expect(minimal.every((p) => p.style === 'minimal')).toBe(true);
  });

  it('filters by search text (label)', () => {
    const results = filterPresets({ search: 'kids' });
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].id).toBe('playful-kids');
  });

  it('filters by search text (description)', () => {
    const results = filterPresets({ search: 'skincare' });
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].industry).toBe('beauty');
  });

  it('search is case-insensitive', () => {
    const upper = filterPresets({ search: 'FASHION' });
    const lower = filterPresets({ search: 'fashion' });
    expect(upper.length).toBe(lower.length);
  });

  it('combines multiple filters (AND)', () => {
    const results = filterPresets({
      industry: 'fashion',
      style: 'bold',
    });
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.every((p) => p.industry === 'fashion')).toBe(true);
    expect(results.every((p) => p.style === 'bold')).toBe(true);
  });

  it('returns empty array when no matches', () => {
    const results = filterPresets({
      industry: 'fashion',
      style: 'rustic',
    });
    expect(results).toEqual([]);
  });

  it('returns all presets when no filters applied', () => {
    const results = filterPresets({});
    expect(results.length).toBe(PRESET_COUNT);
  });
});

describe('applyPreset', () => {
  it('returns branding and layout for a valid preset', () => {
    const applied = applyPreset('playful-kids');
    expect(applied).toBeDefined();
    expect(applied!.presetId).toBe('playful-kids');
    expect(applied!.branding.primaryColor).toBe('#171717');
    expect(applied!.branding.secondaryColor).toBe('#f3e8ff');
    expect(applied!.layout.pages.length).toBeGreaterThanOrEqual(1);
  });

  it('returns undefined for unknown preset', () => {
    expect(applyPreset('nonexistent')).toBeUndefined();
  });

  it('returns a copy (does not leak internal state)', () => {
    const a = applyPreset('clean-starter');
    const b = applyPreset('clean-starter');
    expect(a).not.toBe(b);
    expect(a!.branding).not.toBe(b!.branding);
    expect(a!.layout.pages).not.toBe(b!.layout.pages);
  });

  it('applied branding matches preset branding', () => {
    const preset = getPreset('elegant-fashion')!;
    const applied = applyPreset('elegant-fashion')!;

    expect(applied.branding.primaryColor).toBe(preset.branding.primaryColor);
    expect(applied.branding.displayFont).toBe(preset.branding.displayFont);
    expect(applied.branding.heroStyle).toBe(preset.branding.heroStyle);
  });

  it('applied layout matches preset layout', () => {
    const preset = getPreset('modern-tech')!;
    const applied = applyPreset('modern-tech')!;

    expect(applied.layout.pages.length).toBe(preset.layout.pages.length);
    expect(applied.layout.pages[0].pageId).toBe('home');
  });
});

describe('getAvailableIndustries', () => {
  it('returns all unique industries', () => {
    const industries = getAvailableIndustries();
    expect(industries.length).toBeGreaterThanOrEqual(6);
    expect(industries).toContain('fashion');
    expect(industries).toContain('food');
    expect(industries).toContain('electronics');
    expect(industries).toContain('beauty');
    expect(industries).toContain('kids');
    expect(industries).toContain('general');
  });

  it('returns sorted values', () => {
    const industries = getAvailableIndustries();
    const sorted = [...industries].sort();
    expect(industries).toEqual(sorted);
  });

  it('has no duplicates', () => {
    const industries = getAvailableIndustries();
    expect(new Set(industries).size).toBe(industries.length);
  });
});

describe('getAvailableStyles', () => {
  it('returns all unique styles', () => {
    const styles = getAvailableStyles();
    expect(styles.length).toBeGreaterThanOrEqual(5);
    expect(styles).toContain('minimal');
    expect(styles).toContain('bold');
    expect(styles).toContain('elegant');
  });

  it('returns sorted values', () => {
    const styles = getAvailableStyles();
    const sorted = [...styles].sort();
    expect(styles).toEqual(sorted);
  });
});

describe('scenario: charming cherubs style preset', () => {
  it('playful-kids preset matches charming cherubs branding', () => {
    const preset = getPreset('playful-kids')!;
    expect(preset.branding.primaryColor).toBe('#171717');
    expect(preset.branding.secondaryColor).toBe('#f3e8ff');
    expect(preset.branding.backgroundColor).toBe('#fff6fb');
    expect(preset.branding.displayFont).toBe('Cinzel');
    expect(preset.branding.bodyFont).toBe('Poppins');
    expect(preset.branding.heroStyle).toBe('blob');
  });

  it('playful-kids has 3 pages + blog', () => {
    const preset = getPreset('playful-kids')!;
    expect(preset.layout.pages).toHaveLength(3);
    expect(preset.layout.includeBlog).toBe(true);
  });
});
