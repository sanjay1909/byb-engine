/**
 * Tests for storeManager.ts
 *
 * Covers:
 * - createStore(): creates record with correct fields, rejects duplicates
 * - getStore(): finds by ID, returns undefined for unknown
 * - listStores(): lists all, filters by status/owner/provider
 * - updateStatus(): valid transitions, rejects invalid transitions, logs history
 * - updateUrls(): merges URL fields
 * - getSummary(): counts by status and provider
 * - deleteStore(): marks as deleted, validates transition
 * - count(): tracks total stores
 * - Scenario: full lifecycle (created → provisioning → active → suspended → deleted)
 */
import { describe, it, expect } from 'vitest';
import { createStoreManager } from './storeManager.js';
import type { CreateStoreInput } from './storeRecord.js';
import type { StoreProfile } from '@byb/core';
import type { WizardAnswers } from '@byb/config-generator';

/** Minimal profile for testing. */
const TEST_PROFILE: StoreProfile = {
  profileId: 'store-test',
  match: { storeId: 'test-shop' },
  adapters: {
    db: 'dynamodb',
    storage: 's3',
    cdn: 'cloudfront',
    email: 'ses',
    secrets: 'ssm',
    scheduler: 'eventbridge',
    infra: 'aws-cdk',
  },
  features: {
    blog: true,
    campaigns: false,
    payments: 'stripe',
    analytics: true,
    oe: false,
  },
  deployment: { region: 'us-east-1' },
};

/** Minimal wizard answers for testing. */
const TEST_ANSWERS: WizardAnswers = {
  business: {
    storeId: 'test-shop',
    storeName: 'Test Shop',
    siteUrl: 'https://test.shop',
    supportEmail: 'hi@test.shop',
    currency: 'usd',
  },
  shipping: { type: 'flat', flatRate: 10 },
  branding: { primaryColor: '#000', secondaryColor: '#fff' },
  layout: { pages: [{ pageId: 'home', label: 'Home', enabled: true }] },
  features: {
    blog: true,
    campaigns: false,
    payments: 'stripe',
    analytics: true,
    oe: false,
  },
  cloud: { provider: 'aws', region: 'us-east-1' },
};

function createTestInput(
  overrides?: Partial<CreateStoreInput>,
): CreateStoreInput {
  return {
    storeId: 'test-shop',
    storeName: 'Test Shop',
    ownerId: 'user-001',
    cloudProvider: 'aws',
    region: 'us-east-1',
    profile: TEST_PROFILE,
    wizardAnswers: TEST_ANSWERS,
    ...overrides,
  };
}

