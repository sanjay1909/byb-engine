# @byb/core

Core engine abstractions for the BYB ecommerce engine. This package contains no cloud-specific code — it defines the interfaces and patterns that cloud adapters implement.

## Key Modules

| Module | Purpose |
|--------|---------|
| `adapters/` | Generic adapter registry and contract validation. Cloud adapters register here. |
| `adapters/interfaces/` | TypeScript interfaces for each infrastructure concern (DB, storage, CDN, etc.) |
| `profiles/` | Store profile resolver — matches a storeId to its adapter selections and feature flags |
| `capabilities/` | Feature capability registry — catalogs store features (blog, campaigns, payments) with enable/disable |
| `provisioning/` | Provisioning composer and bridge — generates and executes deployment plans |

## Architecture

The pattern flows like this:

```
Store Profile → resolves → Adapter Selections + Feature Flags
                              ↓                       ↓
                    Adapter Registry         Capability Registry
                    (resolve adapters)       (evaluate features)
                              ↓                       ↓
                    Provisioning Composer ← merges both
                              ↓
                    Provisioning Bridge
                    (executes stages via adapters)
```

This is ported from the SIS platform's orchestration architecture, adapted for ecommerce provisioning.
