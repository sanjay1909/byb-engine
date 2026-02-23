# @byb/wizard

Framework-agnostic onboarding wizard state machine and orchestrator.

## Architecture

```
wizardSteps          → Step sequence definition (7 steps)
stepValidators       → Per-step input validation
wizardStateMachine   → State machine (navigation, validation, pub/sub)
wizardOrchestrator   → Top-level API (state machine + config generation)
```

## Wizard Steps

1. **Business Info** — storeId, name, URL, email, currency, socials
2. **Branding** — primary/secondary colors, fonts, hero style
3. **Layout** — page selection, blog/story/contact toggles
4. **Features** — blog, campaigns, payments, analytics, OE
5. **Shipping** — flat rate, free-over threshold
6. **Cloud Setup** — AWS/Azure/GCP, region, custom domain
7. **Review & Generate** — summary, triggers config generation

## Usage

```typescript
import { createWizardOrchestrator } from '@byb/wizard';

const wizard = createWizardOrchestrator();
wizard.subscribe((state) => renderUI(state)); // framework-agnostic
wizard.start();

// User fills steps
wizard.updateStep('business', { storeId: 'my-shop', ... });
wizard.next(); // validates and advances

// On final step
const result = wizard.finish();
if (result.success) {
  // result.configs has storeConfig, themeConfig, templateConfig, storeProfile
}
```

## Framework Integration

The wizard is pure TypeScript — no React, no DOM. The UI layer:
1. Creates a `WizardOrchestrator` instance
2. Subscribes to state changes via `wizard.subscribe()`
3. Renders forms based on `wizard.getState().currentStepId`
4. Calls `wizard.updateStep()` / `wizard.next()` / `wizard.back()`

## Tests
```bash
npx vitest run packages/wizard/
```
