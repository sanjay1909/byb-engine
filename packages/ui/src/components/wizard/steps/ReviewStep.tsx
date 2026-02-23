import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Pencil } from 'lucide-react';
import type { WizardAnswers } from '@byb/config-generator';
import type { WizardStepId } from '@byb/wizard';

/**
 * ReviewStep receives the full wizard data (all steps) and displays
 * a read-only summary. The jumpTo function is accessed indirectly
 * via the parent WizardShell — we pass it through a custom prop.
 */
interface ReviewStepProps {
  data: any;
  errors: Array<{ field: string; message: string }>;
  onUpdate: (data: any) => void;
}

/**
 * We get jumpTo from the wizard orchestrator in the parent.
 * ReviewStep is rendered inside StepRenderer which doesn't expose jumpTo directly,
 * so we store it on window as a lightweight bridge, or we use sessionStorage.
 *
 * Better approach: ReviewStep uses a custom event to request navigation.
 * But simplest: we accept an optional jumpTo in data.__jumpTo.
 *
 * Cleanest approach for now: The "Edit" buttons use anchor-style links
 * that the user clicks, and the parent WizardShell intercepts via the
 * onJumpTo mechanism. We'll fire a custom DOM event.
 */
function EditLink({
  stepId,
  label,
}: {
  stepId: WizardStepId;
  label: string;
}) {
  const handleClick = () => {
    window.dispatchEvent(
      new CustomEvent('wizard:jumpTo', { detail: { stepId } }),
    );
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
      onClick={handleClick}
    >
      <Pencil className="h-3 w-3" />
      Edit
    </Button>
  );
}

function SectionHeader({
  title,
  stepId,
}: {
  title: string;
  stepId: WizardStepId;
}) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold">{title}</h3>
      <EditLink stepId={stepId} label={title} />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-right">{children}</span>
    </div>
  );
}

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-5 w-5 rounded border"
        style={{ backgroundColor: color }}
      />
      <span className="font-mono text-xs">{color}</span>
    </div>
  );
}

export function ReviewStep({ data, errors }: ReviewStepProps) {
  const answers = (data ?? {}) as Partial<WizardAnswers>;
  const business = answers.business;
  const branding = answers.branding;
  const layout = answers.layout;
  const features = answers.features;
  const shipping = answers.shipping;
  const cloud = answers.cloud;

  return (
    <div className="space-y-6">
      {errors.length > 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
          <p className="text-sm font-medium text-destructive mb-1">
            Some steps have validation errors
          </p>
          {errors.map((err, i) => (
            <p key={i} className="text-xs text-destructive">
              {err.field}: {err.message}
            </p>
          ))}
        </div>
      )}

      {/* Business Info */}
      <div>
        <SectionHeader title="Business Info" stepId="business" />
        <div className="mt-2 rounded-lg border px-4 py-3 space-y-1">
          <Field label="Store ID">{business?.storeId ?? '--'}</Field>
          <Field label="Store Name">{business?.storeName ?? '--'}</Field>
          <Field label="Website URL">{business?.siteUrl ?? '--'}</Field>
          <Field label="Support Email">
            {business?.supportEmail ?? '--'}
          </Field>
          <Field label="Currency">
            {(business?.currency ?? 'usd').toUpperCase()}
          </Field>
        </div>
      </div>

      <Separator />

      {/* Branding */}
      <div>
        <SectionHeader title="Branding" stepId="branding" />
        <div className="mt-2 rounded-lg border px-4 py-3 space-y-2">
          <div className="flex items-baseline justify-between gap-4 py-1">
            <span className="text-xs text-muted-foreground">Colors</span>
            <div className="flex items-center gap-4">
              {branding?.primaryColor && (
                <ColorSwatch
                  color={branding.primaryColor}
                  label="Primary"
                />
              )}
              {branding?.secondaryColor && (
                <ColorSwatch
                  color={branding.secondaryColor}
                  label="Secondary"
                />
              )}
              {branding?.backgroundColor && (
                <ColorSwatch
                  color={branding.backgroundColor}
                  label="Background"
                />
              )}
            </div>
          </div>
          <Field label="Display Font">
            {branding?.displayFont ?? '--'}
          </Field>
          <Field label="Body Font">{branding?.bodyFont ?? '--'}</Field>
          <Field label="Button Style">
            {branding?.buttonStyle ?? '--'}
          </Field>
          <Field label="Card Style">{branding?.cardStyle ?? '--'}</Field>
          <Field label="Hero Style">{branding?.heroStyle ?? '--'}</Field>
        </div>
      </div>

      <Separator />

      {/* Layout */}
      <div>
        <SectionHeader title="Layout" stepId="layout" />
        <div className="mt-2 rounded-lg border px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {layout?.pages?.length ? (
              layout.pages
                .filter((p) => p.enabled)
                .map((p) => (
                  <Badge key={p.pageId} variant="secondary">
                    {p.label}
                  </Badge>
                ))
            ) : (
              <span className="text-xs text-muted-foreground">
                No pages configured
              </span>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Features */}
      <div>
        <SectionHeader title="Features" stepId="features" />
        <div className="mt-2 rounded-lg border px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {features?.blog && <Badge variant="success">Blog CMS</Badge>}
            {features?.campaigns && (
              <Badge variant="success">Email Campaigns</Badge>
            )}
            {features?.payments && (
              <Badge variant="success">
                Payments (
                {typeof features.payments === 'string'
                  ? features.payments
                  : 'enabled'}
                )
              </Badge>
            )}
            {features?.analytics && (
              <Badge variant="success">Analytics</Badge>
            )}
            {features?.oe && (
              <Badge variant="success">Operational Engineering</Badge>
            )}
            {!features?.blog &&
              !features?.campaigns &&
              !features?.payments &&
              !features?.analytics &&
              !features?.oe && (
                <span className="text-xs text-muted-foreground">
                  No optional features enabled
                </span>
              )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Shipping */}
      <div>
        <SectionHeader title="Shipping" stepId="shipping" />
        <div className="mt-2 rounded-lg border px-4 py-3 space-y-1">
          <Field label="Type">
            {shipping?.type === 'free_over'
              ? 'Free over threshold'
              : 'Flat rate'}
          </Field>
          {shipping?.flatRate !== undefined && (
            <Field label="Flat Rate">
              ${(shipping.flatRate / 100).toFixed(2)}
            </Field>
          )}
          {shipping?.freeOver !== undefined && (
            <Field label="Free Shipping Over">
              ${(shipping.freeOver / 100).toFixed(2)}
            </Field>
          )}
        </div>
      </div>

      <Separator />

      {/* Cloud */}
      <div>
        <SectionHeader title="Cloud Setup" stepId="cloud" />
        <div className="mt-2 rounded-lg border px-4 py-3 space-y-1">
          <Field label="Provider">
            {cloud?.provider?.toUpperCase() ?? '--'}
          </Field>
          <Field label="Region">{cloud?.region ?? '--'}</Field>
          <Field label="Custom Domain">
            {cloud?.customDomain || 'None (default subdomain)'}
          </Field>
        </div>
      </div>
    </div>
  );
}
