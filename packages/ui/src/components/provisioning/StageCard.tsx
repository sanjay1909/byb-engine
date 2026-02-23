import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  Loader2,
  Circle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProvisioningStage, StageExecutionResult } from '@byb/core';

export interface StageCardProps {
  stage: ProvisioningStage;
  executionResult?: StageExecutionResult;
  isActive: boolean;
  index: number;
  isLast: boolean;
}

function getStageIcon(
  stage: ProvisioningStage,
  executionResult?: StageExecutionResult,
  isActive?: boolean,
) {
  if (isActive) {
    return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
  }
  if (executionResult) {
    switch (executionResult.status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'skipped':
        return <MinusCircle className="h-5 w-5 text-gray-400" />;
    }
  }
  if (stage.status === 'skipped') {
    return <MinusCircle className="h-5 w-5 text-gray-400" />;
  }
  if (stage.status === 'blocked') {
    return <Circle className="h-5 w-5 text-gray-300" />;
  }
  return <Circle className="h-5 w-5 text-gray-300" />;
}

function getLineColor(
  executionResult?: StageExecutionResult,
  isActive?: boolean,
) {
  if (isActive) return 'bg-blue-300';
  if (executionResult) {
    switch (executionResult.status) {
      case 'success':
        return 'bg-emerald-300';
      case 'failed':
        return 'bg-red-300';
      case 'skipped':
        return 'bg-gray-200';
    }
  }
  return 'bg-gray-200';
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function domainLabel(domain: string): string {
  const labels: Record<string, string> = {
    db: 'Database',
    storage: 'Storage',
    cdn: 'CDN',
    email: 'Email',
    secrets: 'Secrets',
    scheduler: 'Scheduler',
    infra: 'Infrastructure',
  };
  return labels[domain] ?? domain;
}

export function StageCard({
  stage,
  executionResult,
  isActive,
  index,
  isLast,
}: StageCardProps) {
  const icon = getStageIcon(stage, executionResult, isActive);
  const lineColor = getLineColor(executionResult, isActive);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative flex gap-4"
    >
      {/* Timeline column */}
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background">
          {icon}
        </div>
        {!isLast && (
          <div
            className={cn('w-0.5 flex-1 min-h-[24px]', lineColor)}
          />
        )}
      </div>

      {/* Content column */}
      <div
        className={cn(
          'flex-1 rounded-lg border p-4 mb-3 transition-colors',
          isActive && 'border-blue-300 bg-blue-50/50',
          executionResult?.status === 'failed' && 'border-red-200 bg-red-50/30',
          executionResult?.status === 'success' && 'border-emerald-200 bg-emerald-50/20',
          !isActive && !executionResult && 'border-border bg-card',
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-medium text-sm text-foreground truncate">
              {stage.displayName}
            </span>
            <Badge variant="secondary" className="text-[11px] shrink-0">
              {domainLabel(stage.adapterDomain)}
            </Badge>
            {stage.required === false && (
              <span className="text-[11px] text-muted-foreground">optional</span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isActive && (
              <span className="text-xs text-blue-600 font-medium">Running...</span>
            )}
            {executionResult?.durationMs != null && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatDuration(executionResult.durationMs)}
              </span>
            )}
          </div>
        </div>

        {executionResult?.error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1.5 border border-red-100"
          >
            {executionResult.error}
          </motion.p>
        )}

        {executionResult?.status === 'skipped' && stage.statusReason && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            Skipped: {stage.statusReason}
          </p>
        )}
      </div>
    </motion.div>
  );
}