describe('createStoreManager', () => {
  describe('createStore()', () => {
    it('creates a store record with correct fields', () => {
      const manager = createStoreManager();
      const store = manager.createStore(createTestInput());

      expect(store.storeId).toBe('test-shop');
      expect(store.storeName).toBe('Test Shop');
      expect(store.ownerId).toBe('user-001');
      expect(store.status).toBe('created');
      expect(store.cloudProvider).toBe('aws');
      expect(store.region).toBe('us-east-1');
    });

    it('sets initial history event', () => {
      const manager = createStoreManager();
      const store = manager.createStore(createTestInput());

      expect(store.history).toHaveLength(1);
      expect(store.history[0].status).toBe('created');
      expect(store.history[0].reason).toContain('wizard');
    });

    it('sets timestamps', () => {
      const manager = createStoreManager();
      const before = new Date().toISOString();
      const store = manager.createStore(createTestInput());
      const after = new Date().toISOString();

      expect(store.createdAt >= before).toBe(true);
      expect(store.createdAt <= after).toBe(true);
    });

    it('starts with empty URLs', () => {
      const manager = createStoreManager();
      const store = manager.createStore(createTestInput());
      expect(store.urls).toEqual({});
    });

    it('rejects duplicate storeId', () => {
      const manager = createStoreManager();
      manager.createStore(createTestInput());

      expect(() => manager.createStore(createTestInput())).toThrow(
        'already exists',
      );
    });

    it('includes presetId when provided', () => {
      const manager = createStoreManager();
      const store = manager.createStore(
        createTestInput({ presetId: 'playful-kids' }),
      );
      expect(store.presetId).toBe('playful-kids');
    });
  });

  describe('getStore()', () => {
    it('finds a store by ID', () => {
      const manager = createStoreManager();
      manager.createStore(createTestInput());

      const store = manager.getStore('test-shop');
      expect(store).toBeDefined();
      expect(store!.storeId).toBe('test-shop');
    });

    it('returns undefined for unknown ID', () => {
      const manager = createStoreManager();
      expect(manager.getStore('nonexistent')).toBeUndefined();
    });

    it('returns a copy (not the internal reference)', () => {
      const manager = createStoreManager();
      manager.createStore(createTestInput());
      const a = manager.getStore('test-shop');
      const b = manager.getStore('test-shop');
      expect(a).not.toBe(b);
    });
  });

  describe('listStores()', () => {
    it('lists all stores', () => {
      const manager = createStoreManager();
      manager.createStore(createTestInput({ storeId: 'shop-1', storeName: 'Shop 1' }));
      manager.createStore(createTestInput({ storeId: 'shop-2', storeName: 'Shop 2' }));

      expect(manager.listStores()).toHaveLength(2);
    });

    it('filters by status', () => {
      const manager = createStoreManager();
      manager.createStore(createTestInput({ storeId: 'a', storeName: 'A' }));
      manager.createStore(createTestInput({ storeId: 'b', storeName: 'B' }));
      manager.updateStatus('a', 'provisioning');

      const provisioning = manager.listStores({ status: 'provisioning' });
      expect(provisioning).toHaveLength(1);
      expect(provisioning[0].storeId).toBe('a');
    });

    it('filters by owner', () => {
      const manager = createStoreManager();
      manager.createStore(createTestInput({ storeId: 'x', storeName: 'X', ownerId: 'alice' }));
      manager.createStore(createTestInput({ storeId: 'y', storeName: 'Y', ownerId: 'bob' }));

      const aliceStores = manager.listStores({ ownerId: 'alice' });
      expect(aliceStores).toHaveLength(1);
      expect(aliceStores[0].ownerId).toBe('alice');
    });

    it('filters by cloud provider', () => {
      const manager = createStoreManager();
      manager.createStore(createTestInput({ storeId: 'aws-1', storeName: 'AWS', cloudProvider: 'aws' }));
      manager.createStore(
        createTestInput({ storeId: 'az-1', storeName: 'Azure', cloudProvider: 'azure' }),
      );

      const awsStores = manager.listStores({ cloudProvider: 'aws' });
      expect(awsStores).toHaveLength(1);
    });

    it('returns empty array when no matches', () => {
      const manager = createStoreManager();
      expect(manager.listStores({ status: 'active' })).toEqual([]);
    });
  });

  describe('updateStatus()', () => {
    it('transitions created → provisioning', () => {
      const manager = createStoreManager();
      manager.createStore(createTestInput());
      const updated = manager.updateStatus('test-shop', 'provisioning');

      expect(updated.status).toBe('provisioning');
    });

    it('logs status change in history', () => {
      const manager = createStoreManager();
      manager.createStore(createTestInput());
      manager.updateStatus('test-shop', 'provisioning', 'Starting deployment');

      const store = manager.getStore('test-shop')!;
      expect(store.history).toHaveLength(2);
      expect(store.history[1].status).toBe('provisioning');
      expect(store.history[1].reason).toBe('Starting deployment');
    });

    it('logs error details for error status', () => {
      const manager = createStoreManager();
      manager.createStore(createTestInput());
      manager.updateStatus(
        'test-shop',
        'error',
        'Provisioning failed',
        'DynamoDB table creation timed out',
      );

      const store = manager.getStore('test-shop')!;
      expect(store.history[1].errorDetail).toContain('DynamoDB');
    });

    it('rejects invalid transitions', () => {
      const manager = createStoreManager();
      manager.createStore(createTestInput());

      // created → active is not allowed (must go through provisioning)
      expect(() =>
        manager.updateStatus('test-shop', 'active'),
      ).toThrow('cannot go from');
    });

    it('rejects transitions from deleted', () => {
      const manager = createStoreManager();
      manager.createStore(createTestInput());
      manager.updateStatus('test-shop', 'provisioning');
      manager.updateStatus('test-shop', 'deleted');

      expect(() =>
        manager.updateStatus('test-shop', 'active'),
      ).toThrow('terminal state');
    });

    it('throws for unknown store', () => {
      const manager = createStoreManager();
      expect(() =>
        manager.updateStatus('ghost', 'provisioning'),
      ).toThrow('not found');
    });
  });

  describe('updateUrls()', () => {
    it('sets URL fields', () => {
      const manager = createStoreManager();
      manager.createStore(createTestInput());
      const updated = manager.updateUrls('test-shop', {
        siteUrl: 'https://test.shop',
        apiUrl: 'https://api.test.shop',
      });

      expect(updated.urls.siteUrl).toBe('https://test.shop');
      expect(updated.urls.apiUrl).toBe('https://api.test.shop');
    });

    it('merges with existing URLs', () => {
      const manager = createStoreManager();
      manager.createStore(createTestInput());
      manager.updateUrls('test-shop', { siteUrl: 'https://site' });
      manager.updateUrls('test-shop', { adminUrl: 'https://admin' });

      const store = manager.getStore('test-shop')!;
      expect(store.urls.siteUrl).toBe('https://site');
      expect(store.urls.adminUrl).toBe('https://admin');
    });

    it('throws for unknown store', () => {
      const manager = createStoreManager();
      expect(() =>
        manager.updateUrls('ghost', { siteUrl: 'x' }),
      ).toThrow('not found');
    });
  });

  describe('getSummary()', () => {
    it('returns counts by status and provider', () => {
      const manager = createStoreManager();
      manager.createStore(createTestInput({ storeId: 'a', storeName: 'A' }));
      manager.createStore(createTestInput({ storeId: 'b', storeName: 'B' }));
      manager.createStore(
        createTestInput({ storeId: 'c', storeName: 'C', cloudProvider: 'azure' }),
      );
      manager.updateStatus('a', 'provisioning');
      manager.updateStatus('a', 'active');

      const summary = manager.getSummary();
      expect(summary.total).toBe(3);
      expect(summary.byStatus.active).toBe(1);
      expect(summary.byStatus.created).toBe(2);
      expect(summary.byProvider.aws).toBe(2);
      expect(summary.byProvider.azure).toBe(1);
    });
  });

  describe('deleteStore()', () => {
    it('marks store as deleted', () => {
      const manager = createStoreManager();
      manager.createStore(createTestInput());
      const deleted = manager.deleteStore('test-shop', 'No longer needed');

      expect(deleted.status).toBe('deleted');
      expect(deleted.history[deleted.history.length - 1].reason).toBe(
        'No longer needed',
      );
    });

    it('throws for unknown store', () => {
      const manager = createStoreManager();
      expect(() => manager.deleteStore('ghost')).toThrow('not found');
    });
  });

  describe('count()', () => {
    it('tracks total stores', () => {
      const manager = createStoreManager();
      expect(manager.count()).toBe(0);

      manager.createStore(createTestInput({ storeId: 'one', storeName: 'One' }));
      expect(manager.count()).toBe(1);

      manager.createStore(createTestInput({ storeId: 'two', storeName: 'Two' }));
      expect(manager.count()).toBe(2);
    });
  });

  describe('scenario: full store lifecycle', () => {
    it('created → provisioning → active → suspended → active → deprovisioning → deleted', () => {
      const manager = createStoreManager();
      const store = manager.createStore(createTestInput());
      expect(store.status).toBe('created');

      manager.updateStatus('test-shop', 'provisioning', 'Deploy started');
      manager.updateUrls('test-shop', {
        apiUrl: 'https://api.test.shop',
        siteUrl: 'https://test.shop',
      });
      manager.updateStatus('test-shop', 'active', 'Deployment complete');

      let current = manager.getStore('test-shop')!;
      expect(current.status).toBe('active');
      expect(current.urls.siteUrl).toBe('https://test.shop');

      manager.updateStatus('test-shop', 'suspended', 'Billing issue');
      manager.updateStatus('test-shop', 'active', 'Payment received');
      manager.updateStatus('test-shop', 'deprovisioning', 'Owner requested teardown');
      manager.updateStatus('test-shop', 'deleted', 'Resources cleaned up');

      current = manager.getStore('test-shop')!;
      expect(current.status).toBe('deleted');
      expect(current.history).toHaveLength(7);

      const statuses = current.history.map((e) => e.status);
      expect(statuses).toEqual([
        'created',
        'provisioning',
        'active',
        'suspended',
        'active',
        'deprovisioning',
        'deleted',
      ]);
    });
  });
});
