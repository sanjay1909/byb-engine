/**
 * pipelineAdapter.ts — Interface for CI/CD pipeline management.
 *
 * Handles build pipeline creation, build triggering, status tracking,
 * and deployment URL retrieval. Called by the provisioning flow after
 * frontend deployment to set up continuous deployment.
 *
 * Cloud adapters implement it for their specific CI/CD service:
 * - AWS: CodePipeline / CodeBuild
 * - Azure: Azure DevOps Pipelines
 * - GCP: Cloud Build
 */

/** Parameters for creating a CI/CD pipeline */
export interface PipelineCreateParams {
  /** Store this pipeline is for */
  storeId: string;
  /** Source repo URL or local path */
  sourceRepo?: string;
  /** Build command (e.g., 'npm run build') */
  buildCommand: string;
  /** Output directory (e.g., 'dist') */
  outputDirectory: string;
  /** Environment variables for the build */
  envVars?: Record<string, string>;
}

/** Result of pipeline creation */
export interface PipelineCreateResult {
  /** Unique pipeline identifier */
  pipelineId: string;
  /** Pipeline status */
  status: 'created' | 'active' | 'failed';
}

/** Parameters for triggering a build */
export interface PipelineTriggerParams {
  /** Pipeline to trigger */
  pipelineId: string;
  /** Store this build is for */
  storeId: string;
  /** Optional commit SHA or branch ref */
  ref?: string;
}

/** Result of triggering a build */
export interface PipelineBuildResult {
  /** Unique build run identifier */
  buildId: string;
  /** Initial build status */
  status: 'queued' | 'building' | 'succeeded' | 'failed';
  /** When the build started (ISO 8601) */
  startedAt?: string;
}

/** Parameters for checking build status */
export interface PipelineBuildStatusParams {
  /** Pipeline the build belongs to */
  pipelineId: string;
  /** Build to check */
  buildId: string;
}

/** Detailed build status */
export interface PipelineBuildStatus {
  /** Build identifier */
  buildId: string;
  /** Current status */
  status: 'queued' | 'building' | 'succeeded' | 'failed';
  /** Build log lines (most recent) */
  logs?: string[];
  /** When the build started (ISO 8601) */
  startedAt?: string;
  /** When the build completed (ISO 8601) */
  completedAt?: string;
  /** Total build duration in milliseconds */
  durationMs?: number;
}

/** Parameters for getting deployment URL */
export interface PipelineDeploymentParams {
  /** Pipeline to query */
  pipelineId: string;
  /** Build to get deployment URL for */
  buildId: string;
}

/**
 * Pipeline adapter interface.
 *
 * Required methods contract: ['createPipeline', 'triggerBuild', 'getBuildStatus', 'getDeploymentUrl']
 */
export interface PipelineAdapter {
  /** Create a new CI/CD pipeline for a store. */
  createPipeline(params: PipelineCreateParams): Promise<PipelineCreateResult>;

  /** Trigger a new build in the pipeline. */
  triggerBuild(params: PipelineTriggerParams): Promise<PipelineBuildResult>;

  /** Check the status of a running or completed build. */
  getBuildStatus(params: PipelineBuildStatusParams): Promise<PipelineBuildStatus>;

  /** Get the deployment URL for a completed build. */
  getDeploymentUrl(params: PipelineDeploymentParams): Promise<string>;
}

export const PIPELINE_ADAPTER_REQUIRED_METHODS = [
  'createPipeline',
  'triggerBuild',
  'getBuildStatus',
  'getDeploymentUrl',
] as const;
