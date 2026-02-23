import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createWizardOrchestrator, WIZARD_STEPS } from '@byb/wizard';
import type {
  WizardOrchestrator,
  WizardState,
  WizardStepId,
} from '@byb/wizard';

export function useWizardOrchestrator() {
  // Create orchestrator once (ref)
  const orchestratorRef = useRef<WizardOrchestrator | null>(null);
  if (!orchestratorRef.current) {
    orchestratorRef.current = createWizardOrchestrator();
  }
  const orchestrator = orchestratorRef.current;

  const [state, setState] = useState<WizardState>(orchestrator.getState());

  useEffect(() => {
    orchestrator.start();
    const unsub = orchestrator.subscribe((newState) => setState(newState));
    return unsub;
  }, [orchestrator]);

  const updateStep = useCallback(
    (stepId: WizardStepId, data: unknown) => {
      orchestrator.updateStep(stepId, data);
    },
    [orchestrator],
  );

  const next = useCallback(() => orchestrator.next(), [orchestrator]);
  const back = useCallback(() => orchestrator.back(), [orchestrator]);
  const jumpTo = useCallback(
    (stepId: WizardStepId) => orchestrator.jumpTo(stepId),
    [orchestrator],
  );
  const validate = useCallback(() => orchestrator.validate(), [orchestrator]);
  const finish = useCallback(() => orchestrator.finish(), [orchestrator]);
  const reset = useCallback(() => orchestrator.reset(), [orchestrator]);

  const currentStep = useMemo(
    () => WIZARD_STEPS.find((s) => s.id === state.currentStepId) ?? WIZARD_STEPS[0],
    [state.currentStepId],
  );

  const firstStep = WIZARD_STEPS[0]!;
  const lastStep = WIZARD_STEPS[WIZARD_STEPS.length - 1]!;
  const isFirstStep = state.currentStepId === firstStep.id;
  const isLastStep = state.currentStepId === lastStep.id;
  const completedStepCount = Object.values(state.steps).filter(
    (s) => s.status === 'completed',
  ).length;
  const progress = Math.round((completedStepCount / WIZARD_STEPS.length) * 100);

  return {
    state,
    steps: WIZARD_STEPS,
    currentStep,
    isFirstStep,
    isLastStep,
    completedStepCount,
    progress,
    updateStep,
    next,
    back,
    jumpTo,
    validate,
    finish,
    reset,
  };
}
