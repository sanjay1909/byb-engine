/**
 * cdkInfraAdapter.ts — AWS CDK implementation of InfraAdapter.
 *
 * Wraps AWS CloudFormation SDK to provision and manage full store infrastructure
 * stacks. In production, this creates/updates/deletes CDK-generated CloudFormation
 * stacks containing all AWS resources for a store (DynamoDB, S3, Lambda, etc.).
 *
 * How it connects to the system:
 * - Registered under domain 'infra' with ID 'aws-cdk'
 * - Resolved via store profile (profile.adapters.infra = 'aws-cdk')
 * - Called by the provisioning bridge to set up the entire store infrastructure
 *
 * Note: Actual CDK synthesis and deployment is triggered via CloudFormation.
 * The stack template must be pre-synthesized (e.g., via CI/CD or build step).
 * This adapter manages the CloudFormation stack lifecycle.
 */

import {
  CloudFormationClient,
  CreateStackCommand,
  DescribeStacksCommand,
  DeleteStackCommand,
} from '@aws-sdk/client-cloudformation';
import type {
  InfraAdapter,
  InfraProvisionParams,
  InfraProvisionResult,
  InfraStatusParams,
  InfraDestroyParams,
} from '@byb/core';

export interface CdkInfraAdapterOptions {
  region?: string;
  /** S3 URL or path to the synthesized CloudFormation template */
  templateUrl?: string;
  /** Stack name prefix (storeId is appended) */
  stackNamePrefix?: string;
  cloudFormationClient?: CloudFormationClient;
}

/**
 * Maps CloudFormation stack status to our simplified status.
 */
function mapStackStatus(
  cfStatus: string | undefined,
): InfraProvisionResult['status'] {
  if (!cfStatus) return 'in_progress';

  // Check for failure/rollback states first (ROLLBACK_COMPLETE ends with _COMPLETE but is a failure)
  if (cfStatus.endsWith('_FAILED') || cfStatus.includes('ROLLBACK')) {
    return 'failed';
  }
  if (cfStatus.endsWith('_COMPLETE') && !cfStatus.includes('DELETE')) {
    return 'completed';
  }
  return 'in_progress';
}

export function createCdkInfraAdapter(
  options: CdkInfraAdapterOptions,
): InfraAdapter {
  const { templateUrl, stackNamePrefix = 'byb-store' } = options;
  const client =
    options.cloudFormationClient ??
    new CloudFormationClient({ region: options.region });

  function getStackName(storeId: string): string {
    return `${stackNamePrefix}-${storeId}`;
  }

  return {
    async provision(params: InfraProvisionParams): Promise<InfraProvisionResult> {
      const stackName = getStackName(params.storeId);

      try {
        await client.send(
          new CreateStackCommand({
            StackName: stackName,
            TemplateURL: templateUrl,
            Parameters: [
              { ParameterKey: 'StoreId', ParameterValue: params.storeId },
              { ParameterKey: 'StoreName', ParameterValue: params.storeName },
              { ParameterKey: 'Region', ParameterValue: params.region },
              {
                ParameterKey: 'EnableDatabase',
                ParameterValue: String(params.features.database),
              },
              {
                ParameterKey: 'EnableStorage',
                ParameterValue: String(params.features.storage),
              },
              {
                ParameterKey: 'EnableCdn',
                ParameterValue: String(params.features.cdn),
              },
              {
                ParameterKey: 'EnableEmail',
                ParameterValue: String(params.features.email),
              },
              {
                ParameterKey: 'EnableScheduler',
                ParameterValue: String(params.features.scheduler),
              },
            ],
            Capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'],
            Tags: [
              { Key: 'byb:store-id', Value: params.storeId },
              { Key: 'byb:managed-by', Value: 'byb-engine' },
            ],
          }),
        );

        return {
          stackId: stackName,
          status: 'in_progress',
          outputs: {},
        };
      } catch (err) {
        return {
          stackId: stackName,
          status: 'failed',
          outputs: {},
          errorMessage: err instanceof Error ? err.message : String(err),
        };
      }
    },

    async getStatus(params: InfraStatusParams): Promise<InfraProvisionResult> {
      const result = await client.send(
        new DescribeStacksCommand({ StackName: params.stackId }),
      );

      const stack = result.Stacks?.[0];
      if (!stack) {
        return {
          stackId: params.stackId,
          status: 'failed',
          outputs: {},
          errorMessage: 'Stack not found',
        };
      }

      // Extract outputs as key-value pairs
      const outputs: Record<string, string> = {};
      for (const output of stack.Outputs ?? []) {
        if (output.OutputKey && output.OutputValue) {
          outputs[output.OutputKey] = output.OutputValue;
        }
      }

      return {
        stackId: params.stackId,
        status: mapStackStatus(stack.StackStatus),
        outputs,
        errorMessage: stack.StackStatusReason ?? undefined,
      };
    },

    async destroy(params: InfraDestroyParams): Promise<void> {
      await client.send(
        new DeleteStackCommand({ StackName: params.stackId }),
      );
    },
  };
}
