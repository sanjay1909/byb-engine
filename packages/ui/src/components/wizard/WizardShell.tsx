import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { useWizardOrchestrator } from '@/hooks/useWizardOrchestrator';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StepProgress } from './StepProgress';
import { StepRenderer } from './StepRenderer';
import type { WizardResult, WizardStepId } from '@byb/wizard';

export function WizardShell() {
  const navigate = useNavigate();
  const {
    state,
    steps,
    currentStep,
    isFirstStep,
    isLastStep,
    progress,
    updateStep,
    next,
    back,
    jumpTo,
    finish,
  } = useWizardOrchestrator();

  const [isGenerating, setIsGenerating] = useState(false);
  const resultRef = useRef<WizardResult | null>(null);

  // Listen for jumpTo events from ReviewStep "Edit" buttons
  const handleJumpToEvent = useCallback(
    (e: Event) => {
      const stepId = (e as CustomEvent).detail?.stepId as WizardStepId;
      if (stepId) {
        jumpTo(stepId);
      }
    },
    [jumpTo],
  );

  useEffect(() => {
    window.addEventListener('wizard:jumpTo', handleJumpToEvent);
    return () => window.removeEventListener('wizard:jumpTo', handleJumpToEvent);
  }, [handleJumpToEvent]);

  const handleNext = () => {
    const result = next();
    if (!result.valid) {
      // Errors are already set in the wizard state via the orchestrator
      return;
    }
  };

  const handleBack = () => {
    back();
  };

  const handleFinish = () => {
    setIsGenerating(true);
    // Use setTimeout to allow the UI to show the loading state before
    // the synchronous config generation runs
    setTimeout(() => {
      const result = finish();
      resultRef.current = result;

      if (result.success && result.answers) {
        sessionStorage.setItem(
          'byb-wizard-result',
          JSON.stringify(result.answers),
        );
        navigate('/wizard/provisioning');
      } else {
        setIsGenerating(false);
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top progress bar */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-semibold tracking-tight">
              Store Setup Wizard
            </h1>
            <span className="text-sm text-muted-foreground">
              {progress}% complete
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      {/* Main content: sidebar + step content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          {/* Left sidebar: step progress */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <StepProgress
                steps={steps}
                stepStates={state.steps}
                currentStepId={state.currentStepId}
                onJumpTo={jumpTo}
              />
            </div>
          </aside>

          {/* Right: step content + navigation */}
          <main className="min-w-0">
            <Card className="mb-6">
              <CardContent className="p-6 sm:p-8">
                {/* Step header */}
                <div className="mb-8">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Step {currentStep.index + 1} of {steps.length}
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {currentStep.label}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {currentStep.description}
                  </p>
                </div>

                {/* Step content */}
                <StepRenderer
                  currentStepId={state.currentStepId}
                  data={state.data}
                  stepStates={state.steps}
                  onUpdate={updateStep}
                />
              </CardContent>
            </Card>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isFirstStep || isGenerating}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>

              <div className="flex gap-3">
                {isLastStep ? (
                  <Button onClick={handleFinish} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Store
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={handleNext} disabled={isGenerating}>
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Show generation error if any */}
            {resultRef.current && !resultRef.current.success && (
              <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive space-y-1">
                {resultRef.current.error && <p>{resultRef.current.error}</p>}
                {resultRef.current.stepErrors &&
                  Object.entries(resultRef.current.stepErrors).map(([step, errs]) =>
                    (errs as Array<{ field?: string; message: string }>).map((e, i) => (
                      <p key={`${step}-${i}`}>
                        <strong>{step}:</strong> {e.message}
                      </p>
                    )),
                  )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
