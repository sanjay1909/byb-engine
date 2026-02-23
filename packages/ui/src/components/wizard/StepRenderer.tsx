import type { WizardStepId, StepState, FieldError } from '@byb/wizard';
import type { WizardAnswers } from '@byb/config-generator';
import { BusinessStep } from './steps/BusinessStep';
import { BrandingStep } from './steps/BrandingStep';
import { LayoutStep } from './steps/LayoutStep';
import { FeaturesStep } from './steps/FeaturesStep';
import { ShippingStep } from './steps/ShippingStep';
import { CloudStep } from './steps/CloudStep';
import { ReviewStep } from './steps/ReviewStep';

interface StepRendererProps {
  currentStepId: WizardStepId;
  data: Partial<WizardAnswers>;
  stepStates: Record<WizardStepId, StepState>;
  onUpdate: (stepId: WizardStepId, data: unknown) => void;
}

export interface StepProps {
  data: any;
  errors: FieldError[];
  onUpdate: (data: any) => void;
}

/**
 * Maps the wizard step data key to the correct section of WizardAnswers
 * and resolves errors from the step state. Then renders the matching
 * step component.
 */
const STEP_DATA_KEYS: Record<WizardStepId, keyof WizardAnswers | null> = {
  business: 'business',
  branding: 'branding',
  layout: 'layout',
  features: 'features',
  shipping: 'shipping',
  cloud: 'cloud',
  review: null,
};

export function StepRenderer({
  currentStepId,
  data,
  stepStates,
  onUpdate,
}: StepRendererProps) {
  const dataKey = STEP_DATA_KEYS[currentStepId];
  const stepData = dataKey ? data[dataKey] ?? {} : data;
  const errors = stepStates[currentStepId]?.errors ?? [];
  const handleUpdate = (value: any) => onUpdate(currentStepId, value);

  switch (currentStepId) {
    case 'business':
      return (
        <BusinessStep data={stepData} errors={errors} onUpdate={handleUpdate} />
      );
    case 'branding':
      return (
        <BrandingStep data={stepData} errors={errors} onUpdate={handleUpdate} />
      );
    case 'layout':
      return (
        <LayoutStep data={stepData} errors={errors} onUpdate={handleUpdate} />
      );
    case 'features':
      return (
        <FeaturesStep data={stepData} errors={errors} onUpdate={handleUpdate} />
      );
    case 'shipping':
      return (
        <ShippingStep data={stepData} errors={errors} onUpdate={handleUpdate} />
      );
    case 'cloud':
      return (
        <CloudStep data={stepData} errors={errors} onUpdate={handleUpdate} />
      );
    case 'review':
      return (
        <ReviewStep
          data={data}
          errors={errors}
          onUpdate={handleUpdate}
        />
      );
    default:
      return (
        <div className="py-8 text-center text-muted-foreground">
          Unknown step: {currentStepId}
        </div>
      );
  }
}
