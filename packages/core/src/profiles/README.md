# Profiles

Store profile resolution — determines which adapters and features are active for each store.

## Key Files

- `storeProfileResolver.ts` — Resolves a store's profile by matching storeId (and optionally cloud provider, region) against registered profiles. Returns adapter selections and feature flags.

## How It Works

Each store has a profile that specifies:
- Which adapter to use for each domain (db, storage, cdn, email, etc.)
- Which features are enabled (blog, campaigns, payments, analytics)
- Deployment config (region, domain)

The resolver uses a **score-based match** — the profile with the most matching fields wins.
A default profile is always created as fallback.

## Pattern Source

Ported from the SIS platform's `schoolProfileResolver.js`, which matches tenant/campus/school
to determine adapter selections. Here we match by storeId/cloudProvider/region instead.
