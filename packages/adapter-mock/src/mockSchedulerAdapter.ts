/**
 * mockSchedulerAdapter.ts — In-memory mock implementation of SchedulerAdapter.
 *
 * Stores scheduled jobs in a Map keyed by job name.
 * Tracks both one-time and recurring schedules.
 * Provides inspector methods for testing and verification.
 */

import type {
  SchedulerAdapter,
  SchedulerCreateOneTimeParams,
  SchedulerCreateRecurringParams,
  SchedulerDeleteParams,
} from '@byb/core';

declare function setTimeout(callback: () => void, ms: number): unknown;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface MockSchedulerAdapterOptions {
  /** Artificial delay in ms for each operation (default: 0) */
  delay?: number;
}

export interface MockSchedule {
  type: 'one-time' | 'recurring';
  name: string;
  /** ISO 8601 datetime for one-time schedules */
  scheduleAt?: string;
  /** Cron expression for recurring schedules */
  schedule?: string;
  target: { type: 'http' | 'function'; endpoint: string };
  payload: Record<string, unknown>;
}

export interface MockSchedulerAdapter extends SchedulerAdapter {
  /** Returns a copy of all scheduled jobs for inspection */
  getSchedules(): Map<string, MockSchedule>;
  /** Resets all scheduled jobs */
  clear(): void;
  /** Provisioning: configure the scheduler service for a store */
  configureScheduler(params: Record<string, unknown>): Promise<Record<string, unknown>>;
}

/**
 * Creates an in-memory mock scheduler adapter.
 *
 * Schedules are stored in a Map keyed by job name.
 * No actual scheduling occurs — jobs are simply recorded for inspection.
 */
export function createMockSchedulerAdapter(
  options?: MockSchedulerAdapterOptions,
): MockSchedulerAdapter {
  const delay = options?.delay ?? 0;
  const schedules = new Map<string, MockSchedule>();

  return {
    async createOneTime(
      params: SchedulerCreateOneTimeParams,
    ): Promise<void> {
      if (delay) await wait(delay);
      schedules.set(params.name, {
        type: 'one-time',
        name: params.name,
        scheduleAt: params.scheduleAt,
        target: params.target,
        payload: params.payload,
      });
    },

    async createRecurring(
      params: SchedulerCreateRecurringParams,
    ): Promise<void> {
      if (delay) await wait(delay);
      schedules.set(params.name, {
        type: 'recurring',
        name: params.name,
        schedule: params.schedule,
        target: params.target,
        payload: params.payload,
      });
    },

    async deleteSchedule(params: SchedulerDeleteParams): Promise<void> {
      if (delay) await wait(delay);
      schedules.delete(params.name);
    },

    getSchedules(): Map<string, MockSchedule> {
      return new Map(schedules);
    },

    clear(): void {
      schedules.clear();
    },

    // ── Provisioning operations ──────────────────────────────────────

    async configureScheduler(
      params: Record<string, unknown>,
    ): Promise<Record<string, unknown>> {
      if (delay) await wait(delay);
      const storeId = (params.storeId as string) ?? 'unknown';
      const schedulerName = `mock-scheduler-${storeId}`;
      return {
        success: true,
        schedulerName,
        storeId,
        maxSchedules: 100,
      };
    },
  };
}
