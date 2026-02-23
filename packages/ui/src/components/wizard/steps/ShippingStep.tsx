import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Package, Truck } from 'lucide-react';
import type { StepProps } from '../StepRenderer';
import type { WizardShippingRules } from '@byb/config-generator';

function getFieldError(errors: StepProps['errors'], field: string) {
  return errors.find((e) => e.field === field);
}

const SHIPPING_TYPES: Array<{
  value: WizardShippingRules['type'];
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    value: 'flat',
    label: 'Flat Rate',
    description: 'Charge a fixed shipping fee on every order.',
    icon: Package,
  },
  {
    value: 'free_over',
    label: 'Free Over Threshold',
    description:
      'Free shipping when the order total exceeds a threshold; flat rate otherwise.',
    icon: Truck,
  },
];

export function ShippingStep({ data, errors, onUpdate }: StepProps) {
  const shipping = (data ?? { type: 'flat' }) as Partial<WizardShippingRules>;
  const shippingType = shipping.type ?? 'flat';

  // Initialize default values on mount
  useEffect(() => {
    if (!shipping.type) {
      onUpdate({ type: 'flat', flatRate: 999 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (updates: Partial<WizardShippingRules>) => {
    onUpdate({ type: 'flat', flatRate: 999, ...shipping, ...updates });
  };

  /** Convert dollars (display) to cents (stored) */
  const dollarsToCents = (dollars: string): number | undefined => {
    const parsed = parseFloat(dollars);
    if (isNaN(parsed)) return undefined;
    return Math.round(parsed * 100);
  };

  /** Convert cents (stored) to dollars (display) */
  const centsToDollars = (cents: number | undefined): string => {
    if (cents === undefined || cents === null) return '';
    return (cents / 100).toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Shipping type selection */}
      <div>
        <Label className="mb-3 block">Shipping Type</Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SHIPPING_TYPES.map((option) => {
            const isSelected = shippingType === option.value;
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  update({
                    type: option.value,
                    // Reset the other field when switching type
                    flatRate: option.value === 'flat' ? shipping.flatRate : undefined,
                    freeOver: option.value === 'free_over' ? shipping.freeOver : undefined,
                  })
                }
                className={cn(
                  'flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30',
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                    isSelected ? 'bg-primary/10' : 'bg-muted',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      isSelected ? 'text-primary' : 'text-muted-foreground',
                    )}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        {getFieldError(errors, 'type') && (
          <p className="mt-2 text-xs text-destructive">
            {getFieldError(errors, 'type')!.message}
          </p>
        )}
      </div>

      {/* Conditional rate inputs */}
      {shippingType === 'flat' && (
        <div className="max-w-xs space-y-2">
          <Label htmlFor="flatRate">
            Flat Rate (USD) <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              id="flatRate"
              type="number"
              min="0"
              step="0.01"
              placeholder="5.99"
              value={centsToDollars(shipping.flatRate)}
              onChange={(e) =>
                update({ flatRate: dollarsToCents(e.target.value) })
              }
              className={cn(
                'pl-7',
                getFieldError(errors, 'flatRate') &&
                  'border-destructive focus-visible:ring-destructive',
              )}
            />
          </div>
          {getFieldError(errors, 'flatRate') && (
            <p className="text-xs text-destructive">
              {getFieldError(errors, 'flatRate')!.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            This amount is charged on every order.
          </p>
        </div>
      )}

      {shippingType === 'free_over' && (
        <div className="space-y-6">
          <div className="max-w-xs space-y-2">
            <Label htmlFor="flatRate">
              Shipping Rate (USD) <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="flatRate"
                type="number"
                min="0"
                step="0.01"
                placeholder="5.99"
                value={centsToDollars(shipping.flatRate)}
                onChange={(e) =>
                  update({ flatRate: dollarsToCents(e.target.value) })
                }
                className={cn(
                  'pl-7',
                  getFieldError(errors, 'flatRate') &&
                    'border-destructive focus-visible:ring-destructive',
                )}
              />
            </div>
            {getFieldError(errors, 'flatRate') && (
              <p className="text-xs text-destructive">
                {getFieldError(errors, 'flatRate')!.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Charged when the order is below the free shipping threshold.
            </p>
          </div>

          <div className="max-w-xs space-y-2">
            <Label htmlFor="freeOver">
              Free Shipping Threshold (USD){' '}
              <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="freeOver"
                type="number"
                min="0"
                step="0.01"
                placeholder="75.00"
                value={centsToDollars(shipping.freeOver)}
                onChange={(e) =>
                  update({ freeOver: dollarsToCents(e.target.value) })
                }
                className={cn(
                  'pl-7',
                  getFieldError(errors, 'freeOver') &&
                    'border-destructive focus-visible:ring-destructive',
                )}
              />
            </div>
            {getFieldError(errors, 'freeOver') && (
              <p className="text-xs text-destructive">
                {getFieldError(errors, 'freeOver')!.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Orders above this amount qualify for free shipping.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
