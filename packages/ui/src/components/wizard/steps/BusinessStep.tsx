import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { StepProps } from '../StepRenderer';
import type { WizardBusinessInfo } from '@byb/config-generator';

const CURRENCIES = [
  { value: 'usd', label: 'USD — US Dollar' },
  { value: 'eur', label: 'EUR — Euro' },
  { value: 'gbp', label: 'GBP — British Pound' },
  { value: 'cad', label: 'CAD — Canadian Dollar' },
  { value: 'aud', label: 'AUD — Australian Dollar' },
];

function getFieldError(errors: StepProps['errors'], field: string) {
  return errors.find((e) => e.field === field);
}

export function BusinessStep({ data, errors, onUpdate }: StepProps) {
  const biz = (data ?? {}) as Partial<WizardBusinessInfo>;

  // Initialize default values on mount so the wizard data has currency
  useEffect(() => {
    if (!biz.currency) {
      onUpdate({ ...biz, currency: 'usd' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (field: keyof WizardBusinessInfo, value: string) => {
    onUpdate({ currency: 'usd', ...biz, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Store ID */}
        <div className="space-y-2">
          <Label htmlFor="storeId">
            Store ID (slug) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="storeId"
            placeholder="my-store"
            value={biz.storeId ?? ''}
            onChange={(e) => update('storeId', e.target.value)}
            className={cn(
              getFieldError(errors, 'storeId') && 'border-destructive focus-visible:ring-destructive',
            )}
          />
          {getFieldError(errors, 'storeId') && (
            <p className="text-xs text-destructive">
              {getFieldError(errors, 'storeId')!.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Lowercase letters, numbers, and hyphens only.
          </p>
        </div>

        {/* Store Name */}
        <div className="space-y-2">
          <Label htmlFor="storeName">
            Store Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="storeName"
            placeholder="My Awesome Store"
            value={biz.storeName ?? ''}
            onChange={(e) => update('storeName', e.target.value)}
            className={cn(
              getFieldError(errors, 'storeName') && 'border-destructive focus-visible:ring-destructive',
            )}
          />
          {getFieldError(errors, 'storeName') && (
            <p className="text-xs text-destructive">
              {getFieldError(errors, 'storeName')!.message}
            </p>
          )}
        </div>

        {/* Website URL */}
        <div className="space-y-2">
          <Label htmlFor="siteUrl">
            Website URL <span className="text-destructive">*</span>
          </Label>
          <Input
            id="siteUrl"
            placeholder="https://mystore.com"
            value={biz.siteUrl ?? ''}
            onChange={(e) => update('siteUrl', e.target.value)}
            className={cn(
              getFieldError(errors, 'siteUrl') && 'border-destructive focus-visible:ring-destructive',
            )}
          />
          {getFieldError(errors, 'siteUrl') && (
            <p className="text-xs text-destructive">
              {getFieldError(errors, 'siteUrl')!.message}
            </p>
          )}
        </div>

        {/* Support Email */}
        <div className="space-y-2">
          <Label htmlFor="supportEmail">
            Support Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="supportEmail"
            type="email"
            placeholder="support@mystore.com"
            value={biz.supportEmail ?? ''}
            onChange={(e) => update('supportEmail', e.target.value)}
            className={cn(
              getFieldError(errors, 'supportEmail') && 'border-destructive focus-visible:ring-destructive',
            )}
          />
          {getFieldError(errors, 'supportEmail') && (
            <p className="text-xs text-destructive">
              {getFieldError(errors, 'supportEmail')!.message}
            </p>
          )}
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            id="currency"
            value={biz.currency ?? 'usd'}
            onValueChange={(val) => update('currency', val)}
            className={cn(
              getFieldError(errors, 'currency') && 'border-destructive focus-visible:ring-destructive',
            )}
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          {getFieldError(errors, 'currency') && (
            <p className="text-xs text-destructive">
              {getFieldError(errors, 'currency')!.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
