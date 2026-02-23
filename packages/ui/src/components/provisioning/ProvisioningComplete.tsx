import { motion } from 'framer-motion';
import { CheckCircle2, ExternalLink, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { StageProgress } from '@/hooks/useProvisioningRunner';

export interface ProvisioningCompleteProps {
  storeId: string;
  stageResults: StageProgress[];
  totalDuration?: number;
}

function formatTotalDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

export function ProvisioningComplete({
  storeId,
  stageResults,
  totalDuration,
}: ProvisioningCompleteProps) {
  const navigate = useNavigate();

  const completed = stageResults.filter(
    (s) => s.executionResult?.status === 'success',
  ).length;
  const skipped = stageResults.filter(
    (s) => s.executionResult?.status === 'skipped',
  ).length;
  const failed = stageResults.filter(
    (s) => s.executionResult?.status === 'failed',
  ).length;

  const urls = [
    { label: 'Site URL', url: `https://${storeId}.byb.demo` },
    { label: 'Admin URL', url: `https://${storeId}.byb.demo/admin` },
    { label: 'API URL', url: `https://api.${storeId}.byb.demo` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Success header */}
      <div className="flex flex-col items-center text-center gap-3 py-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        >
          <CheckCircle2 className="h-16 w-16 text-emerald-500" />
        </motion.div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Store Provisioned Successfully!
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          All infrastructure resources for <strong>{storeId}</strong> have been
          created and configured. Your store is ready to go.
        </p>
      </div>

      {/* Summary stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-emerald-600 tabular-nums">
                {completed}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-400 tabular-nums">
                {skipped}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Skipped</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500 tabular-nums">
                {failed}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Failed</p>
            </div>
          </div>
          {totalDuration != null && (
            <>
              <Separator className="my-4" />
              <p className="text-center text-sm text-muted-foreground">
                Total provisioning time:{' '}
                <span className="font-medium text-foreground tabular-nums">
                  {formatTotalDuration(totalDuration)}
                </span>
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* URLs */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Deployment URLs
          </h3>
          {urls.map((entry) => (
            <div
              key={entry.label}
              className="flex items-center justify-between rounded-md border px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{entry.label}</p>
                <p className="text-sm font-mono text-foreground truncate">
                  {entry.url}
                </p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center pt-2">
        <Button size="lg" onClick={() => navigate('/')}>
          Go to Dashboard
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}
