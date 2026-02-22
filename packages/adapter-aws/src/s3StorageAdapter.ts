/**
 * s3StorageAdapter.ts — AWS S3 implementation of StorageAdapter.
 *
 * Wraps the AWS SDK v3 S3 client for object storage operations.
 * Supports presigned uploads (frontend uploads directly to S3),
 * presigned downloads, deletion, and listing.
 *
 * How it connects to the system:
 * - Registered in the adapter registry under domain 'storage' with ID 's3'
 * - Resolved via store profile (profile.adapters.storage = 's3')
 * - Used by product image upload, hero images, and static asset management
 *
 * Usage:
 *   const adapter = createS3StorageAdapter({ bucketName: 'my-bucket', region: 'us-east-1' });
 *   const { uploadUrl } = await adapter.presignUpload({ key: 'images/hero.jpg', contentType: 'image/jpeg' });
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  StorageAdapter,
  StoragePresignUploadParams,
  StoragePresignUploadResult,
  StoragePresignDownloadParams,
  StorageDeleteParams,
  StorageListParams,
  StorageListItem,
} from '@byb/core';

/**
 * Configuration options for the S3 storage adapter.
 */
export interface S3StorageAdapterOptions {
  /** S3 bucket name */
  bucketName: string;
  /** AWS region (e.g., 'us-east-1') */
  region?: string;
  /** CloudFront domain for public URLs (if using CDN). Falls back to S3 URL. */
  cdnDomain?: string;
  /** Optional: inject a pre-configured S3 client (for testing) */
  s3Client?: S3Client;
}

/**
 * Creates an S3 storage adapter implementing the StorageAdapter interface.
 *
 * @param options - Bucket name, region, optional CDN domain, and optional injected client
 * @returns A StorageAdapter instance backed by S3
 */
export function createS3StorageAdapter(options: S3StorageAdapterOptions): StorageAdapter {
  const { bucketName, region, cdnDomain } = options;

  const client = options.s3Client ?? new S3Client({ region });

  /**
   * Constructs the public URL for an object.
   * Uses CDN domain if configured, otherwise falls back to S3 URL.
   */
  function getPublicUrl(key: string): string {
    if (cdnDomain) {
      return `https://${cdnDomain}/${key}`;
    }
    return `https://${bucketName}.s3.${region ?? 'us-east-1'}.amazonaws.com/${key}`;
  }

  return {
    async presignUpload(
      params: StoragePresignUploadParams,
    ): Promise<StoragePresignUploadResult> {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: params.key,
        ContentType: params.contentType,
      });

      const uploadUrl = await getSignedUrl(client, command, {
        expiresIn: params.expiresIn ?? 300,
      });

      return {
        uploadUrl,
        publicUrl: getPublicUrl(params.key),
      };
    },

    async presignDownload(params: StoragePresignDownloadParams): Promise<string> {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: params.key,
      });

      return getSignedUrl(client, command, {
        expiresIn: params.expiresIn ?? 300,
      });
    },

    async delete(params: StorageDeleteParams): Promise<void> {
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: params.key,
        }),
      );
    },

    async list(params: StorageListParams): Promise<StorageListItem[]> {
      const result = await client.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: params.prefix,
          MaxKeys: params.limit,
        }),
      );

      return (result.Contents ?? []).map((obj) => ({
        key: obj.Key!,
        size: obj.Size ?? 0,
        lastModified: obj.LastModified ?? new Date(),
      }));
    },
  };
}
