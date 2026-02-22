# Provisioning

The provisioning system generates and executes deployment plans for new stores.

## Key Files

- `provisioningComposer.ts` — Generates a deterministic provisioning plan (list of stages) based on the store profile's adapter selections and feature flags. Stages that depend on disabled features are marked as skipped.
- `provisioningBridge.ts` — Executes the composed plan by dispatching each stage to the correct cloud adapter. Tracks stage results and handles failures.

## How It Works

```
Wizard Output → Store Profile → Provisioning Composer → Stage Plan
                                                           ↓
                              Cloud Adapter Registry → Provisioning Bridge
                                                           ↓
                                                    Executed Stages
                                                    (with results)
```

1. **Composer** reads the store profile and creates an ordered list of provisioning stages
2. **Bridge** iterates through stages, resolving the right adapter for each and executing it
3. Each stage result is tracked for progress reporting and debugging

## Pattern Source

Ported from the SIS platform's `orchestrationComposer.js` and `serviceBridge.js`.
