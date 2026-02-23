/**
 * mockAdapters.test.ts — Comprehensive tests for all 9 mock adapter implementations.
 *
 * Each adapter is tested for:
 * - Contract compliance (using assertAdapterContract from @byb/core)
 * - CRUD / core functionality
 * - Inspector methods
 * - clear() reset behavior
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  assertAdapterContract,
  DB_ADAPTER_REQUIRED_METHODS,
  STORAGE_ADAPTER_REQUIRED_METHODS,
  CDN_ADAPTER_REQUIRED_METHODS,
  EMAIL_ADAPTER_REQUIRED_METHODS,
  SECRETS_ADAPTER_REQUIRED_METHODS,
  SCHEDULER_ADAPTER_REQUIRED_METHODS,
  INFRA_ADAPTER_REQUIRED_METHODS,
  DNS_ADAPTER_REQUIRED_METHODS,
  PIPELINE_ADAPTER_REQUIRED_METHODS,
} from '@byb/core';

import { createMockDbAdapter, type MockDbAdapter } from './mockDbAdapter.js';
import {
  createMockStorageAdapter,
  type MockStorageAdapter,
} from './mockStorageAdapter.js';
import { createMockCdnAdapter, type MockCdnAdapter } from './mockCdnAdapter.js';
import {
  createMockEmailAdapter,
  type MockEmailAdapter,
} from './mockEmailAdapter.js';
import {
  createMockSecretsAdapter,
  type MockSecretsAdapter,
} from './mockSecretsAdapter.js';
import {
  createMockSchedulerAdapter,
  type MockSchedulerAdapter,
} from './mockSchedulerAdapter.js';
import {
  createMockInfraAdapter,
  type MockInfraAdapter,
} from './mockInfraAdapter.js';
import { createMockDnsAdapter, type MockDnsAdapter } from './mockDnsAdapter.js';
import {
  createMockPipelineAdapter,
  type MockPipelineAdapter,
} from './mockPipelineAdapter.js';

// ---------------------------------------------------------------------------
// mockDbAdapter
// ---------------------------------------------------------------------------
describe('mockDbAdapter', () => {
  let db: MockDbAdapter;

  beforeEach(() => {
    db = createMockDbAdapter();
  });

  it('passes contract validation for all required DbAdapter methods', () => {
    expect(() =>
      assertAdapterContract(
        db as unknown as Record<string, unknown>,
        [...DB_ADAPTER_REQUIRED_METHODS],
        'mock-db',
        'db',
      ),
    ).not.toThrow();
  });

  it('put then get returns the item', async () => {
    await db.put({ item: { pk: 'USER#1', sk: 'PROFILE', name: 'Alice' } });
    const result = await db.get({ pk: 'USER#1', sk: 'PROFILE' });
    expect(result).toEqual({ pk: 'USER#1', sk: 'PROFILE', name: 'Alice' });
  });

  it('get returns null for nonexistent key', async () => {
    const result = await db.get({ pk: 'MISSING', sk: 'NONE' });
    expect(result).toBeNull();
  });

  it('delete removes an existing item', async () => {
    await db.put({ item: { pk: 'USER#1', sk: 'PROFILE', name: 'Alice' } });
    await db.delete({ pk: 'USER#1', sk: 'PROFILE' });
    const result = await db.get({ pk: 'USER#1', sk: 'PROFILE' });
    expect(result).toBeNull();
  });

  it('query by pk returns all matching items', async () => {
    await db.put({ item: { pk: 'ORDER#1', sk: 'ITEM#A', qty: 2 } });
    await db.put({ item: { pk: 'ORDER#1', sk: 'ITEM#B', qty: 5 } });
    await db.put({ item: { pk: 'ORDER#2', sk: 'ITEM#C', qty: 1 } });

    const result = await db.query({ pk: 'ORDER#1' });
    expect(result.items).toHaveLength(2);
    expect(result.items.map((i) => i.sk)).toEqual(
      expect.arrayContaining(['ITEM#A', 'ITEM#B']),
    );
  });

  it('query with skPrefix filters correctly', async () => {
    await db.put({ item: { pk: 'ORDER#1', sk: 'ITEM#A', qty: 2 } });
    await db.put({ item: { pk: 'ORDER#1', sk: 'META#1', status: 'ok' } });

    const result = await db.query({ pk: 'ORDER#1', skPrefix: 'ITEM' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].sk).toBe('ITEM#A');
  });

  it('transactWrite applies multiple put and delete operations atomically', async () => {
    await db.put({ item: { pk: 'A', sk: '1', val: 'old' } });

    await db.transactWrite([
      { type: 'put', params: { item: { pk: 'A', sk: '1', val: 'new' } } },
      { type: 'put', params: { item: { pk: 'B', sk: '2', val: 'added' } } },
      { type: 'delete', params: { pk: 'A', sk: '1' } },
    ]);

    // The delete after put in the same transaction should remove the item
    const a = await db.get({ pk: 'A', sk: '1' });
    expect(a).toBeNull();

    const b = await db.get({ pk: 'B', sk: '2' });
    expect(b).toEqual({ pk: 'B', sk: '2', val: 'added' });
  });

  it('clear() resets all stored data', async () => {
    await db.put({ item: { pk: 'X', sk: 'Y', data: 1 } });
    expect(db.getStoredItems().size).toBeGreaterThan(0);

    db.clear();
    expect(db.getStoredItems().size).toBe(0);
    const result = await db.get({ pk: 'X', sk: 'Y' });
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// mockStorageAdapter
// ---------------------------------------------------------------------------
describe('mockStorageAdapter', () => {
  let storage: MockStorageAdapter;

  beforeEach(() => {
    storage = createMockStorageAdapter();
  });

  it('passes contract validation for all required StorageAdapter methods', () => {
    expect(() =>
      assertAdapterContract(
        storage as unknown as Record<string, unknown>,
        [...STORAGE_ADAPTER_REQUIRED_METHODS],
        'mock-storage',
        'storage',
      ),
    ).not.toThrow();
  });

  it('presignUpload returns upload and public URLs', async () => {
    const result = await storage.presignUpload({
      key: 'images/photo.jpg',
      contentType: 'image/jpeg',
    });
    expect(result.uploadUrl).toBe('mock://upload/images/photo.jpg');
    expect(result.publicUrl).toBe('mock://public/images/photo.jpg');
  });

  it('presignDownload returns a download URL', async () => {
    const url = await storage.presignDownload({ key: 'docs/file.pdf' });
    expect(url).toBe('mock://download/docs/file.pdf');
  });

  it('list returns items matching the prefix', async () => {
    await storage.presignUpload({ key: 'img/a.jpg', contentType: 'image/jpeg' });
    await storage.presignUpload({ key: 'img/b.jpg', contentType: 'image/jpeg' });
    await storage.presignUpload({ key: 'docs/c.pdf', contentType: 'application/pdf' });

    const items = await storage.list({ prefix: 'img/' });
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.key)).toEqual(
      expect.arrayContaining(['img/a.jpg', 'img/b.jpg']),
    );
  });

  it('delete removes an item from storage', async () => {
    await storage.presignUpload({ key: 'tmp/file.txt', contentType: 'text/plain' });
    expect(storage.getStoredObjects().has('tmp/file.txt')).toBe(true);

    await storage.delete({ key: 'tmp/file.txt' });
    expect(storage.getStoredObjects().has('tmp/file.txt')).toBe(false);
  });

  it('clear() resets all stored objects', async () => {
    await storage.presignUpload({ key: 'a.txt', contentType: 'text/plain' });
    await storage.presignUpload({ key: 'b.txt', contentType: 'text/plain' });
    expect(storage.getStoredObjects().size).toBe(2);

    storage.clear();
    expect(storage.getStoredObjects().size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// mockCdnAdapter
// ---------------------------------------------------------------------------
describe('mockCdnAdapter', () => {
  let cdn: MockCdnAdapter;

  beforeEach(() => {
    cdn = createMockCdnAdapter();
  });

  it('passes contract validation for all required CdnAdapter methods', () => {
    expect(() =>
      assertAdapterContract(
        cdn as unknown as Record<string, unknown>,
        [...CDN_ADAPTER_REQUIRED_METHODS],
        'mock-cdn',
        'cdn',
      ),
    ).not.toThrow();
  });

  it('createDistribution returns a distribution ID and domain', async () => {
    const result = await cdn.createDistribution({
      originDomain: 'my-bucket.s3.amazonaws.com',
    });
    expect(result.distributionId).toMatch(/^mock-cdn-\d+$/);
    expect(result.cdnDomain).toMatch(/^mock-\d+\.cdn\.local$/);
  });

  it('invalidateCache records the invalidation', async () => {
    const { distributionId } = await cdn.createDistribution({
      originDomain: 'origin.local',
    });

    await cdn.invalidateCache({
      distributionId,
      paths: ['/index.html', '/assets/*'],
    });

    const invalidations = cdn.getInvalidations();
    expect(invalidations).toHaveLength(1);
    expect(invalidations[0].distributionId).toBe(distributionId);
    expect(invalidations[0].paths).toEqual(['/index.html', '/assets/*']);
  });

  it('getDistributionDomain returns the correct domain for a distribution', async () => {
    const { distributionId, cdnDomain } = await cdn.createDistribution({
      originDomain: 'origin.local',
    });

    const domain = await cdn.getDistributionDomain(distributionId);
    expect(domain).toBe(cdnDomain);
  });

  it('clear() resets distributions and invalidations', async () => {
    await cdn.createDistribution({ originDomain: 'origin.local' });
    await cdn.invalidateCache({
      distributionId: 'mock-cdn-1',
      paths: ['/'],
    });

    cdn.clear();
    expect(cdn.getDistributions().size).toBe(0);
    expect(cdn.getInvalidations()).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// mockEmailAdapter
// ---------------------------------------------------------------------------
describe('mockEmailAdapter', () => {
  let email: MockEmailAdapter;

  beforeEach(() => {
    email = createMockEmailAdapter();
  });

  it('passes contract validation for all required EmailAdapter methods', () => {
    expect(() =>
      assertAdapterContract(
        email as unknown as Record<string, unknown>,
        [...EMAIL_ADAPTER_REQUIRED_METHODS],
        'mock-email',
        'email',
      ),
    ).not.toThrow();
  });

  it('send records a raw email with the correct shape', async () => {
    const result = await email.send({
      from: 'sender@test.com',
      to: ['recipient@test.com'],
      subject: 'Hello',
      htmlBody: '<p>Hi</p>',
    });

    expect(result.messageId).toMatch(/^mock-email-\d+$/);
    expect(result.accepted).toBe(true);

    const sent = email.getSentEmails();
    expect(sent).toHaveLength(1);
    expect(sent[0].type).toBe('raw');
    expect(sent[0].from).toBe('sender@test.com');
    expect(sent[0].subject).toBe('Hello');
    expect(sent[0].htmlBody).toBe('<p>Hi</p>');
  });

  it('sendTemplated records a templated email', async () => {
    const result = await email.sendTemplated({
      from: 'noreply@test.com',
      to: ['user@test.com'],
      templateId: 'welcome-template',
      templateData: { name: 'Alice' },
    });

    expect(result.messageId).toMatch(/^mock-email-\d+$/);
    expect(result.accepted).toBe(true);

    const sent = email.getSentEmails();
    expect(sent).toHaveLength(1);
    expect(sent[0].type).toBe('templated');
    expect(sent[0].templateId).toBe('welcome-template');
    expect(sent[0].templateData).toEqual({ name: 'Alice' });
  });

  it('getSentEmails returns all sent emails', async () => {
    await email.send({
      from: 'a@test.com',
      to: ['b@test.com'],
      subject: 'First',
      htmlBody: '<p>1</p>',
    });
    await email.sendTemplated({
      from: 'a@test.com',
      to: ['c@test.com'],
      templateId: 'tpl',
      templateData: {},
    });

    expect(email.getSentEmails()).toHaveLength(2);
  });

  it('clear() resets sent emails', async () => {
    await email.send({
      from: 'a@test.com',
      to: ['b@test.com'],
      subject: 'Test',
      htmlBody: '<p>t</p>',
    });
    expect(email.getSentEmails()).toHaveLength(1);

    email.clear();
    expect(email.getSentEmails()).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// mockSecretsAdapter
// ---------------------------------------------------------------------------
describe('mockSecretsAdapter', () => {
  let secrets: MockSecretsAdapter;

  beforeEach(() => {
    secrets = createMockSecretsAdapter();
  });

  it('passes contract validation for all required SecretsAdapter methods', () => {
    expect(() =>
      assertAdapterContract(
        secrets as unknown as Record<string, unknown>,
        [...SECRETS_ADAPTER_REQUIRED_METHODS],
        'mock-secrets',
        'secrets',
      ),
    ).not.toThrow();
  });

  it('putSecret then getSecret returns the stored value', async () => {
    await secrets.putSecret({ name: 'API_KEY', value: 'secret-123' });
    const value = await secrets.getSecret({ name: 'API_KEY' });
    expect(value).toBe('secret-123');
  });

  it('getSecret returns null for a nonexistent key', async () => {
    const value = await secrets.getSecret({ name: 'MISSING' });
    expect(value).toBeNull();
  });

  it('deleteSecret removes the secret', async () => {
    await secrets.putSecret({ name: 'TOKEN', value: 'abc' });
    await secrets.deleteSecret({ name: 'TOKEN' });
    const value = await secrets.getSecret({ name: 'TOKEN' });
    expect(value).toBeNull();
  });

  it('clear() resets all stored secrets', async () => {
    await secrets.putSecret({ name: 'A', value: '1' });
    await secrets.putSecret({ name: 'B', value: '2' });
    expect(secrets.getAllSecrets().size).toBe(2);

    secrets.clear();
    expect(secrets.getAllSecrets().size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// mockSchedulerAdapter
// ---------------------------------------------------------------------------
describe('mockSchedulerAdapter', () => {
  let scheduler: MockSchedulerAdapter;

  beforeEach(() => {
    scheduler = createMockSchedulerAdapter();
  });

  it('passes contract validation for all required SchedulerAdapter methods', () => {
    expect(() =>
      assertAdapterContract(
        scheduler as unknown as Record<string, unknown>,
        [...SCHEDULER_ADAPTER_REQUIRED_METHODS],
        'mock-scheduler',
        'scheduler',
      ),
    ).not.toThrow();
  });

  it('createOneTime stores a one-time schedule', async () => {
    await scheduler.createOneTime({
      name: 'send-report',
      scheduleAt: '2026-03-01T10:00:00Z',
      target: { type: 'http', endpoint: 'https://api.local/report' },
      payload: { reportId: 'R1' },
    });

    const schedules = scheduler.getSchedules();
    expect(schedules.size).toBe(1);
    const entry = schedules.get('send-report')!;
    expect(entry.type).toBe('one-time');
    expect(entry.scheduleAt).toBe('2026-03-01T10:00:00Z');
    expect(entry.payload).toEqual({ reportId: 'R1' });
  });

  it('createRecurring stores a recurring schedule', async () => {
    await scheduler.createRecurring({
      name: 'daily-cleanup',
      schedule: 'cron(0 3 * * ? *)',
      target: { type: 'function', endpoint: 'cleanup-handler' },
      payload: { scope: 'all' },
    });

    const schedules = scheduler.getSchedules();
    expect(schedules.size).toBe(1);
    const entry = schedules.get('daily-cleanup')!;
    expect(entry.type).toBe('recurring');
    expect(entry.schedule).toBe('cron(0 3 * * ? *)');
  });

  it('deleteSchedule removes a schedule', async () => {
    await scheduler.createOneTime({
      name: 'temp-job',
      scheduleAt: '2026-04-01T00:00:00Z',
      target: { type: 'http', endpoint: 'https://api.local/temp' },
      payload: {},
    });
    expect(scheduler.getSchedules().size).toBe(1);

    await scheduler.deleteSchedule({ name: 'temp-job' });
    expect(scheduler.getSchedules().size).toBe(0);
  });

  it('getSchedules returns a copy of all stored schedules', async () => {
    await scheduler.createOneTime({
      name: 'job-a',
      scheduleAt: '2026-05-01T00:00:00Z',
      target: { type: 'http', endpoint: 'https://a.local' },
      payload: {},
    });
    await scheduler.createRecurring({
      name: 'job-b',
      schedule: 'rate(1 hour)',
      target: { type: 'function', endpoint: 'handler-b' },
      payload: {},
    });

    const schedules = scheduler.getSchedules();
    expect(schedules.size).toBe(2);
    expect(schedules.has('job-a')).toBe(true);
    expect(schedules.has('job-b')).toBe(true);
  });

  it('clear() resets all schedules', async () => {
    await scheduler.createOneTime({
      name: 'temp',
      scheduleAt: '2026-06-01T00:00:00Z',
      target: { type: 'http', endpoint: 'https://x.local' },
      payload: {},
    });
    scheduler.clear();
    expect(scheduler.getSchedules().size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// mockInfraAdapter
// ---------------------------------------------------------------------------
describe('mockInfraAdapter', () => {
  let infra: MockInfraAdapter;

  beforeEach(() => {
    infra = createMockInfraAdapter();
  });

  it('passes contract validation for all required InfraAdapter methods', () => {
    expect(() =>
      assertAdapterContract(
        infra as unknown as Record<string, unknown>,
        [...INFRA_ADAPTER_REQUIRED_METHODS],
        'mock-infra',
        'infra',
      ),
    ).not.toThrow();
  });

  it('provision returns a stack with completed status and mock outputs', async () => {
    const result = await infra.provision({
      storeId: 'my-store',
      template: 'ecommerce-standard',
      params: {},
    });

    expect(result.stackId).toBe('mock-stack-my-store');
    expect(result.status).toBe('completed');
    expect(result.outputs).toEqual({
      apiEndpoint: 'https://mock-api-my-store.local',
      frontendUrl: 'https://mock-frontend-my-store.local',
    });
  });

  it('getStatus returns the correct status for a provisioned stack', async () => {
    const { stackId } = await infra.provision({
      storeId: 'shop-1',
      template: 'basic',
      params: {},
    });

    const status = await infra.getStatus({ stackId });
    expect(status.stackId).toBe(stackId);
    expect(status.status).toBe('completed');
  });

  it('destroy removes the stack', async () => {
    const { stackId } = await infra.provision({
      storeId: 'temp-store',
      template: 'basic',
      params: {},
    });

    await infra.destroy({ stackId });
    expect(infra.getStacks().has(stackId)).toBe(false);
  });

  it('getStatus throws for a nonexistent stack', async () => {
    await expect(
      infra.getStatus({ stackId: 'nonexistent' }),
    ).rejects.toThrow('not found');
  });

  it('clear() resets all provisioned stacks', async () => {
    await infra.provision({ storeId: 's1', template: 't', params: {} });
    await infra.provision({ storeId: 's2', template: 't', params: {} });
    expect(infra.getStacks().size).toBe(2);

    infra.clear();
    expect(infra.getStacks().size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// mockDnsAdapter
// ---------------------------------------------------------------------------
describe('mockDnsAdapter', () => {
  let dns: MockDnsAdapter;

  beforeEach(() => {
    dns = createMockDnsAdapter();
  });

  it('passes contract validation for all required DnsAdapter methods', () => {
    expect(() =>
      assertAdapterContract(
        dns as unknown as Record<string, unknown>,
        [...DNS_ADAPTER_REQUIRED_METHODS],
        'mock-dns',
        'dns',
      ),
    ).not.toThrow();
  });

  it('configureDomain returns a zone ID and record name', async () => {
    const result = await dns.configureDomain({
      domain: 'shop.example.com',
      targetDomain: 'cdn-123.cloudfront.net',
    });

    expect(result.zoneId).toMatch(/^mock-zone-\d+$/);
    expect(result.recordName).toBe('shop.example.com');
    expect(result.status).toBe('pending');
  });

  it('checkPropagation returns propagation status', async () => {
    // With delay=0, propagation is immediate
    await dns.configureDomain({
      domain: 'app.example.com',
      targetDomain: 'origin.local',
    });

    const status = await dns.checkPropagation({ domain: 'app.example.com' });
    expect(status.domain).toBe('app.example.com');
    expect(status.propagated).toBe(true);
    expect(status.checkedAt).toBeTruthy();
  });

  it('provisionSsl returns a certificate ID with issued status', async () => {
    await dns.configureDomain({
      domain: 'secure.example.com',
      targetDomain: 'origin.local',
    });

    const result = await dns.provisionSsl({ domain: 'secure.example.com' });
    expect(result.certificateId).toMatch(/^mock-cert-\d+$/);
    expect(result.status).toBe('issued');
  });

  it('getStatus returns full DNS status for a configured domain', async () => {
    await dns.configureDomain({
      domain: 'store.example.com',
      targetDomain: 'cdn.local',
    });
    await dns.provisionSsl({ domain: 'store.example.com' });

    const status = await dns.getStatus({ domain: 'store.example.com' });
    expect(status.domain).toBe('store.example.com');
    expect(status.configured).toBe(true);
    expect(status.propagated).toBe(true);
    expect(status.sslStatus).toBe('issued');
    expect(status.certificateId).toMatch(/^mock-cert-/);
  });

  it('getStatus returns unconfigured status for unknown domain', async () => {
    const status = await dns.getStatus({ domain: 'unknown.example.com' });
    expect(status.configured).toBe(false);
    expect(status.propagated).toBe(false);
    expect(status.sslStatus).toBe('none');
  });

  it('clear() resets all domain entries', async () => {
    await dns.configureDomain({
      domain: 'a.example.com',
      targetDomain: 'origin.local',
    });
    expect(dns.getDomains().size).toBe(1);

    dns.clear();
    expect(dns.getDomains().size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// mockPipelineAdapter
// ---------------------------------------------------------------------------
describe('mockPipelineAdapter', () => {
  let pipeline: MockPipelineAdapter;

  beforeEach(() => {
    pipeline = createMockPipelineAdapter();
  });

  it('passes contract validation for all required PipelineAdapter methods', () => {
    expect(() =>
      assertAdapterContract(
        pipeline as unknown as Record<string, unknown>,
        [...PIPELINE_ADAPTER_REQUIRED_METHODS],
        'mock-pipeline',
        'pipeline',
      ),
    ).not.toThrow();
  });

  it('createPipeline returns a pipeline ID with created status', async () => {
    const result = await pipeline.createPipeline({
      storeId: 'my-store',
      repoUrl: 'https://github.com/example/repo',
      branch: 'main',
    });

    expect(result.pipelineId).toMatch(/^mock-pipeline-\d+$/);
    expect(result.status).toBe('created');

    // Verify it is stored
    const pipelines = pipeline.getPipelines();
    expect(pipelines.size).toBe(1);
    expect(pipelines.get(result.pipelineId)!.storeId).toBe('my-store');
  });

  it('triggerBuild returns a build result with succeeded status', async () => {
    const { pipelineId } = await pipeline.createPipeline({
      storeId: 'store-1',
      repoUrl: 'https://github.com/example/repo',
      branch: 'main',
    });

    const result = await pipeline.triggerBuild({ pipelineId });
    expect(result.buildId).toMatch(/^mock-build-\d+$/);
    expect(result.status).toBe('succeeded');
    expect(result.startedAt).toBeTruthy();

    // Pipeline status should now be active
    const p = pipeline.getPipelines().get(pipelineId)!;
    expect(p.status).toBe('active');
  });

  it('getBuildStatus returns correct status for an existing build', async () => {
    const { pipelineId } = await pipeline.createPipeline({
      storeId: 'store-2',
      repoUrl: 'https://github.com/example/repo',
      branch: 'main',
    });
    const { buildId } = await pipeline.triggerBuild({ pipelineId });

    const status = await pipeline.getBuildStatus({ buildId });
    expect(status.buildId).toBe(buildId);
    expect(status.status).toBe('succeeded');
    expect(status.startedAt).toBeTruthy();
    expect(status.completedAt).toBeTruthy();
    expect(status.durationMs).toBeGreaterThan(0);
  });

  it('getBuildStatus throws for nonexistent build', async () => {
    await expect(
      pipeline.getBuildStatus({ buildId: 'nonexistent' }),
    ).rejects.toThrow('not found');
  });

  it('getDeploymentUrl returns a mock URL string', async () => {
    const url = await pipeline.getDeploymentUrl({ buildId: 'mock-build-1' });
    expect(url).toBe('https://mock-deploy-mock-build-1.local');
  });

  it('clear() resets all pipelines and builds', async () => {
    const { pipelineId } = await pipeline.createPipeline({
      storeId: 'store-x',
      repoUrl: 'https://github.com/example/repo',
      branch: 'main',
    });
    await pipeline.triggerBuild({ pipelineId });

    expect(pipeline.getPipelines().size).toBe(1);
    expect(pipeline.getBuilds().size).toBe(1);

    pipeline.clear();
    expect(pipeline.getPipelines().size).toBe(0);
    expect(pipeline.getBuilds().size).toBe(0);
  });
});
