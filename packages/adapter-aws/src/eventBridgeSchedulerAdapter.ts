/**
 * eventBridgeSchedulerAdapter.ts — AWS EventBridge Scheduler implementation.
 *
 * Wraps the AWS SDK v3 Scheduler client for job scheduling.
 * Used for campaign scheduling, alarm checks, and recurring maintenance tasks.
 *
 * How it connects to the system:
 * - Registered under domain 'scheduler' with ID 'eventbridge'
 * - Resolved via store profile (profile.adapters.scheduler = 'eventbridge')
 * - Gated by the 'campaigns.scheduling' feature capability
 */

import {
  SchedulerClient,
  CreateScheduleCommand,
  DeleteScheduleCommand,
} from '@aws-sdk/client-scheduler';
import type {
  SchedulerAdapter,
  SchedulerCreateOneTimeParams,
  SchedulerCreateRecurringParams,
  SchedulerDeleteParams,
} from '@byb/core';

export interface EventBridgeSchedulerAdapterOptions {
  region?: string;
  /** IAM role ARN that EventBridge assumes to invoke the target */
  roleArn: string;
  /** Schedule group name (for organizing schedules per store) */
  groupName?: string;
  schedulerClient?: SchedulerClient;
}

export function createEventBridgeSchedulerAdapter(
  options: EventBridgeSchedulerAdapterOptions,
): SchedulerAdapter {
  const { roleArn, groupName } = options;
  const client =
    options.schedulerClient ?? new SchedulerClient({ region: options.region });

  /**
   * Builds the target configuration based on target type.
   */
  function buildTarget(target: { type: string; endpoint: string }, payload: Record<string, unknown>) {
    if (target.type === 'function') {
      return {
        Arn: target.endpoint,
        RoleArn: roleArn,
        Input: JSON.stringify(payload),
      };
    }
    // HTTP target — use universal target with HTTP invocation
    return {
      Arn: target.endpoint,
      RoleArn: roleArn,
      Input: JSON.stringify(payload),
    };
  }

  return {
    async createOneTime(params: SchedulerCreateOneTimeParams): Promise<void> {
      await client.send(
        new CreateScheduleCommand({
          Name: params.name,
          GroupName: groupName,
          ScheduleExpression: `at(${params.scheduleAt})`,
          FlexibleTimeWindow: { Mode: 'OFF' },
          Target: buildTarget(params.target, params.payload),
          ActionAfterCompletion: 'DELETE',
        }),
      );
    },

    async createRecurring(params: SchedulerCreateRecurringParams): Promise<void> {
      await client.send(
        new CreateScheduleCommand({
          Name: params.name,
          GroupName: groupName,
          ScheduleExpression: params.schedule,
          FlexibleTimeWindow: { Mode: 'OFF' },
          Target: buildTarget(params.target, params.payload),
        }),
      );
    },

    async deleteSchedule(params: SchedulerDeleteParams): Promise<void> {
      await client.send(
        new DeleteScheduleCommand({
          Name: params.name,
          GroupName: groupName,
        }),
      );
    },
  };
}
