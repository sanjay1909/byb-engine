/**
 * types.ts — Shared types for the config generator package.
 *
 * Defines:
 * - WizardAnswers: The complete input shape from the onboarding wizard.
 *   Each section of the wizard contributes a sub-object.
 * - Generated output types: StoreConfig, ThemeConfig, TemplatesConfig
 *   These match the file formats used by the Charming Elm Engine runtime.
 *
 * How it connects to the system:
 * - WizardAnswers is the input to all three generators
 * - The output types are written to disk as JSON files per store
 * - The store profile generator uses WizardAnswers + these outputs to
 *   produce a @byb/core StoreProfile for the adapter layer
 */

// ─── Wizard Input Types ──────────────────────────────────────────────────────

/**
 * Business information collected in the first wizard step.
 */
export interface WizardBusinessInfo {
  /** Slug-friendly store identifier (e.g., 'charming-cherubs') */
  storeId: string;
  /** Human-readable store name (e.g., 'Charming Cherubs') */
  storeName: string;
  /** Legal entity name (optional, defaults to storeName) */
  legalEntityName?: string;
  /** Primary site URL (e.g., 'https://charmingcherubsco.com') */
  siteUrl: string;
  /** Support email address */
  supportEmail: string;
  /** Support phone number (optional) */
  supportPhone?: string;
  /** Social media links */
  socials?: {
    instagram?: string;
    facebook?: string;
    pinterest?: string;
    tiktok?: string;
  };
  /** Store currency (ISO code, e.g., 'usd') */
  currency: string;
}

/**
 * Shipping rules collected in the wizard.
 */
export interface WizardShippingRules {
  type: 'flat' | 'free_over';
  /** Flat shipping rate in cents/smallest unit */
  flatRate?: number;
  /** Free shipping threshold in cents/smallest unit */
  freeOver?: number;
}

/**
 * Branding/theming preferences from the wizard.
 */
export interface WizardBranding {
  /** Primary brand color (hex, e.g., '#171717') */
  primaryColor: string;
  /** Secondary/accent color (hex, e.g., '#f3e8ff') */
  secondaryColor: string;
  /** Background color (hex, e.g., '#fff6fb') */
  backgroundColor?: string;
  /** Display font family (e.g., 'Cinzel') */
  displayFont?: string;
  /** Body font family (e.g., 'Poppins') */
  bodyFont?: string;
  /** Button style preference */
  buttonStyle?: 'solid' | 'outline' | 'ghost' | 'pill';
  /** Card style preference */
  cardStyle?: 'flat' | 'bordered' | 'elevated';
  /** Hero section style — which template to use */
  heroStyle?: 'classic' | 'blob' | 'glow' | 'carousel' | 'sunflower' | 'playful' | 'boutique';
}

/**
 * Layout/template preferences from the wizard.
 */
export interface WizardLayout {
  /** Which pages to include */
  pages: Array<{
    pageId: string;
    label: string;
    /** Whether this page is enabled */
    enabled: boolean;
  }>;
  /** Whether to include a blog page */
  includeBlog?: boolean;
  /** Whether to include a contact page */
  includeContact?: boolean;
  /** Whether to include an "Our Story" page */
  includeStory?: boolean;
}

/**
 * Feature toggles from the wizard.
 */
export interface WizardFeatures {
  /** Enable blog CMS */
  blog: boolean;
  /** Enable email campaigns */
  campaigns: boolean;
  /** Payment provider ('stripe', 'manual', or false) */
  payments: boolean | string;
  /** Enable analytics dashboard */
  analytics: boolean;
  /** Enable operational engineering (metrics/alarms/traces) */
  oe: boolean;
}

/**
 * Cloud deployment preferences from the wizard.
 */
export interface WizardCloudTarget {
  /** Cloud provider ('aws', 'azure', 'gcp') */
  provider: 'aws' | 'azure' | 'gcp';
  /** Deployment region (e.g., 'us-east-1') */
  region: string;
  /** Custom domain (optional) */
  customDomain?: string;
}

