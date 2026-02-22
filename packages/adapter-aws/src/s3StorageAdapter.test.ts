/**
 * Tests for s3StorageAdapter.ts — validates the S3 StorageAdapter implementation.
 *
 * Uses mock S3 client. Verifies command construction, presigned URL generation,
 * and response mapping.
 *
 * Covers:
 * - presignUpload: returns uploadUrl and publicUrl
 * - presignDownload: returns presigned download URL
 * - delete: sends DeleteObjectCommand
 * - list: maps S3 Contents to StorageListItem[]
 * - CDN domain in public URLs
 * - Satisfies StorageAdapter contract
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createS3StorageAdapter } from './s3StorageAdapter.js';
import { assertAdapterContract, STORAGE_ADAPTER_REQUIRED_METHODS } from '@byb/core';

// Mock the S3 request presigner
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://presigned-url.example.com'),
}));

function createMockS3Client() {
  return {
    send: vi.fn(),
  };
}

describe('createS3StorageAdapter', () => {
  let mockClient: ReturnType<typeof createMockS3Client>;
  let adapter: ReturnType<typeof createS3StorageAdapter>;

  beforeEach(() => {
    mockClient = createMockS3Client();
    adapter = createS3StorageAdapter({
      bucketName: 'test-bucket',
      region: 'us-east-1',
      s3Client: mockClient as any,
    });
  });

  it('satisfies the StorageAdapter contract', () => {
    assertAdapterContract(
      adapter as unknown as Record<string, unknown>,
      [...STORAGE_ADAPTER_REQUIRED_METHODS],
      's3',
      'storage',
    );
  });

  describe('presignUpload', () => {
    it('returns uploadUrl and publicUrl', async () => {
      const result = await adapter.presignUpload({
        key: 'images/hero.jpg',
        contentType: 'image/jpeg',
      });

      expect(result.uploadUrl).toBe('https://presigned-url.example.com');
      expect(result.publicUrl).toBe(
        'https://test-bucket.s3.us-east-1.amazonaws.com/images/hero.jpg',
      );
    });

    it('uses CDN domain for publicUrl when configured', async () => {
      const cdnAdapter = createS3StorageAdapter({
        bucketName: 'test-bucket',
        region: 'us-east-1',
        cdnDomain: 'd1234.cloudfront.net',
        s3Client: mockClient as any,
      });

      const result = await cdnAdapter.presignUpload({
        key: 'images/hero.jpg',
        contentType: 'image/jpeg',
      });

      expect(result.publicUrl).toBe(
        'https://d1234.cloudfront.net/images/hero.jpg',
      );
    });
  });

  describe('presignDownload', () => {
    it('returns a presigned download URL', async () => {
      const url = await adapter.presignDownload({ key: 'files/report.pdf' });

      expect(url).toBe('https://presigned-url.example.com');
    });
  });

  describe('delete', () => {
    it('sends DeleteObjectCommand with correct bucket and key', async () => {
      mockClient.send.mockResolvedValue({});

      await adapter.delete({ key: 'images/old.jpg' });

      const command = mockClient.send.mock.calls[0][0];
      expect(command.input).toEqual({
        Bucket: 'test-bucket',
        Key: 'images/old.jpg',
      });
    });
  });

  describe('list', () => {
    it('maps S3 Contents to StorageListItem array', async () => {
      const now = new Date();
      mockClient.send.mockResolvedValue({
        Contents: [
          { Key: 'images/a.jpg', Size: 1024, LastModified: now },
          { Key: 'images/b.png', Size: 2048, LastModified: now },
        ],
      });

      const items = await adapter.list({ prefix: 'images/' });

      expect(items).toHaveLength(2);
      expect(items[0]).toEqual({ key: 'images/a.jpg', size: 1024, lastModified: now });
      expect(items[1]).toEqual({ key: 'images/b.png', size: 2048, lastModified: now });
    });

    it('returns empty array when no contents', async () => {
      mockClient.send.mockResolvedValue({});

      const items = await adapter.list({ prefix: 'empty/' });
      expect(items).toEqual([]);
    });

    it('passes limit as MaxKeys', async () => {
      mockClient.send.mockResolvedValue({ Contents: [] });

      await adapter.list({ prefix: 'images/', limit: 5 });

      const command = mockClient.send.mock.calls[0][0];
      expect(command.input.MaxKeys).toBe(5);
    });
  });
});
