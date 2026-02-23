/**
 * mockStorageAdapter.ts — In-memory mock implementation of StorageAdapter.
 *
 * Stores objects as { data, contentType } entries keyed by storage path.
 * Generates mock:// URLs for presigned upload/download operations.
 * Provides inspector methods for testing and verification.
 */

import type {
  StorageAdapter,
  StoragePresignUploadParams,
  StoragePresignUploadResult,
  StoragePresignDownloadParams,
  StorageDeleteParams,
  StorageListParams,
  StorageListItem,
} from '@byb/core';

declare function setTimeout(callback: () => void, ms: number): unknown;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface MockStorageAdapterOptions {
  /** Artificial delay in ms for each operation (default: 0) */
  delay?: number;
}

export interface MockStoredObject {
  data: string;
  contentType: string;
}

export interface MockStorageAdapter extends StorageAdapter {
  /** Returns the full in-memory object store for inspection */
  getStoredObjects(): Map<string, MockStoredObject>;
  /** Resets all stored objects */
  clear(): void;
  /** Provisioning: create a storage bucket for a store */
  createBucket(params: Record<string, unknown>): Promise<Record<string, unknown>>;
}

/**
 * Creates an in-memory mock storage adapter.
 *
 * Objects are stored in a Map keyed by storage path.
 * Presigned URLs use a mock:// scheme for easy identification in tests.
 */
export function createMockStorageAdapter(
  options?: MockStorageAdapterOptions,
): MockStorageAdapter {
  const delay = options?.delay ?? 0;
  const objects = new Map<string, MockStoredObject>();

  return {
    async presignUpload(
      params: StoragePresignUploadParams,
    ): Promise<StoragePresignUploadResult> {
      if (delay) await wait(delay);
      objects.set(params.key, { data: '', contentType: params.contentType });
      return {
        uploadUrl: `mock://upload/${params.key}`,
        publicUrl: `mock://public/${params.key}`,
      };
    },

    async presignDownload(
      params: StoragePresignDownloadParams,
    ): Promise<string> {
      if (delay) await wait(delay);
      return `mock://download/${params.key}`;
    },

    async delete(params: StorageDeleteParams): Promise<void> {
      if (delay) await wait(delay);
      objects.delete(params.key);
    },

    async list(params: StorageListParams): Promise<StorageListItem[]> {
      if (delay) await wait(delay);
      let items: StorageListItem[] = [...objects.entries()]
        .filter(([key]) => key.startsWith(params.prefix))
        .map(([key, obj]) => ({
          key,
          size: obj.data.length,
          lastModified: new Date(),
        }));

      if (params.limit && items.length > params.limit) {
        items = items.slice(0, params.limit);
      }

      return items;
    },

    getStoredObjects(): Map<string, MockStoredObject> {
      return objects;
    },

    clear(): void {
      objects.clear();
    },

    // ── Provisioning operations ──────────────────────────────────────

    async createBucket(
      params: Record<string, unknown>,
    ): Promise<Record<string, unknown>> {
      if (delay) await wait(delay);
      const storeId = (params.storeId as string) ?? 'unknown';
      const bucketName = `mock-bucket-${storeId}`;
      // Store a metadata entry so the bucket can be inspected
      objects.set(`__bucket__/${bucketName}`, {
        data: JSON.stringify({
          bucketName,
          storeId,
          region: params.region as string,
          createdAt: new Date().toISOString(),
        }),
        contentType: 'application/json',
      });
      return { success: true, bucketName, bucketUrl: `mock://bucket/${bucketName}` };
    },
  };
}
