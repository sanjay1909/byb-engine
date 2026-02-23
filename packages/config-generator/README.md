# @byb/config-generator

Transforms wizard answers into deployable store configuration files. This is the bridge between the onboarding wizard UI and the engine's config file system.

## Generated Configs

| Generator | Output | Purpose |
|-----------|--------|---------|
| `generateStoreConfig` | `store.config.json` | Store identity, shipping, socials, contact info |
| `generateThemeConfig` | `theme.json` | Theme presets with brand colors, typography, component defaults |
| `generateTemplateConfig` | `templates.json` | Page layouts with section definitions |
| `generateStoreProfile` | `StoreProfile` | Cloud adapter selections + feature flags for @byb/core |

## Usage

### Generate Everything at Once

```typescript
import { generateAllConfigs } from '@byb/config-generator';

const { storeConfig, themeConfig, templateConfig, componentDefaults, storeProfile } =
  generateAllConfigs(wizardAnswers);
```

### Individual Generators

```typescript
import {
  generateStoreConfig,
  generateThemeConfig,
  generateTemplateConfig,
  generateStoreProfile,
} from '@byb/config-generator';

const storeConfig = generateStoreConfig(answers);   // → store.config.json
const themeConfig = generateThemeConfig(answers);     // → theme.json
const templateConfig = generateTemplateConfig(answers); // → templates.json
const storeProfile = generateStoreProfile(answers);   // → StoreProfile
```

### Cloud Provider Mapping

```typescript
import { getSupportedCloudProviders, getAdapterSelectionsForProvider } from '@byb/config-generator';

getSupportedCloudProviders(); // ['aws', 'azure', 'gcp']
getAdapterSelectionsForProvider('aws');
// { db: 'dynamodb', storage: 's3', cdn: 'cloudfront', email: 'ses', ... }
```

## Key Design Decisions

- **Prices stored in cents** — `$29.99` becomes `2999` for safe integer math
- **Color derivation** — Theme generator derives accent/surface colors from primary/secondary via `lightenColor`/`darkenColor`
- **Feature gating** — Blog page only appears if both `features.blog` AND `layout.includeBlog` are true
- **Cloud-agnostic profiles** — Each cloud provider maps to a fixed set of adapter IDs (e.g., AWS → dynamodb, s3, cloudfront)

## Tests
```bash
npx vitest run packages/config-generator/
```
