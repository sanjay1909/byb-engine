/**
 * @byb/store-manager — Store lifecycle management and catalog onboarding.
 *
 * Provides two services:
 *
 * 1. **Store Manager** — CRUD operations for store records, lifecycle
 *    status tracking (created → provisioning → active → ...), URL
 *    management, and admin dashboard statistics.
 *
 * 2. **Catalog Onboarding** — Product catalog import from CSV files
 *    and industry-specific sample product seeding for new stores.
 *
 * Usage:
 *   import { createStoreManager, parseCsvCatalog, getSampleCatalog } from '@byb/store-manager';
 *
 *   // Manage stores
 *   const manager = createStoreManager();
 *   manager.createStore({ storeId: 'my-shop', ... });
 *   manager.updateStatus('my-shop', 'provisioning');
 *
 *   // Import products
 *   const result = parseCsvCatalog(csvContent);
 *   const samples = getSampleCatalog('fashion');
 */

// Store record types
export type {
  StoreRecord,
  CreateStoreInput,
  StoreStatus,
  StoreStatusEvent,
  StoreUrls,
} from './storeRecord.js';

// Store manager
export {
  createStoreManager,
  type StoreManager,
  type StoreFilter,
  type StoreSummary,
} from './storeManager.js';

// Catalog onboarding
export {
  parseCsvCatalog,
  getSampleCatalog,
  getSampleCatalogIndustries,
  type Product,
  type ProductVariant,
  type CsvParseResult,
  type SampleCatalogIndustry,
} from './catalogOnboarding.js';
