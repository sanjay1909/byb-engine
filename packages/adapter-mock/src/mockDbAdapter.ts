/**
 * mockDbAdapter.ts — In-memory mock implementation of DbAdapter.
 *
 * Uses a nested Map structure: pk -> sk -> item.
 * Supports all DbAdapter operations including transactional writes.
 * Provides inspector methods for testing and verification.
 */

import type {
  DbAdapter,
  DbGetParams,
  DbPutParams,
  DbDeleteParams,
  DbQueryParams,
  DbQueryResult,
  DbTransactionItem,
} from '@byb/core';

declare function setTimeout(callback: () => void, ms: number): unknown;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface MockDbAdapterOptions {
  /** Artificial delay in ms for each operation (default: 0) */
  delay?: number;
}

export interface MockDbAdapter extends DbAdapter {
  /** Returns the full in-memory store for inspection */
  getStoredItems(): Map<string, Map<string, Record<string, unknown>>>;
  /** Resets all stored data */
  clear(): void;
  /** Provisioning: create a database table for a store */
  createTable(params: Record<string, unknown>): Promise<Record<string, unknown>>;
  /** Provisioning: seed sample data into a store's table */
  seedData(params: Record<string, unknown>): Promise<Record<string, unknown>>;
}

/**
 * Creates an in-memory mock database adapter.
 *
 * Data is stored in a nested Map: pk -> sk -> item.
 * All operations are async to match the DbAdapter interface.
 */
export function createMockDbAdapter(
  options?: MockDbAdapterOptions,
): MockDbAdapter {
  const delay = options?.delay ?? 0;
  const store = new Map<string, Map<string, Record<string, unknown>>>();

  return {
    async get(params: DbGetParams): Promise<Record<string, unknown> | null> {
      if (delay) await wait(delay);
      const pkMap = store.get(params.pk);
      if (!pkMap) return null;
      return pkMap.get(params.sk) ?? null;
    },

    async put(params: DbPutParams): Promise<void> {
      if (delay) await wait(delay);
      const item = params.item;
      const pk = item.pk as string;
      const sk = item.sk as string;
      if (!store.has(pk)) {
        store.set(pk, new Map());
      }
      store.get(pk)!.set(sk, { ...item });
    },

    async delete(params: DbDeleteParams): Promise<void> {
      if (delay) await wait(delay);
      const pkMap = store.get(params.pk);
      if (pkMap) {
        pkMap.delete(params.sk);
        if (pkMap.size === 0) {
          store.delete(params.pk);
        }
      }
    },

    async query(params: DbQueryParams): Promise<DbQueryResult> {
      if (delay) await wait(delay);
      const pkMap = store.get(params.pk);
      if (!pkMap) return { items: [] };

      let items = [...pkMap.entries()]
        .filter(([sk]) => {
          if (params.skPrefix) {
            return sk.startsWith(params.skPrefix);
          }
          return true;
        })
        .map(([, item]) => item);

      if (params.limit && items.length > params.limit) {
        items = items.slice(0, params.limit);
      }

      return { items };
    },

    async transactWrite(txItems: DbTransactionItem[]): Promise<void> {
      if (delay) await wait(delay);
      for (const txItem of txItems) {
        if (txItem.type === 'put') {
          const putParams = txItem.params as DbPutParams;
          const item = putParams.item;
          const pk = item.pk as string;
          const sk = item.sk as string;
          if (!store.has(pk)) {
            store.set(pk, new Map());
          }
          store.get(pk)!.set(sk, { ...item });
        } else if (txItem.type === 'delete') {
          const delParams = txItem.params as DbDeleteParams;
          const pkMap = store.get(delParams.pk);
          if (pkMap) {
            pkMap.delete(delParams.sk);
            if (pkMap.size === 0) {
              store.delete(delParams.pk);
            }
          }
        }
      }
    },

    getStoredItems(): Map<string, Map<string, Record<string, unknown>>> {
      return store;
    },

    clear(): void {
      store.clear();
    },

    // ── Provisioning operations ──────────────────────────────────────

    async createTable(
      params: Record<string, unknown>,
    ): Promise<Record<string, unknown>> {
      if (delay) await wait(delay);
      const storeId = (params.storeId as string) ?? 'unknown';
      const tableName = `mock-table-${storeId}`;
      // Store a metadata record so the table can be inspected
      const pk = `TABLE#${tableName}`;
      const sk = 'META';
      if (!store.has(pk)) {
        store.set(pk, new Map());
      }
      store.get(pk)!.set(sk, {
        pk,
        sk,
        tableName,
        storeId,
        region: params.region as string,
        createdAt: new Date().toISOString(),
      });
      return { success: true, tableName };
    },

    async seedData(
      params: Record<string, unknown>,
    ): Promise<Record<string, unknown>> {
      if (delay) await wait(delay);
      const storeId = (params.storeId as string) ?? 'unknown';
      // Insert a few sample records to simulate seeding
      const pk = `STORE#${storeId}`;
      if (!store.has(pk)) {
        store.set(pk, new Map());
      }
      const seedItems = [
        { pk, sk: 'SEED#sample-product-1', type: 'product', name: 'Sample Product 1' },
        { pk, sk: 'SEED#sample-category-1', type: 'category', name: 'Sample Category' },
      ];
      for (const item of seedItems) {
        store.get(pk)!.set(item.sk, { ...item, seededAt: new Date().toISOString() });
      }
      return { success: true, itemsSeeded: seedItems.length };
    },
  };
}
