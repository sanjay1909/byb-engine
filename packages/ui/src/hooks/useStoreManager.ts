import { useState, useRef, useCallback } from 'react';
import { createStoreManager } from '@byb/store-manager';
import type {
  StoreManager,
  StoreFilter,
  StoreRecord,
  CreateStoreInput,
  StoreStatus,
} from '@byb/store-manager';

export function useStoreManager() {
  const managerRef = useRef<StoreManager | null>(null);
  if (!managerRef.current) {
    managerRef.current = createStoreManager();
  }
  const manager = managerRef.current;

  // Track version to trigger re-renders after mutations
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const stores = useCallback(
    (filter?: StoreFilter) => manager.listStores(filter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [manager, version],
  );

  const getStore = useCallback(
    (storeId: string) => manager.getStore(storeId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [manager, version],
  );

  const summary = useCallback(
    () => manager.getSummary(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [manager, version],
  );

  const createStore = useCallback(
    (input: CreateStoreInput) => {
      const record = manager.createStore(input);
      bump();
      return record;
    },
    [manager, bump],
  );

  const updateStatus = useCallback(
    (storeId: string, status: StoreStatus, reason?: string) => {
      const record = manager.updateStatus(storeId, status, reason);
      bump();
      return record;
    },
    [manager, bump],
  );

  const updateUrls = useCallback(
    (storeId: string, urls: Partial<StoreRecord['urls']>) => {
      const record = manager.updateUrls(storeId, urls);
      bump();
      return record;
    },
    [manager, bump],
  );

  const deleteStore = useCallback(
    (storeId: string, reason?: string) => {
      const record = manager.deleteStore(storeId, reason);
      bump();
      return record;
    },
    [manager, bump],
  );

  const count = useCallback(
    () => manager.count(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [manager, version],
  );

  return {
    stores,
    getStore,
    summary,
    createStore,
    updateStatus,
    updateUrls,
    deleteStore,
    count,
    manager, // expose raw manager for advanced usage
  };
}
