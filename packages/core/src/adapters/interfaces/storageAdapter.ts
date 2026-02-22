/**
 * storageAdapter.ts — Interface for object storage operations.
 *
 * Handles file uploads (product images, hero banners, etc.) and downloads.
 * Cloud adapters implement it for their specific storage:
 * - AWS: S3
 * - Azure: Blob Storage
 * - GCP: Cloud Storage
 *
 * Presigned URLs are central to the design — the frontend uploads directly
 * to storage using a presigned URL, avoiding backend file handling.
 */

/** Parameters for generating a presigned upload URL */
export interface StoragePresignUploadParams {
  /** Storage key/path for the file (e.g., 'products/123/image.jpg') */
  key: string;
  /** MIME content type (e.g., 'image/jpeg') */
  contentType: string;
  /** URL expiration in seconds (default: 300) */
  expiresIn?: number;
}

/** Result of a presigned upload URL generation */
export interface StoragePresignUploadResult {
  /** The presigned URL to upload to */
  uploadUrl: string;
  /** The public URL where the file will be accessible after upload */
  publicUrl: string;
}

/** Parameters for generating a presigned download URL */
export interface StoragePresignDownloadParams {
  key: string;
  expiresIn?: number;
}

/** Parameters for deleting a stored object */
export interface StorageDeleteParams {
  key: string;
}

/** Parameters for listing objects in a prefix/folder */
export interface StorageListParams {
  /** Key prefix to list (e.g., 'products/123/') */
  prefix: string;
  /** Maximum number of items to return */
  limit?: number;
}

/** A single storage object in a listing */
export interface StorageListItem {
  key: string;
  size: number;
  lastModified: Date;
}

/**
 * Storage adapter interface.
 *
 * Required methods contract: ['presignUpload', 'presignDownload', 'delete', 'list']
 */
export interface StorageAdapter {
  /** Generate a presigned URL for direct client-side upload. */
  presignUpload(params: StoragePresignUploadParams): Promise<StoragePresignUploadResult>;

  /** Generate a presigned URL for downloading a private object. */
  presignDownload(params: StoragePresignDownloadParams): Promise<string>;

  /** Delete an object from storage. */
  delete(params: StorageDeleteParams): Promise<void>;

  /** List objects under a prefix. */
  list(params: StorageListParams): Promise<StorageListItem[]>;
}

export const STORAGE_ADAPTER_REQUIRED_METHODS = [
  'presignUpload',
  'presignDownload',
  'delete',
  'list',
] as const;
