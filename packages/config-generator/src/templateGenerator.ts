/**
 * templateGenerator.ts — Generates templates.json from wizard layout answers.
 *
 * Takes the layout preferences (which pages to include, what sections each page
 * should have) and produces a TemplatesConfig matching the engine's runtime format.
 *
 * How it connects to the system:
 * - Input: WizardAnswers (layout section)
 * - Output: TemplatesConfig (written to stores/{storeId}/templates/templates.json)
 * - The engine's frontend loads this via Vite's __STORE_TEMPLATES__
 * - TemplateRenderer reads per-page layouts and renders section components
 *
 * Design decisions:
 * - Each page gets a sensible default layout based on its pageId
 * - Home page always gets: header, hero, features, featured products, new arrivals, footer
 * - Story page gets: header + content sections
 * - Contact page gets: header, hero, contact info
 * - Blog page gets: header, blog list, footer (if blog feature is enabled)
 * - Additional custom pages get a generic header + content + footer layout
 * - All sections start enabled — user can disable them in the admin dashboard
 */

import type {
  WizardAnswers,
  TemplatesConfig,
  PageTemplate,
  TemplateSection,
} from './types.js';

/**
 * Default section layouts for known page types.
 * Each function returns an array of sections for that page.
 */
const PAGE_SECTION_BUILDERS: Record<
  string,
  (pageId: string) => TemplateSection[]
> = {
  home: (pageId) => [
    { id: `${pageId}-header`, type: 'home-header', enabled: true },
    { id: `${pageId}-hero`, type: 'home-hero', enabled: true },
    { id: `${pageId}-features`, type: 'home-features', enabled: true },
    { id: `${pageId}-featured`, type: 'home-featured', enabled: true },
    {
      id: `${pageId}-new-arrivals`,
      type: 'home-new-arrivals',
      enabled: true,
    },
    { id: 'site-footer', type: 'site-footer', enabled: true },
  ],

  story: (pageId) => [
    { id: `${pageId}-header`, type: 'story-header', enabled: true },
    { id: `${pageId}-content`, type: 'story-content', enabled: true },
  ],

  contact: (pageId) => [
    { id: `${pageId}-header`, type: 'contact-header', enabled: true },
    { id: `${pageId}-hero`, type: 'contact-hero', enabled: true },
    { id: `${pageId}-info`, type: 'contact-info', enabled: true },
  ],

  blog: (pageId) => [
    { id: `${pageId}-header`, type: 'blog-header', enabled: true },
    { id: `${pageId}-list`, type: 'blog-list', enabled: true },
    { id: 'site-footer', type: 'site-footer', enabled: true },
  ],
};

/**
 * Generates a generic layout for unknown page types.
 * Falls back to a simple header + content + footer structure.
 */
function buildGenericPageLayout(pageId: string): TemplateSection[] {
  return [
    { id: `${pageId}-header`, type: `${pageId}-header`, enabled: true },
    { id: `${pageId}-content`, type: `${pageId}-content`, enabled: true },
    { id: 'site-footer', type: 'site-footer', enabled: true },
  ];
}

/**
 * Builds the layout for a single page based on its pageId.
 * Uses the known section builders for standard pages, or a generic layout for custom pages.
 */
function buildPageLayout(pageId: string): TemplateSection[] {
  const builder = PAGE_SECTION_BUILDERS[pageId];
  return builder ? builder(pageId) : buildGenericPageLayout(pageId);
}

/**
 * Generates a TemplatesConfig from wizard answers.
 *
 * Creates page templates for each enabled page in the wizard's layout choices.
 * Automatically adds blog, story, and contact pages based on feature/layout flags.
 *
 * @param answers - The complete wizard answers
 * @returns A TemplatesConfig ready to be serialized to templates.json
 *
 * @example
 * const templates = generateTemplateConfig({
 *   layout: {
 *     pages: [{ pageId: 'home', label: 'Home', enabled: true }],
 *     includeBlog: true,
 *     includeContact: true,
 *   },
 *   features: { blog: true, ... },
 *   ...
 * });
 */
export function generateTemplateConfig(
  answers: WizardAnswers,
): TemplatesConfig {
  const now = new Date().toISOString();
  const { layout, features } = answers;
  const pages: PageTemplate[] = [];

  // Track which pageIds we've already added (to avoid duplicates)
  const addedPages = new Set<string>();

  // 1. Add explicitly listed pages from wizard layout
  for (const page of layout.pages) {
    if (!page.enabled) continue;
    if (addedPages.has(page.pageId)) continue;

    pages.push({
      pageId: page.pageId,
      label: page.label,
      layout: buildPageLayout(page.pageId),
      updatedAt: now,
    });
    addedPages.add(page.pageId);
  }

  // 2. Auto-add standard pages based on flags (if not already present)
  if (layout.includeStory && !addedPages.has('story')) {
    pages.push({
      pageId: 'story',
      label: 'Our Story',
      layout: buildPageLayout('story'),
      updatedAt: now,
    });
    addedPages.add('story');
  }

  if (layout.includeContact && !addedPages.has('contact')) {
    pages.push({
      pageId: 'contact',
      label: 'Contact',
      layout: buildPageLayout('contact'),
      updatedAt: now,
    });
    addedPages.add('contact');
  }

  // Blog page is only added if the blog feature is enabled AND layout requests it
  if (layout.includeBlog && features.blog && !addedPages.has('blog')) {
    pages.push({
      pageId: 'blog',
      label: 'Blog',
      layout: buildPageLayout('blog'),
      updatedAt: now,
    });
    addedPages.add('blog');
  }

  return {
    pages,
    updatedAt: now,
  };
}
