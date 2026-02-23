/**
 * storeManager.ts — In-memory store lifecycle manager.
 *
 * Provides CRUD operations for store records and manages status transitions.
 * This is the central service for the engine admin dashboard.
 *
 * How it connects to the system:
 * - The wizard orchestrator calls createStore() after generating configs
 * - The provisioning bridge calls updateStatus() as stages complete
 * - The engine admin dashboard calls listStores(), getStore() to display state
 * - The admin can call suspendStore(), reactivateStore(), deleteStore()
 *
 * Design decisions:
 * - Uses an in-memory Map for storage — swap for a DB adapter in production
 * - Status transitions are validated (e.g., can't go from 'deleted' to 'active')
 * - Every status change is logged in the store's history array
 * - Supports filtering by status, owner, and cloud provider
 * - The manager is a factory function (like all BYB modules) — no classes
 *
 * Future: Replace the in-memory Map with a DbAdapter call to persist
 * store records in DynamoDB/Cosmos/Firestore via the adapter layer.
 */

import type {
  StoreRecord,
  CreateStoreInput,
  StoreStatus,
  StoreStatusEvent,
} from './storeRecord.js';

/**
 * Filter criteria for listing stores.
 */
export interface StoreFilter {
  /** Filter by lifecycle status */
  status?: StoreStatus;
  /** Filter by owner ID */
  ownerId?: string;
  /** Filter by cloud provider */
  cloudProvider?: string;
}

/**
 * Summary statistics for the engine admin dashboard.
 */
export interface StoreSummary {
  total: number;
  byStatus: Record<StoreStatus, number>;
  byProvider: Record<string, number>;
}

/**
 * The store manager interface.
 */
export interface StoreManager {
  /** Create a new store record. Returns the created record. */
  createStore(input: CreateStoreInput): StoreRecord;

  /** Get a store by ID. Returns undefined if not found. */
  getStore(storeId: string): StoreRecord | undefined;

  /** List all stores, optionally filtered. */
  listStores(filter?: StoreFilter): StoreRecord[];

  /** Update a store's status with an event. */
  updateStatus(
    storeId: string,
    status: StoreStatus,
    reason?: string,
    errorDetail?: string,
  ): StoreRecord;

  /** Update a store's deployed URLs. */
  updateUrls(
    storeId: string,
    urls: Partial<StoreRecord['urls']>,
  ): StoreRecord;

  /** Get summary statistics. */
  getSummary(): StoreSummary;

  /** Delete a store record (marks as deleted, doesn't remove from storage). */
  deleteStore(storeId: string, reason?: string): StoreRecord;

  /** Total number of stores (including deleted). */
  count(): number;
}

/**
 * Valid status transitions.
 * Maps each status to the set of statuses it can transition to.
 */
const VALID_TRANSITIONS: Record<StoreStatus, StoreStatus[]> = {
  created: ['provisioning', 'error', 'deleted'],
  provisioning: ['active', 'error', 'deleted'],
  active: ['suspended', 'error', 'deprovisioning', 'provisioning'],
  error: ['provisioning', 'deleted', 'active'],
  suspended: ['active', 'deprovisioning', 'deleted'],
  deprovisioning: ['deleted', 'error'],
  deleted: [], // Terminal state — no transitions out
};

/**
 * Creates a new store manager instance.
 *
 * @returns A StoreManager with in-memory storage
 *
 * @example
 * const manager = createStoreManager();
 * const store = manager.createStore({
 *   storeId: 'my-shop',
 *   storeName: 'My Shop',
 *   ownerId: 'user-123',
 *   cloudProvider: 'aws',
 *   region: 'us-east-1',
 *   profile: storeProfile,
 *   wizardAnswers: answers,
 * });
 * manager.updateStatus(store.storeId, 'provisioning');
 * manager.updateStatus(store.storeId, 'active');
 */
