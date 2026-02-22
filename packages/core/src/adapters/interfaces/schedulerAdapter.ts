/**
 * schedulerAdapter.ts — Interface for job scheduling operations.
 *
 * Manages scheduled tasks like campaign sends, alarm checks, and
 * recurring maintenance jobs.
 *
 * Cloud adapters implement it for their specific scheduler:
 * - AWS: EventBridge Scheduler
 * - Azure: Azure Scheduler / Logic Apps
 * - GCP: Cloud Scheduler
 */

/** Parameters for creating a one-time scheduled job */
export interface SchedulerCreateOneTimeParams {
  /** Unique job name */
  name: string;
  /** When to execute (ISO 8601 datetime) */
  scheduleAt: string;
  /** Target endpoint or function to invoke */
  target: {
    /** Target type: 'http' for webhook, 'function' for serverless function */
    type: 'http' | 'function';
    /** URL or function ARN/name */
    endpoint: string;
  };
  /** Payload to pass to the target */
  payload: Record<string, unknown>;
}

/** Parameters for creating a recurring scheduled job */
export interface SchedulerCreateRecurringParams {
  name: string;
  /** Cron expression (e.g., 'rate(5 minutes)' or 'cron(0 12 * * ? *)') */
  schedule: string;
  target: {
    type: 'http' | 'function';
    endpoint: string;
  };
  payload: Record<string, unknown>;
}

/** Parameters for deleting a scheduled job */
export interface SchedulerDeleteParams {
  name: string;
}

/**
 * Scheduler adapter interface.
 *
 * Required methods contract: ['createOneTime', 'createRecurring', 'deleteSchedule']
 */
export interface SchedulerAdapter {
  /** Create a one-time scheduled job. */
  createOneTime(params: SchedulerCreateOneTimeParams): Promise<void>;

  /** Create a recurring scheduled job. */
  createRecurring(params: SchedulerCreateRecurringParams): Promise<void>;

  /** Delete a scheduled job by name. */
  deleteSchedule(params: SchedulerDeleteParams): Promise<void>;
}

export const SCHEDULER_ADAPTER_REQUIRED_METHODS = [
  'createOneTime',
  'createRecurring',
  'deleteSchedule',
] as const;
