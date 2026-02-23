# BYB — Build Your Business

A wizard-based ecommerce engine that generates fully deployed online stores. Users walk through a guided setup wizard, pick their branding/theme/template, choose their cloud provider, and get a live ecommerce site deployed automatically.

## Architecture

BYB uses a **capability-based, profile-driven adapter architecture**:

- **Store profiles** determine which cloud adapters and features are active for each store
- **Adapter registries** manage pluggable implementations for each infrastructure concern (database, storage, CDN, email, etc.)
- **Feature capabilities** gate which store features (blog, campaigns, payments) are enabled per profile
- **Provisioning flows** execute deployment plans by dispatching stages to the correct cloud adapters

This allows the same engine to deploy stores on AWS, Azure, GCP, or any supported cloud — customers bring their own account.

```
┌──────────────────────────────────────────────────────────────────┐
│  Wizard UI (React)                                               │
│  ┌─────────┐ ┌─────────┐ ┌────────┐ ┌──────┐ ┌──────┐ ┌──────┐│
│  │Business │→│Branding │→│ Layout │→│Feat. │→│Ship. │→│Cloud ││
│  └─────────┘ └─────────┘ └────────┘ └──────┘ └──────┘ └──────┘│
└──────────────────────────┬───────────────────────────────────────┘
                           ↓
┌──────────────────────────┴───────────────────────────────────────┐
│  Config Generator                                                │
│  WizardAnswers → store.config.json + theme.json + templates.json │
│                  + StoreProfile (adapter selections)             │
└──────────────────────────┬───────────────────────────────────────┘
                           ↓
┌──────────────────────────┴───────────────────────────────────────┐
│  Core Engine                                                     │
│  Profile Resolver → Adapter Registry → Provisioning Composer     │
│                     Feature Capabilities   → Provisioning Bridge │
└──────────────────────────┬───────────────────────────────────────┘
                           ↓
┌──────────────────────────┴───────────────────────────────────────┐
│  Cloud Adapters (pluggable)                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  AWS (done)  │  │ Azure (TBD) │  │  GCP (TBD)  │             │
│  │ DynamoDB, S3 │  │ Cosmos, Blob│  │ Firestore   │             │
│  │ CF, SES, SSM │  │ CDN, SendG. │  │ GCS, CDN    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└──────────────────────────────────────────────────────────────────┘
```

## Packages

| Package | Description | Status |
|---------|-------------|--------|
| [`@byb/core`](packages/core/) | Adapter registries, store profiles, feature capabilities, provisioning | ✅ Done |
| [`@byb/adapter-aws`](packages/adapter-aws/) | AWS implementations (DynamoDB, S3, CloudFront, SES, SSM, EventBridge, CDK) | ✅ Done |
| [`@byb/config-generator`](packages/config-generator/) | Wizard answers → store config, theme, templates, store profile | ✅ Done |
| [`@byb/wizard`](packages/wizard/) | Framework-agnostic wizard state machine and orchestrator | ✅ Done |
| [`@byb/presets`](packages/presets/) | Curated site preset gallery (10 industry presets) | ✅ Done |
| [`@byb/store-manager`](packages/store-manager/) | Store lifecycle CRUD, CSV catalog import, sample catalogs | ✅ Done |

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests (388 tests across 26 files)
npm test

# TypeScript check
npm run typecheck
```

## Wizard Flow

The onboarding wizard collects answers in 7 steps:

1. **Business Info** — store name, URL, email, currency, socials
2. **Branding** — colors, fonts, hero style, button/card style
3. **Layout** — page selection, blog/story/contact toggles
4. **Features** — blog, campaigns, payments, analytics, observability
5. **Shipping** — flat rate, free-over threshold
6. **Cloud Setup** — AWS/Azure/GCP, region, custom domain
7. **Review & Generate** — summary, triggers config generation

```typescript
import { createWizardOrchestrator } from '@byb/wizard';

const wizard = createWizardOrchestrator();
wizard.start();
wizard.updateStep('business', { storeId: 'my-shop', storeName: 'My Shop', ... });
wizard.next();
// ... fill all steps ...
const result = wizard.finish();
// result.configs = { storeConfig, themeConfig, templateConfig, storeProfile }
```

## Presets

10 curated full-site presets bundle theme + layout + component defaults:

| Preset | Industry | Style |
|--------|----------|-------|
| `elegant-fashion` | Fashion | Elegant |
| `bold-streetwear` | Fashion | Bold |
| `playful-kids` | Kids | Playful |
| `rustic-food` | Food | Rustic |
| `modern-tech` | Electronics | Modern |
| `minimal-beauty` | Beauty | Minimal |
| `classic-home` | Home | Classic |
| `creative-art` | Art | Playful |
| `dynamic-sports` | Sports | Bold |
| `clean-starter` | General | Minimal |

```typescript
import { applyPreset } from '@byb/presets';
const applied = applyPreset('playful-kids');
wizard.updateStep('branding', applied.branding);
wizard.updateStep('layout', applied.layout);
```

## Store Management

```typescript
import { createStoreManager, parseCsvCatalog, getSampleCatalog } from '@byb/store-manager';

// Lifecycle management
const manager = createStoreManager();
manager.createStore({ storeId: 'my-shop', ... });
manager.updateStatus('my-shop', 'provisioning');
manager.updateStatus('my-shop', 'active');

// Product catalog (CSV import)
const result = parseCsvCatalog('name,price,category\n"Dress",29.99,Dresses');

// Sample catalogs (7 industries × 5 products)
const products = getSampleCatalog('fashion');
```

## Development Principles

1. **Smallest unit first** — implement one function, test it, move on
2. **Tests alongside code** — every module has co-located `.test.ts` files
3. **Agent-friendly comments** — files explain what they do, why, and how they connect
4. **README per folder** — each directory documents its purpose and key files
5. **Build on top** — each layer depends on the previous, no skipping ahead
6. **Cloud-agnostic** — no cloud-specific code in core; adapters are pluggable

## Remaining Work

- [ ] React UI for wizard (consuming `@byb/wizard` orchestrator)
- [ ] React UI for engine admin dashboard (consuming `@byb/store-manager`)
- [ ] Azure adapter implementations
- [ ] GCP adapter implementations
- [ ] Domain & DNS automation
- [ ] Per-store deployment automation (CI/CD triggers)
