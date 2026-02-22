/**
 * Tests for registerAwsAdapters.ts — integration test for bulk registration.
 *
 * Verifies that registerAllAwsAdapters creates registries for all 7 domains
 * and that each registry can resolve its adapter with contract validation passing.
 *
 * This is the key integration test that proves the adapter pattern works end-to-end:
 * register → resolve → contract validate → return typed adapter.
 */
import { describe, it, expect } from 'vitest';
import { registerAllAwsAdapters } from './registerAwsAdapters.js';

describe('registerAllAwsAdapters', () => {
  const registries = registerAllAwsAdapters({
    tableName: 'test-table',
    bucketName: 'test-bucket',
    region: 'us-east-1',
    schedulerRoleArn: 'arn:aws:iam::123:role/test',
    cdnDomain: 'd1234.cloudfront.net',
    templateUrl: 'https://s3.amazonaws.com/templates/test.yaml',
  });

  it('creates registries for all 7 domains', () => {
    const domains = ['db', 'storage', 'cdn', 'email', 'secrets', 'scheduler', 'infra'];
    for (const domain of domains) {
      expect(registries.has(domain)).toBe(true);
    }
    expect(registries.size).toBe(7);
  });

  it('resolves DynamoDB adapter with contract validation', () => {
    const dbRegistry = registries.get('db')!;
    const adapter = dbRegistry.resolveAdapter('dynamodb', {
      region: 'us-east-1',
    });
    expect(adapter).toBeDefined();
    expect(typeof (adapter as any).get).toBe('function');
    expect(typeof (adapter as any).put).toBe('function');
    expect(typeof (adapter as any).query).toBe('function');
  });

  it('resolves S3 adapter with contract validation', () => {
    const storageRegistry = registries.get('storage')!;
    const adapter = storageRegistry.resolveAdapter('s3', {});
    expect(adapter).toBeDefined();
    expect(typeof (adapter as any).presignUpload).toBe('function');
    expect(typeof (adapter as any).list).toBe('function');
  });

  it('resolves CloudFront adapter with contract validation', () => {
    const cdnRegistry = registries.get('cdn')!;
    const adapter = cdnRegistry.resolveAdapter('cloudfront', {});
    expect(adapter).toBeDefined();
    expect(typeof (adapter as any).invalidateCache).toBe('function');
  });

  it('resolves SES adapter with contract validation', () => {
    const emailRegistry = registries.get('email')!;
    const adapter = emailRegistry.resolveAdapter('ses', {});
    expect(adapter).toBeDefined();
    expect(typeof (adapter as any).send).toBe('function');
    expect(typeof (adapter as any).sendTemplated).toBe('function');
  });

  it('resolves SSM adapter with contract validation', () => {
    const secretsRegistry = registries.get('secrets')!;
    const adapter = secretsRegistry.resolveAdapter('ssm', {});
    expect(adapter).toBeDefined();
    expect(typeof (adapter as any).getSecret).toBe('function');
  });

  it('resolves EventBridge adapter with contract validation', () => {
    const schedulerRegistry = registries.get('scheduler')!;
    const adapter = schedulerRegistry.resolveAdapter('eventbridge', {
      storeId: 'test-store',
    });
    expect(adapter).toBeDefined();
    expect(typeof (adapter as any).createOneTime).toBe('function');
  });

  it('resolves CDK infra adapter with contract validation', () => {
    const infraRegistry = registries.get('infra')!;
    const adapter = infraRegistry.resolveAdapter('aws-cdk', {});
    expect(adapter).toBeDefined();
    expect(typeof (adapter as any).provision).toBe('function');
    expect(typeof (adapter as any).destroy).toBe('function');
  });

  it('each registry lists its registered adapter with metadata', () => {
    const dbList = registries.get('db')!.listAdapters();
    expect(dbList).toEqual([
      { adapterId: 'dynamodb', metadata: { cloud: 'aws', service: 'DynamoDB' } },
    ]);

    const storageList = registries.get('storage')!.listAdapters();
    expect(storageList).toEqual([
      { adapterId: 's3', metadata: { cloud: 'aws', service: 'S3' } },
    ]);
  });

  // Scenario: full end-to-end registration → resolution → usage
  it('scenario: resolve all adapters for a store profile', () => {
    const storeProfile = {
      db: 'dynamodb',
      storage: 's3',
      cdn: 'cloudfront',
      email: 'ses',
      secrets: 'ssm',
      scheduler: 'eventbridge',
      infra: 'aws-cdk',
    };

    const context = { storeId: 'charming-cherubs', region: 'us-east-1' };

    // Resolve every adapter — this validates all contracts pass
    for (const [domain, adapterId] of Object.entries(storeProfile)) {
      const registry = registries.get(domain);
      expect(registry).toBeDefined();

      const adapter = registry!.resolveAdapter(adapterId, context);
      expect(adapter).toBeDefined();
    }
  });
});
