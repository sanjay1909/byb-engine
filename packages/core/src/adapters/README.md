# Adapters

This directory contains the generic adapter registry and contract validation system.
Cloud-specific implementations (AWS, Azure, etc.) live in separate packages and register here.

## Key Files

- `adapterRegistry.ts` — Generic factory for creating typed adapter registries. Supports register, resolve, list, and contract validation.
- `adapterContracts.ts` — Utilities for asserting that an adapter object satisfies a required methods contract.
- `interfaces/` — TypeScript interfaces defining what each adapter domain must implement.

## Pattern (from SIS Platform)

```
const registry = createAdapterRegistry<MyAdapter>({
  requiredMethods: ['get', 'put', 'delete'],
});

registry.registerAdapter('dynamodb', (ctx) => new DynamoDbAdapter(ctx));
registry.registerAdapter('cosmosdb', (ctx) => new CosmosDbAdapter(ctx));

const adapter = registry.resolveAdapter('dynamodb', requestContext);
// adapter is validated against contract before returning
```
