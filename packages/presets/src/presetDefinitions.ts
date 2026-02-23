/**
 * presetDefinitions.ts — Curated library of full-site presets.
 *
 * Each preset is a complete visual starting point for a new ecommerce store.
 * The wizard offers these as one-click options in the branding/layout steps,
 * pre-filling colors, fonts, hero style, pages, and component defaults.
 *
 * How it connects to the system:
 * - The preset gallery UI displays these with preview images and metadata
 * - Selecting a preset calls applyPreset() (in presetGallery.ts) to fill wizard state
 * - Users can customize any value after selecting a preset
 * - New presets are added here as the library grows
 *
 * Design decisions:
 * - Presets cover 6 industries with different visual styles
 * - Each preset defines a complete color palette, typography, and layout
 * - All presets include home page; optional pages vary by industry
 * - Hero styles are matched to the visual identity (blob for playful, classic for elegant)
 * - Component defaults (button/card styles) reinforce the visual theme
 */

import type { SitePreset } from './presetTypes.js';

/**
 * All available site presets, indexed for the gallery.
 * Add new presets here to expand the library.
 */
export const SITE_PRESETS: readonly SitePreset[] = [
  // ─── Fashion ──────────────────────────────────────────────────────
  {
    id: 'elegant-fashion',
    label: 'Elegant Fashion',
    description:
      'Sophisticated look with serif fonts and muted tones. Perfect for boutique clothing stores.',
    industry: 'fashion',
    style: 'elegant',
    branding: {
      primaryColor: '#1a1a2e',
      secondaryColor: '#e8d5c4',
      backgroundColor: '#faf7f5',
      displayFont: 'Playfair Display',
      bodyFont: 'Lato',
      buttonStyle: 'outline',
      cardStyle: 'bordered',
      heroStyle: 'classic',
    },
    layout: {
      pages: [
        { pageId: 'home', label: 'Home', enabled: true },
        { pageId: 'story', label: 'Our Story', enabled: true },
        { pageId: 'contact', label: 'Contact', enabled: true },
      ],
      includeBlog: true,
      includeStory: true,
      includeContact: true,
    },
    componentDefaults: {
      button: 'outline',
      card: 'bordered',
      input: 'underline',
      checkbox: 'square',
      toggle: 'ios',
      badge: 'outline',
    },
  },
  {
    id: 'bold-streetwear',
    label: 'Bold Streetwear',
    description:
      'High-contrast, urban aesthetic with bold typography. Great for streetwear and sneaker brands.',
    industry: 'fashion',
    style: 'bold',
    branding: {
      primaryColor: '#000000',
      secondaryColor: '#ff3b3b',
      backgroundColor: '#ffffff',
      displayFont: 'Oswald',
      bodyFont: 'Inter',
      buttonStyle: 'solid',
      cardStyle: 'flat',
      heroStyle: 'glow',
    },
    layout: {
      pages: [
        { pageId: 'home', label: 'Home', enabled: true },
        { pageId: 'contact', label: 'Contact', enabled: true },
      ],
      includeContact: true,
    },
    componentDefaults: {
      button: 'solid',
      card: 'flat',
      input: 'default',
      checkbox: 'square',
      toggle: 'material',
      badge: 'filled',
    },
  },

  // ─── Kids ─────────────────────────────────────────────────────────
  {
    id: 'playful-kids',
    label: 'Playful Kids',
    description:
      'Warm, playful design with soft colors and handwritten accents. Ideal for children\'s clothing and toys.',
    industry: 'kids',
    style: 'playful',
    branding: {
      primaryColor: '#171717',
      secondaryColor: '#f3e8ff',
      backgroundColor: '#fff6fb',
      displayFont: 'Cinzel',
      bodyFont: 'Poppins',
      buttonStyle: 'solid',
      cardStyle: 'elevated',
      heroStyle: 'blob',
    },
    layout: {
      pages: [
        { pageId: 'home', label: 'Home', enabled: true },
        { pageId: 'story', label: 'Our Story', enabled: true },
        { pageId: 'contact', label: 'Contact', enabled: true },
      ],
      includeBlog: true,
      includeStory: true,
      includeContact: true,
    },
    componentDefaults: {
      button: 'solid',
      card: 'elevated',
      input: 'filled',
      checkbox: 'rounded',
      toggle: 'ios',
      badge: 'filled',
    },
  },

  // ─── Food & Beverage ──────────────────────────────────────────────
  {
    id: 'rustic-food',
    label: 'Rustic Kitchen',
    description:
      'Earthy tones and handcrafted feel. Perfect for artisan food, bakeries, and farm-to-table brands.',
    industry: 'food',
    style: 'rustic',
    branding: {
      primaryColor: '#3d2c2e',
      secondaryColor: '#c9a96e',
      backgroundColor: '#fdf6ec',
      displayFont: 'Merriweather',
      bodyFont: 'Source Sans Pro',
      buttonStyle: 'solid',
      cardStyle: 'bordered',
      heroStyle: 'sunflower',
    },
    layout: {
      pages: [
        { pageId: 'home', label: 'Home', enabled: true },
        { pageId: 'story', label: 'Our Story', enabled: true },
        { pageId: 'contact', label: 'Contact', enabled: true },
      ],
      includeBlog: true,
      includeStory: true,
      includeContact: true,
    },
    componentDefaults: {
      button: 'solid',
      card: 'bordered',
      input: 'default',
      checkbox: 'square',
      toggle: 'ios',
      badge: 'filled',
    },
  },

  // ─── Electronics / Tech ───────────────────────────────────────────
  {
    id: 'modern-tech',
    label: 'Modern Tech',
    description:
      'Clean, minimalist design with sharp lines. Built for electronics, gadgets, and SaaS merchandise.',
    industry: 'electronics',
    style: 'modern',
    branding: {
      primaryColor: '#0f172a',
      secondaryColor: '#3b82f6',
      backgroundColor: '#f8fafc',
      displayFont: 'Inter',
      bodyFont: 'Inter',
      buttonStyle: 'solid',
      cardStyle: 'flat',
      heroStyle: 'classic',
    },
    layout: {
      pages: [
        { pageId: 'home', label: 'Home', enabled: true },
        { pageId: 'contact', label: 'Support', enabled: true },
      ],
      includeContact: true,
    },
    componentDefaults: {
      button: 'solid',
      card: 'flat',
      input: 'default',
      checkbox: 'square',
      toggle: 'material',
      badge: 'filled',
    },
  },

  // ─── Beauty & Wellness ────────────────────────────────────────────
  {
    id: 'minimal-beauty',
    label: 'Minimal Beauty',
    description:
      'Airy, clean aesthetic with pastel accents. Designed for skincare, cosmetics, and wellness brands.',
    industry: 'beauty',
    style: 'minimal',
    branding: {
      primaryColor: '#2d2d2d',
      secondaryColor: '#e8b4b8',
      backgroundColor: '#fefefe',
      displayFont: 'Cormorant Garamond',
      bodyFont: 'Nunito Sans',
      buttonStyle: 'pill',
      cardStyle: 'elevated',
      heroStyle: 'boutique',
    },
    layout: {
      pages: [
        { pageId: 'home', label: 'Home', enabled: true },
        { pageId: 'story', label: 'Our Story', enabled: true },
        { pageId: 'contact', label: 'Contact', enabled: true },
      ],
      includeBlog: true,
      includeStory: true,
      includeContact: true,
    },
    componentDefaults: {
      button: 'pill',
      card: 'elevated',
      input: 'filled',
      checkbox: 'rounded',
      toggle: 'ios',
      badge: 'outline',
    },
  },

  // ─── Home & Living ────────────────────────────────────────────────
  {
    id: 'classic-home',
    label: 'Classic Home',
    description:
      'Warm, inviting design with classic typography. Great for furniture, decor, and home goods stores.',
    industry: 'home',
    style: 'classic',
    branding: {
      primaryColor: '#2c3e50',
      secondaryColor: '#d4a574',
      backgroundColor: '#f9f5f0',
      displayFont: 'Libre Baskerville',
      bodyFont: 'Open Sans',
      buttonStyle: 'outline',
      cardStyle: 'elevated',
      heroStyle: 'carousel',
    },
    layout: {
      pages: [
        { pageId: 'home', label: 'Home', enabled: true },
        { pageId: 'story', label: 'About Us', enabled: true },
        { pageId: 'contact', label: 'Contact', enabled: true },
      ],
      includeBlog: true,
      includeStory: true,
      includeContact: true,
    },
    componentDefaults: {
      button: 'outline',
      card: 'elevated',
      input: 'default',
      checkbox: 'square',
      toggle: 'ios',
      badge: 'filled',
    },
  },

  // ─── Art & Crafts ─────────────────────────────────────────────────
  {
    id: 'creative-art',
    label: 'Creative Studio',
    description:
      'Expressive, colorful design with artistic flair. For artists, printmakers, and handmade goods sellers.',
    industry: 'art',
    style: 'playful',
    branding: {
      primaryColor: '#1e1e1e',
      secondaryColor: '#ff6b35',
      backgroundColor: '#fffbf5',
      displayFont: 'Abril Fatface',
      bodyFont: 'Work Sans',
      buttonStyle: 'solid',
      cardStyle: 'bordered',
      heroStyle: 'playful',
    },
    layout: {
      pages: [
        { pageId: 'home', label: 'Home', enabled: true },
        { pageId: 'story', label: 'About the Artist', enabled: true },
        { pageId: 'contact', label: 'Contact', enabled: true },
      ],
      includeBlog: true,
      includeStory: true,
      includeContact: true,
    },
    componentDefaults: {
      button: 'solid',
      card: 'bordered',
      input: 'filled',
      checkbox: 'rounded',
      toggle: 'ios',
      badge: 'filled',
    },
  },

  // ─── Sports & Fitness ─────────────────────────────────────────────
  {
    id: 'dynamic-sports',
    label: 'Dynamic Sports',
    description:
      'Energetic, high-impact design with strong contrasts. Perfect for athletic wear and fitness gear.',
    industry: 'sports',
    style: 'bold',
    branding: {
      primaryColor: '#111827',
      secondaryColor: '#10b981',
      backgroundColor: '#f9fafb',
      displayFont: 'Montserrat',
      bodyFont: 'Roboto',
      buttonStyle: 'solid',
      cardStyle: 'flat',
      heroStyle: 'glow',
    },
    layout: {
      pages: [
        { pageId: 'home', label: 'Home', enabled: true },
        { pageId: 'contact', label: 'Contact', enabled: true },
      ],
      includeContact: true,
    },
    componentDefaults: {
      button: 'solid',
      card: 'flat',
      input: 'default',
      checkbox: 'square',
      toggle: 'material',
      badge: 'filled',
    },
  },

  // ─── General / Starter ────────────────────────────────────────────
  {
    id: 'clean-starter',
    label: 'Clean Starter',
    description:
      'A neutral, versatile starting point that works for any industry. Customize to make it yours.',
    industry: 'general',
    style: 'minimal',
    branding: {
      primaryColor: '#18181b',
      secondaryColor: '#a1a1aa',
      backgroundColor: '#ffffff',
      displayFont: 'Inter',
      bodyFont: 'Inter',
      buttonStyle: 'solid',
      cardStyle: 'bordered',
      heroStyle: 'classic',
    },
    layout: {
      pages: [
        { pageId: 'home', label: 'Home', enabled: true },
        { pageId: 'contact', label: 'Contact', enabled: true },
      ],
      includeContact: true,
    },
    componentDefaults: {
      button: 'solid',
      card: 'bordered',
      input: 'default',
      checkbox: 'square',
      toggle: 'ios',
      badge: 'filled',
    },
  },
] as const;

/**
 * Total number of available presets.
 */
export const PRESET_COUNT = SITE_PRESETS.length;
