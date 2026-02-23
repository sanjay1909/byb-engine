# @byb/store-manager

Store lifecycle management and product catalog onboarding.

## Store Manager

Manages the lifecycle of provisioned stores with validated status transitions:

```
created → provisioning → active → suspended → deprovisioning → deleted
                ↓                      ↓
              error ←──────────────────┘
```

```typescript
import { createStoreManager } from '@byb/store-manager';

const manager = createStoreManager();

// Create from wizard output
const store = manager.createStore({
  storeId: 'my-shop',
  storeName: 'My Shop',
  ownerId: 'user-123',
  cloudProvider: 'aws',
  region: 'us-east-1',
  profile: storeProfile,
  wizardAnswers: answers,
});

// Update status during provisioning
manager.updateStatus('my-shop', 'provisioning', 'Deploy started');
manager.updateUrls('my-shop', { siteUrl: 'https://my-shop.com' });
manager.updateStatus('my-shop', 'active', 'Deployment complete');

// Admin dashboard
const summary = manager.getSummary();
// { total: 5, byStatus: { active: 3, ... }, byProvider: { aws: 4, azure: 1 } }
```

## Catalog Onboarding

### CSV Import
```typescript
import { parseCsvCatalog } from '@byb/store-manager';

const csv = 'name,price,category\n"Summer Dress",29.99,Dresses';
const result = parseCsvCatalog(csv);
// result.products = [{ name: 'Summer Dress', price: 2999, category: 'Dresses' }]
```

### Sample Catalogs
```typescript
import { getSampleCatalog } from '@byb/store-manager';

const products = getSampleCatalog('fashion'); // 5 sample products with variants
```

Available industries: fashion, kids, food, electronics, beauty, home, general

## Tests
```bash
npx vitest run packages/store-manager/
```
