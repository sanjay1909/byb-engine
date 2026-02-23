import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Cloud, Globe } from 'lucide-react';
import type { StepProps } from '../StepRenderer';
import type { WizardCloudTarget } from '@byb/config-generator';

function getFieldError(errors: StepProps['errors'], field: string) {
  return errors.find((e) => e.field === field);
}

interface ProviderOption {
  value: WizardCloudTarget['provider'];
  label: string;
  description: string;
  regions: Array<{ value: string; label: string }>;
}

const PROVIDERS: ProviderOption[] = [
  {
    value: 'aws',
    label: 'Amazon Web Services',
    description: 'DynamoDB, S3, CloudFront, Lambda, SES, CDK',
    regions: [
      { value: 'us-east-1', label: 'US East (N. Virginia)' },
      { value: 'us-west-2', label: 'US West (Oregon)' },
      { value: 'eu-west-1', label: 'Europe (Ireland)' },
      { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
    ],
  },
  {
    value: 'azure',
    label: 'Microsoft Azure',
    description: 'Cosmos DB, Blob Storage, CDN, Functions',
    regions: [
      { value: 'eastus', label: 'East US' },
      { value: 'westus2', label: 'West US 2' },
      { value: 'westeurope', label: 'West Europe' },
      { value: 'southeastasia', label: 'Southeast Asia' },
    ],
  },
  {
    value: 'gcp',
    label: 'Google Cloud Platform',
    description: 'Firestore, Cloud Storage, Cloud CDN, Cloud Functions',
    regions: [
      { value: 'us-central1', label: 'US Central (Iowa)' },
      { value: 'us-east1', label: 'US East (South Carolina)' },
      { value: 'europe-west1', label: 'Europe West (Belgium)' },
      { value: 'asia-southeast1', label: 'Asia Southeast (Singapore)' },
    ],
  },
];

export function CloudStep({ data, errors, onUpdate }: StepProps) {
  const cloud = (data ?? {}) as Partial<WizardCloudTarget>;
  const selectedProvider = cloud.provider ?? 'aws';
  const providerConfig = PROVIDERS.find((p) => p.value === selectedProvider)!;

  const update = (updates: Partial<WizardCloudTarget>) => {
    onUpdate({ provider: 'aws', region: 'us-east-1', ...cloud, ...updates });
  };

  // Initialize default values on mount
  useEffect(() => {
    if (!cloud.provider) {
      onUpdate({ provider: 'aws', region: 'us-east-1' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProviderChange = (provider: WizardCloudTarget['provider']) => {
    const newProvider = PROVIDERS.find((p) => p.value === provider)!;
    update({
      provider,
      region: newProvider.regions[0].value,
    });
  };

  return (
    <div className="space-y-8">
      {/* Provider selection as cards */}
      <div>
        <Label className="mb-3 block">
          Cloud Provider <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PROVIDERS.map((provider) => {
            const isSelected = selectedProvider === provider.value;
            return (
              <button
                key={provider.value}
                type="button"
                onClick={() => handleProviderChange(provider.value)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border-2 p-5 text-center transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30',
                )}
              >
                <Cloud
                  className={cn(
                    'h-8 w-8',
                    isSelected ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
                <div>
                  <p className="text-sm font-medium">{provider.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {provider.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        {getFieldError(errors, 'provider') && (
          <p className="mt-2 text-xs text-destructive">
            {getFieldError(errors, 'provider')!.message}
          </p>
        )}
      </div>

      {/* Region selection */}
      <div className="max-w-md space-y-2">
        <Label htmlFor="region">
          Deployment Region <span className="text-destructive">*</span>
        </Label>
        <Select
          id="region"
          value={cloud.region ?? providerConfig.regions[0].value}
          onValueChange={(val) => update({ region: val })}
          className={cn(
            getFieldError(errors, 'region') &&
              'border-destructive focus-visible:ring-destructive',
          )}
        >
          {providerConfig.regions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label} ({r.value})
            </option>
          ))}
        </Select>
        {getFieldError(errors, 'region') && (
          <p className="text-xs text-destructive">
            {getFieldError(errors, 'region')!.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Choose the region closest to your primary audience.
        </p>
      </div>

      {/* Custom Domain */}
      <div className="max-w-md space-y-2">
        <Label htmlFor="customDomain" className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5" />
          Custom Domain
          <span className="text-xs text-muted-foreground font-normal">
            (optional)
          </span>
        </Label>
        <Input
          id="customDomain"
          placeholder="shop.yourdomain.com"
          value={cloud.customDomain ?? ''}
          onChange={(e) => update({ customDomain: e.target.value })}
          className={cn(
            getFieldError(errors, 'customDomain') &&
              'border-destructive focus-visible:ring-destructive',
          )}
        />
        {getFieldError(errors, 'customDomain') && (
          <p className="text-xs text-destructive">
            {getFieldError(errors, 'customDomain')!.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          You can configure DNS later. Leave blank to use the default
          subdomain.
        </p>
      </div>
    </div>
  );
}