/**
 * The complete wizard answers — the input to all config generators.
 * Each generator reads the fields it needs from this unified shape.
 */
export interface WizardAnswers {
  business: WizardBusinessInfo;
  shipping: WizardShippingRules;
  branding: WizardBranding;
  layout: WizardLayout;
  features: WizardFeatures;
  cloud: WizardCloudTarget;
}

// ─── Generated Output Types ──────────────────────────────────────────────────

/**
 * Shipping rules in the store config.
 */
export interface ShippingRules {
  type: 'flat' | 'free_over';
  flatRate?: number;
  freeOver?: number;
}

/**
 * Social media links.
 */
export interface StoreSocials {
  instagram?: string;
  pinterest?: string;
  facebook?: string;
  tiktok?: string;
}

/**
 * Hero image mappings — key is the hero slot ID, value is image path(s).
 */
export type HeroImages = Record<string, string | string[]>;

/**
 * The generated store.config.json shape.
 * Matches the Charming Elm Engine's `StoreConfig` type.
 */
export interface StoreConfig {
  storeId: string;
  storeName: string;
  legalEntityName?: string;
  siteUrl: string;
  apiBaseUrl?: string;
  supportEmail: string;
  supportPhone?: string;
  socials?: StoreSocials;
  heroImages?: HeroImages;
  sesFromEmail?: string;
  internalOrdersEmail?: string;
  currency: string;
  shippingRules: ShippingRules;
}

/**
 * A theme preset's override values (partial theme tokens).
 * This is a simplified version — the full engine has deep nested overrides
 * for typography, gradients, hero, studio, etc.
 */
export interface ThemeOverride {
  typography?: {
    fonts?: {
      display?: string;
      body?: string;
      handwritten?: string;
    };
  };
  gradients?: {
    primary?: string;
    card?: string;
  };
  hero?: {
    background?: string;
    titleColor?: string;
    subtitleColor?: string;
    accentColor?: string;
  };
  studio?: {
    backgroundStyle?: 'clean' | 'alternating' | 'gradient';
    frames?: {
      hero?: { style?: string; color?: string };
      product?: { style?: string; color?: string };
    };
  };
}

/**
 * A theme preset — a named set of theme overrides.
 */
export interface ThemePreset {
  id: string;
  label: string;
  overrides: ThemeOverride;
  updatedAt: string;
}

/**
 * Theme schedule — activate a preset at a scheduled time.
 */
export interface ThemeSchedule {
  themeId: string;
  activateAt: string;
}

/**
 * The generated themes/theme.json shape.
 * Matches the Charming Elm Engine's `ThemeConfig` type.
 */
export interface ThemeConfig {
  presets: ThemePreset[];
  schedules: ThemeSchedule[];
  instant: {
    enabled: boolean;
    themeId?: string;
  };
  updatedAt: string;
}

/**
 * A section in a page template.
 */
export interface TemplateSection {
  id: string;
  type: string;
  enabled: boolean;
  props?: Record<string, unknown>;
}

/**
 * A page template — defines the layout for one page.
 */
export interface PageTemplate {
  pageId: string;
  label: string;
  layout: TemplateSection[];
  updatedAt: string;
}

/**
 * The generated templates/templates.json shape.
 * Matches the Charming Elm Engine's `TemplatesConfig` type.
 */
export interface TemplatesConfig {
  pages: PageTemplate[];
  updatedAt: string;
}

/**
 * Component style defaults for the storefront.
 */
export interface ComponentDefaults {
  button: 'solid' | 'outline' | 'ghost' | 'pill';
  card: 'flat' | 'bordered' | 'elevated';
  input: 'default' | 'filled' | 'underline';
  checkbox: 'square' | 'rounded';
  toggle: 'ios' | 'material';
  badge: 'filled' | 'outline';
}
