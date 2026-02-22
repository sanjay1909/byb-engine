/**
 * Tests for eventBridgeSchedulerAdapter.ts
 *
 * Covers:
 * - createOneTime: schedule expression, auto-delete, target config
 * - createRecurring: recurring expression, target config
 * - deleteSchedule: sends DeleteScheduleCommand
 * - Satisfies SchedulerAdapter contract
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEventBridgeSchedulerAdapter } from './eventBridgeSchedulerAdapter.js';
import { assertAdapterContract, SCHEDULER_ADAPTER_REQUIRED_METHODS } from '@byb/core';

function createMockSchedulerClient() {
  return { send: vi.fn().mockResolvedValue({}) };
}

describe('createEventBridgeSchedulerAdapter', () => {
  let mockClient: ReturnType<typeof createMockSchedulerClient>;
  let adapter: ReturnType<typeof createEventBridgeSchedulerAdapter>;

  beforeEach(() => {
    mockClient = createMockSchedulerClient();
    adapter = createEventBridgeSchedulerAdapter({
      region: 'us-east-1',
      roleArn: 'arn:aws:iam::123456:role/scheduler-role',
      groupName: 'byb-store-1',
      schedulerClient: mockClient as any,
    });
  });

  it('satisfies the SchedulerAdapter contract', () => {
    assertAdapterContract(
      adapter as unknown as Record<string, unknown>,
      [...SCHEDULER_ADAPTER_REQUIRED_METHODS],
      'eventbridge',
      'scheduler',
    );
  });

  describe('createOneTime', () => {
    it('creates a one-time schedule with auto-delete', async () => {
      await adapter.createOneTime({
        name: 'send-campaign-123',
        scheduleAt: '2026-03-01T10:00:00Z',
        target: { type: 'function', endpoint: 'arn:aws:lambda:fn' },
        payload: { campaignId: '123' },
      });

      const command = mockClient.send.mock.calls[0][0];
      expect(command.input.Name).toBe('send-campaign-123');
      expect(command.input.ScheduleExpression).toBe(
        'at(2026-03-01T10:00:00Z)',
      );
      expect(command.input.ActionAfterCompletion).toBe('DELETE');
      expect(command.input.Target.Arn).toBe('arn:aws:lambda:fn');
      expect(JSON.parse(command.input.Target.Input)).toEqual({
        campaignId: '123',
      });
    });
  });

  describe('createRecurring', () => {
    it('creates a recurring schedule', async () => {
      await adapter.createRecurring({
        name: 'daily-metrics',
        schedule: 'rate(1 day)',
        target: { type: 'function', endpoint: 'arn:aws:lambda:metrics' },
        payload: { type: 'daily-rollup' },
      });

      const command = mockClient.send.mock.calls[0][0];
      expect(command.input.ScheduleExpression).toBe('rate(1 day)');
      expect(command.input.GroupName).toBe('byb-store-1');
    });
  });

  describe('deleteSchedule', () => {
    it('deletes a schedule by name', async () => {
      await adapter.deleteSchedule({ name: 'old-schedule' });

      const command = mockClient.send.mock.calls[0][0];
      expect(command.input.Name).toBe('old-schedule');
      expect(command.input.GroupName).toBe('byb-store-1');
    });
  });
});
