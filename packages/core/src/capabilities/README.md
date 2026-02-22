# Capabilities

Feature capability registry and contracts for gating store features.

## Key Files

- `featureCapabilityRegistry.ts` — Static catalog of all ecommerce features with their capabilities. Used to determine what a store can do.
- `featureContracts.ts` — Runtime evaluation of whether a specific feature is enabled for a store, based on its profile.

## How It Works

The capability registry defines all known features (blog, campaigns, payments, etc.)
and their sub-capabilities. At request time, the store profile's feature flags are
cross-referenced with the catalog to determine what's allowed.

This prevents provisioning or using features that a store hasn't enabled,
and allows the wizard to show only relevant configuration steps.

## Pattern Source

Ported from the SIS platform's `serviceCapabilityRegistry.js` and
`domainCapabilityContracts.js`, adapted from school services to ecommerce features.
