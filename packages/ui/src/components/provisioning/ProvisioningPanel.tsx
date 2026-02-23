import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Loader2, AlertTriangle, ArrowLeft, Rocket } from 'lucide-react';
import { useProvisioningRunner } from '@/hooks/useProvisioningRunner';
import { generateStoreProfile } from '@byb/config-generator';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StageCard } from '@/components/provisioning/StageCard';
import { ProvisioningComplete } from '@/components/provisioning/ProvisioningComplete';
import type { WizardAnswers } from '@byb/config-generator';

function parseWizardResult(): WizardAnswers | null {
  try {
    const raw = sessionStorage.getItem('byb-wizard-result');
    if (!raw) return null;
    return JSON.parse(raw) as WizardAnswers;
  } catch {
    return null;
  }
}

export function ProvisioningPanel() {
  const navigate = useNavigate();
  const {
    status,
    stageProgress,
    error,
    startProvisioning,
    reset,
  } = useProvisioningRunner();

  const wizardResult = useMemo(() => parseWizardResult(), []);

  // Auto-start provisioning on mount when wizard data exists
  useEffect(() => {
    if (!wizardResult) return;
    if (status !== 'idle') return;

    const profile = generateStoreProfile(wizardResult);
    startProvisioning(profile);
  }, [wizardResult, status, startProvisioning]);

  // No wizard data
  if (!wizardResult) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-lg">No Wizard Data Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              No store configuration was found. Please complete the setup wizard
              first to generate your store configuration.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate('/wizard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Wizard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const storeId = wizardResult.business.storeId;
  const completedStages = stageProgress.filter(
    (s) => s.executionResult != null,
  ).length;
  const totalStages = stageProgress.length;
  const progressPercent =
    totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
  const totalDuration = stageProgress.reduce(
    (sum, s) => sum + (s.executionResult?.durationMs ?? 0),
    0,
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Rocket className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Provisioning Store
            </h1>
            {status === 'running' && (
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Setting up cloud infrastructure for{' '}
            <strong className="text-foreground">{storeId}</strong>
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {status === 'completed'
                ? 'All stages complete'
                : status === 'failed'
                  ? 'Provisioning failed'
                  : `Stage ${completedStages} of ${totalStages}`}
            </span>
            <span className="tabular-nums">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} />
        </div>

        {/* Error banner */}
        {status === 'failed' && error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800">
                Provisioning Failed
              </p>
              <p className="mt-1 text-xs text-red-600">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                reset();
                const profile = generateStoreProfile(wizardResult);
                startProvisioning(profile);
              }}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Stage timeline */}
        {status !== 'completed' && (
          <div className="mb-6">
            <AnimatePresence mode="sync">
              {stageProgress.map((sp, idx) => (
                <StageCard
                  key={sp.stage.stageId}
                  stage={sp.stage}
                  executionResult={sp.executionResult}
                  isActive={sp.isActive}
                  index={idx}
                  isLast={idx === stageProgress.length - 1}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Success state */}
        {status === 'completed' && (
          <ProvisioningComplete
            storeId={storeId}
            stageResults={stageProgress}
            totalDuration={totalDuration}
          />
        )}
      </div>
    </div>
  );
}
