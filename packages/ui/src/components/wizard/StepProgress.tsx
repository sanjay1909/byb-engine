import { CheckCircle2, Circle, CircleDot, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WizardStepDefinition, WizardStepId, StepState } from '@byb/wizard';

interface StepProgressProps {
  steps: readonly WizardStepDefinition[];
  stepStates: Record<WizardStepId, StepState>;
  currentStepId: WizardStepId;
  onJumpTo: (stepId: WizardStepId) => void;
}

const statusIcons = {
  completed: CheckCircle2,
  active: CircleDot,
  error: AlertCircle,
  pending: Circle,
} as const;

const statusColors = {
  completed: 'text-emerald-500',
  active: 'text-blue-500',
  error: 'text-destructive',
  pending: 'text-muted-foreground/40',
} as const;

export function StepProgress({
  steps,
  stepStates,
  currentStepId,
  onJumpTo,
}: StepProgressProps) {
  return (
    <nav aria-label="Wizard steps">
      <ol className="space-y-1">
        {steps.map((step, index) => {
          const stepState = stepStates[step.id];
          const isCurrent = step.id === currentStepId;
          const isCompleted = stepState.status === 'completed';
          const isClickable = isCompleted;

          const status: keyof typeof statusIcons = isCurrent
            ? stepState.status === 'error'
              ? 'error'
              : 'active'
            : stepState.status === 'completed'
              ? 'completed'
              : stepState.status === 'error'
                ? 'error'
                : 'pending';

          const Icon = statusIcons[status];
          const colorClass = statusColors[status];

          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => isClickable && onJumpTo(step.id)}
                disabled={!isClickable}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors',
                  isCurrent && 'bg-accent',
                  isClickable && !isCurrent && 'hover:bg-accent/50 cursor-pointer',
                  !isClickable && !isCurrent && 'cursor-default',
                )}
              >
                {/* Step indicator with connecting line */}
                <div className="relative flex flex-col items-center">
                  <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', colorClass)} />
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'absolute top-7 h-8 w-px',
                        isCompleted ? 'bg-emerald-300' : 'bg-border',
                      )}
                    />
                  )}
                </div>

                {/* Step label and description */}
                <div className="min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium leading-tight',
                      isCurrent
                        ? 'text-foreground'
                        : isCompleted
                          ? 'text-foreground'
                          : 'text-muted-foreground',
                    )}
                  >
                    <span className="text-muted-foreground mr-1.5">
                      {step.index + 1}.
                    </span>
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {step.description}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
