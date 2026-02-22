# BYB — Build Your Business

A wizard-based ecommerce engine that generates fully deployed online stores. Users walk through a guided setup wizard, pick their branding/theme/template, choose their cloud provider, and get a live ecommerce site deployed automatically.

## Architecture

BYB uses a **capability-based, profile-driven adapter architecture**. This means:

- **Store profiles** determine which cloud adapters and features are active for each store
- **Adapter registries** manage pluggable implementations for each infrastructure concern (database, storage, CDN, email, etc.)
- **Feature capabilities** gate which store features (blog, campaigns, payments) are enabled per profile
- **Provisioning flows** execute deployment plans by dispatching stages to the correct cloud adapters

This architecture allows the same engine to deploy stores on AWS, Azure, GCP, or any supported cloud — customers bring their own account.

## Packages

| Package | Purpose |
|---------|---------|
| `@byb/core` | Core abstractions: adapter registries, store profiles, feature capabilities, provisioning |
| `@byb/adapter-aws` | AWS adapter implementations (DynamoDB, S3, CloudFront, SES, etc.) |
| `@byb/config-generator` | Transforms wizard answers into store config/theme/template files |

## Getting Started

```bash
npm install
npm test
```

## Development Principles

1. **Smallest unit first** — implement one function, test it, move on
2. **Tests alongside code** — every module has co-located `.test.ts` files
3. **Agent-friendly comments** — files explain what they do, why, and how they connect
4. **README per folder** — each directory documents its purpose and key files
5. **Build on top** — each layer depends on the previous, no skipping ahead
