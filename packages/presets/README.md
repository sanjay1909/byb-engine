# @byb/presets

Curated site preset gallery for the onboarding wizard. Each preset bundles theme + layout + component defaults into a one-click starting point.

## Available Presets

| ID | Industry | Style | Description |
|----|----------|-------|-------------|
| `elegant-fashion` | Fashion | Elegant | Serif fonts, muted tones for boutiques |
| `bold-streetwear` | Fashion | Bold | High-contrast urban aesthetic |
| `playful-kids` | Kids | Playful | Warm colors, handwritten accents (Charming Cherubs style) |
| `rustic-food` | Food | Rustic | Earthy tones for artisan food brands |
| `modern-tech` | Electronics | Modern | Clean, minimalist for gadgets/SaaS |
| `minimal-beauty` | Beauty | Minimal | Pastel accents for skincare/cosmetics |
| `classic-home` | Home | Classic | Warm, inviting for furniture/decor |
| `creative-art` | Art | Playful | Colorful, expressive for artists |
| `dynamic-sports` | Sports | Bold | Energetic for athletic wear |
| `clean-starter` | General | Minimal | Neutral starting point for any industry |

## Usage

```typescript
import { filterPresets, applyPreset } from '@byb/presets';

// Browse presets
const fashionPresets = filterPresets({ industry: 'fashion' });

// Apply to wizard
const applied = applyPreset('elegant-fashion');
wizard.updateStep('branding', applied.branding);
wizard.updateStep('layout', applied.layout);
```

## Tests
```bash
npx vitest run packages/presets/
```
