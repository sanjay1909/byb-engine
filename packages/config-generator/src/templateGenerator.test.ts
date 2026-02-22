/**
 * Tests for templateGenerator.ts
 *
 * Covers:
 * - Generates home page with standard sections (header, hero, features, etc.)
 * - Generates story page with header + content
 * - Generates contact page with header, hero, contact info
 * - Generates blog page when feature is enabled + layout requests it
 * - Skips blog page when feature is disabled
 * - Handles custom/unknown page types with generic layout
 * - Auto-adds story/contact pages from layout flags
 * - Skips disabled pages
 * - Avoids duplicate pages
 * - All sections start enabled
 */
import { describe, it, expect } from 'vitest';
import { generateTemplateConfig } from './templateGenerator.js';
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
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
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

describe('generateTemplateConfig', () => {
  it('generates home page with standard 6-section layout', () => {
    const templates = generateTemplateConfig(createMinimalAnswers());

    expect(templates.pages).toHaveLength(1);
    const home = templates.pages[0];
    expect(home.pageId).toBe('home');
    expect(home.label).toBe('Home');
    expect(home.layout).toHaveLength(6);

    const types = home.layout.map((s) => s.type);
    expect(types).toEqual([
      'home-header',
      'home-hero',
      'home-features',
      'home-featured',
      'home-new-arrivals',
      'site-footer',
    ]);
  });

  it('generates story page with header + content sections', () => {
    const templates = generateTemplateConfig(
      createMinimalAnswers({
        layout: {
          pages: [
            { pageId: 'home', label: 'Home', enabled: true },
            { pageId: 'story', label: 'Our Story', enabled: true },
          ],
        },
      }),
    );

    const story = templates.pages.find((p) => p.pageId === 'story');
    expect(story).toBeDefined();
    expect(story!.layout).toHaveLength(2);
    expect(story!.layout.map((s) => s.type)).toEqual([
      'story-header',
      'story-content',
    ]);
  });

  it('generates contact page with 3 sections', () => {
    const templates = generateTemplateConfig(
      createMinimalAnswers({
        layout: {
          pages: [
            { pageId: 'home', label: 'Home', enabled: true },
            { pageId: 'contact', label: 'Contact', enabled: true },
          ],
        },
      }),
    );

    const contact = templates.pages.find((p) => p.pageId === 'contact');
    expect(contact).toBeDefined();
    expect(contact!.layout.map((s) => s.type)).toEqual([
      'contact-header',
      'contact-hero',
      'contact-info',
    ]);
  });

  it('generates blog page when feature enabled and layout requests it', () => {
    const templates = generateTemplateConfig(
      createMinimalAnswers({
        layout: {
          pages: [{ pageId: 'home', label: 'Home', enabled: true }],
          includeBlog: true,
        },
        features: {
          blog: true,
          campaigns: false,
          payments: false,
          analytics: false,
          oe: false,
        },
      }),
    );

    const blog = templates.pages.find((p) => p.pageId === 'blog');
    expect(blog).toBeDefined();
    expect(blog!.layout.map((s) => s.type)).toEqual([
      'blog-header',
      'blog-list',
      'site-footer',
    ]);
  });

  it('skips blog page when feature is disabled', () => {
    const templates = generateTemplateConfig(
      createMinimalAnswers({
        layout: {
          pages: [{ pageId: 'home', label: 'Home', enabled: true }],
          includeBlog: true,
        },
        features: {
          blog: false,
          campaigns: false,
          payments: false,
          analytics: false,
          oe: false,
        },
      }),
    );

    const blog = templates.pages.find((p) => p.pageId === 'blog');
    expect(blog).toBeUndefined();
  });

  it('auto-adds story page from includeStory flag', () => {
    const templates = generateTemplateConfig(
      createMinimalAnswers({
        layout: {
          pages: [{ pageId: 'home', label: 'Home', enabled: true }],
          includeStory: true,
        },
      }),
    );

    expect(templates.pages).toHaveLength(2);
    expect(templates.pages[1].pageId).toBe('story');
    expect(templates.pages[1].label).toBe('Our Story');
  });

  it('auto-adds contact page from includeContact flag', () => {
    const templates = generateTemplateConfig(
      createMinimalAnswers({
        layout: {
          pages: [{ pageId: 'home', label: 'Home', enabled: true }],
          includeContact: true,
        },
      }),
    );

    expect(templates.pages).toHaveLength(2);
    expect(templates.pages[1].pageId).toBe('contact');
  });

  it('does not duplicate pages when listed and flagged', () => {
    const templates = generateTemplateConfig(
      createMinimalAnswers({
        layout: {
          pages: [
            { pageId: 'home', label: 'Home', enabled: true },
            { pageId: 'story', label: 'Our Story', enabled: true },
          ],
          includeStory: true, // also flagged
        },
      }),
    );

    const storyPages = templates.pages.filter((p) => p.pageId === 'story');
    expect(storyPages).toHaveLength(1);
  });

  it('skips disabled pages', () => {
    const templates = generateTemplateConfig(
      createMinimalAnswers({
        layout: {
          pages: [
            { pageId: 'home', label: 'Home', enabled: true },
            { pageId: 'story', label: 'Our Story', enabled: false },
          ],
        },
      }),
    );

    expect(templates.pages).toHaveLength(1);
    expect(templates.pages[0].pageId).toBe('home');
  });

  it('generates generic layout for unknown page types', () => {
    const templates = generateTemplateConfig(
      createMinimalAnswers({
        layout: {
          pages: [
            { pageId: 'home', label: 'Home', enabled: true },
            { pageId: 'faq', label: 'FAQ', enabled: true },
          ],
        },
      }),
    );

    const faq = templates.pages.find((p) => p.pageId === 'faq');
    expect(faq).toBeDefined();
    expect(faq!.layout).toHaveLength(3);
    expect(faq!.layout.map((s) => s.type)).toEqual([
      'faq-header',
      'faq-content',
      'site-footer',
    ]);
  });

  it('all sections start enabled', () => {
    const templates = generateTemplateConfig(
      createMinimalAnswers({
        layout: {
          pages: [
            { pageId: 'home', label: 'Home', enabled: true },
            { pageId: 'contact', label: 'Contact', enabled: true },
          ],
          includeBlog: true,
          includeStory: true,
        },
        features: {
          blog: true,
          campaigns: false,
          payments: false,
          analytics: false,
          oe: false,
        },
      }),
    );

    for (const page of templates.pages) {
      for (const section of page.layout) {
        expect(section.enabled).toBe(true);
      }
    }
  });

  it('sets updatedAt on pages and config', () => {
    const before = new Date().toISOString();
    const templates = generateTemplateConfig(createMinimalAnswers());
    const after = new Date().toISOString();

    expect(templates.updatedAt >= before).toBe(true);
    expect(templates.updatedAt <= after).toBe(true);
    expect(templates.pages[0].updatedAt >= before).toBe(true);
  });

  it('scenario: full charming-cherubs-like template config', () => {
    const templates = generateTemplateConfig(
      createMinimalAnswers({
        layout: {
          pages: [
            { pageId: 'home', label: 'Home', enabled: true },
            { pageId: 'story', label: 'Our Story', enabled: true },
            { pageId: 'contact', label: 'Contact', enabled: true },
          ],
        },
      }),
    );

    expect(templates.pages).toHaveLength(3);
    expect(templates.pages.map((p) => p.pageId)).toEqual([
      'home',
      'story',
      'contact',
    ]);

    // Home page matches the engine's default template structure
    const home = templates.pages[0];
    expect(home.layout).toHaveLength(6);
    expect(home.layout[0].type).toBe('home-header');
    expect(home.layout[1].type).toBe('home-hero');
    expect(home.layout[5].type).toBe('site-footer');
  });
});
