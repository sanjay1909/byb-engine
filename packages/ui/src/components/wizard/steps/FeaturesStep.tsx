import { useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  BookOpen,
  Mail,
  CreditCard,
  BarChart3,
  Activity,
} from 'lucide-react';
import type { StepProps } from '../StepRenderer';
import type { WizardFeatures } from '@byb/config-generator';

interface FeatureDefinition {
  key: keyof Omit<WizardFeatures, 'payments'>;
  label: string;
  description: string;
  icon: React.ElementType;
}

const FEATURES: FeatureDefinition[] = [
  {
    key: 'blog',
    label: 'Blog CMS',
    description:
      'Built-in content management for blog posts, SEO metadata, and rich text editing.',
    icon: BookOpen,
  },
  {
    key: 'campaigns',
    label: 'Email Campaigns',
    description:
      'Send promotional emails, abandoned cart reminders, and order notifications.',
    icon: Mail,
  },
  {
    key: 'analytics',
    label: 'Analytics Dashboard',
    description:
      'Track page views, conversion rates, top products, and revenue metrics.',
    icon: BarChart3,
  },
  {
    key: 'oe',
    label: 'Operational Engineering',
    description:
      'CloudWatch metrics, alarms, traces, and operational dashboards for your store.',
    icon: Activity,
  },
];

const PAYMENT_PROVIDERS = [
  { value: 'stripe', label: 'Stripe' },
  { value: 'manual', label: 'Manual / Bank Transfer' },
];

const DEFAULT_FEATURES: WizardFeatures = {
  blog: false,
  campaigns: false,
  payments: false,
  analytics: false,
  oe: false,
};

export function FeaturesStep({ data, errors, onUpdate }: StepProps) {
  const features = (data ?? DEFAULT_FEATURES) as Partial<WizardFeatures>;

  // Initialize defaults on mount (StepRenderer passes {} when no data exists)
  useEffect(() => {
    if (!features.blog && features.blog !== false) {
      onUpdate(DEFAULT_FEATURES);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (field: keyof WizardFeatures, value: boolean | string) => {
    onUpdate({ ...DEFAULT_FEATURES, ...features, [field]: value });
  };

  const paymentsEnabled = !!features.payments;
  const paymentsProvider =
    typeof features.payments === 'string' ? features.payments : 'stripe';

  const togglePayments = (enabled: boolean) => {
    update('payments', enabled ? 'stripe' : false);
  };

  const changePaymentProvider = (provider: string) => {
    update('payments', provider);
  };

  return (
    <div className="space-y-2">
      {/* Standard feature toggles */}
      {FEATURES.map((feat) => {
        const Icon = feat.icon;
        return (
          <div
            key={feat.key}
            className="flex items-start justify-between gap-4 rounded-lg border px-4 py-4"
          >
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">{feat.label}</Label>
                <p className="text-xs text-muted-foreground">
                  {feat.description}
                </p>
              </div>
            </div>
            <Switch
              checked={!!features[feat.key]}
              onCheckedChange={(checked) => update(feat.key, checked)}
              aria-label={`Toggle ${feat.label}`}
            />
          </div>
        );
      })}

      {/* Payments — with conditional provider select */}
      <div className="rounded-lg border px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">Payments</Label>
              <p className="text-xs text-muted-foreground">
                Accept online payments from customers via Stripe or manual bank
                transfer.
              </p>
            </div>
          </div>
          <Switch
            checked={paymentsEnabled}
            onCheckedChange={togglePayments}
            aria-label="Toggle Payments"
          />
        </div>

        {paymentsEnabled && (
          <div className="mt-4 ml-11 max-w-xs space-y-2">
            <Label htmlFor="paymentProvider" className="text-xs">
              Payment Provider
            </Label>
            <Select
              id="paymentProvider"
              value={paymentsProvider}
              onValueChange={changePaymentProvider}
            >
              {PAYMENT_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
          {errors.map((err, i) => (
            <p key={i} className="text-xs text-destructive">
              {err.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