export function createStoreManager(): StoreManager {
  const stores = new Map<string, StoreRecord>();

  /** Creates a status event. */
  function createEvent(
    status: StoreStatus,
    reason?: string,
    errorDetail?: string,
  ): StoreStatusEvent {
    return {
      status,
      timestamp: new Date().toISOString(),
      ...(reason && { reason }),
      ...(errorDetail && { errorDetail }),
    };
  }

  /** Validates a status transition. Throws if invalid. */
  function validateTransition(
    storeId: string,
    fromStatus: StoreStatus,
    toStatus: StoreStatus,
  ): void {
    const allowed = VALID_TRANSITIONS[fromStatus];
    if (!allowed.includes(toStatus)) {
      throw new Error(
        `Invalid status transition for store '${storeId}': ` +
          `cannot go from '${fromStatus}' to '${toStatus}'. ` +
          `Allowed transitions: ${allowed.join(', ') || 'none (terminal state)'}`,
      );
    }
  }

  return {
    createStore(input: CreateStoreInput): StoreRecord {
      if (stores.has(input.storeId)) {
        throw new Error(
          `Store '${input.storeId}' already exists. Use a different storeId.`,
        );
      }

      const now = new Date().toISOString();
      const record: StoreRecord = {
        storeId: input.storeId,
        storeName: input.storeName,
        ownerId: input.ownerId,
        status: 'created',
        cloudProvider: input.cloudProvider,
        region: input.region,
        customDomain: input.customDomain,
        urls: {},
        profile: input.profile,
        wizardAnswers: input.wizardAnswers,
        presetId: input.presetId,
        history: [createEvent('created', 'Store created from wizard')],
        createdAt: now,
        updatedAt: now,
      };

      stores.set(input.storeId, record);
      return { ...record };
    },

    getStore(storeId: string): StoreRecord | undefined {
      const record = stores.get(storeId);
      return record ? { ...record } : undefined;
    },

    listStores(filter?: StoreFilter): StoreRecord[] {
      let results = [...stores.values()];

      if (filter?.status) {
        results = results.filter((s) => s.status === filter.status);
      }
      if (filter?.ownerId) {
        results = results.filter((s) => s.ownerId === filter.ownerId);
      }
      if (filter?.cloudProvider) {
        results = results.filter(
          (s) => s.cloudProvider === filter.cloudProvider,
        );
      }

      return results.map((r) => ({ ...r }));
    },

    updateStatus(
      storeId: string,
      status: StoreStatus,
      reason?: string,
      errorDetail?: string,
    ): StoreRecord {
      const record = stores.get(storeId);
      if (!record) {
        throw new Error(`Store '${storeId}' not found`);
      }

      validateTransition(storeId, record.status, status);

      record.status = status;
      record.updatedAt = new Date().toISOString();
      record.history.push(createEvent(status, reason, errorDetail));

      return { ...record };
    },

    updateUrls(
      storeId: string,
      urls: Partial<StoreRecord['urls']>,
    ): StoreRecord {
      const record = stores.get(storeId);
      if (!record) {
        throw new Error(`Store '${storeId}' not found`);
      }

      record.urls = { ...record.urls, ...urls };
      record.updatedAt = new Date().toISOString();

      return { ...record };
    },

    getSummary(): StoreSummary {
      const byStatus: Record<string, number> = {};
      const byProvider: Record<string, number> = {};

      for (const record of stores.values()) {
        byStatus[record.status] = (byStatus[record.status] ?? 0) + 1;
        byProvider[record.cloudProvider] =
          (byProvider[record.cloudProvider] ?? 0) + 1;
      }

      return {
        total: stores.size,
        byStatus: byStatus as Record<StoreStatus, number>,
        byProvider,
      };
    },

    deleteStore(storeId: string, reason?: string): StoreRecord {
      const record = stores.get(storeId);
      if (!record) {
        throw new Error(`Store '${storeId}' not found`);
      }

      validateTransition(storeId, record.status, 'deleted');

      record.status = 'deleted';
      record.updatedAt = new Date().toISOString();
      record.history.push(
        createEvent('deleted', reason ?? 'Store deleted by admin'),
      );

      return { ...record };
    },

    count(): number {
      return stores.size;
    },
  };
}
