import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { PresetGallery } from '../PresetGallery';
import type { StepProps } from '../StepRenderer';
import type { WizardBranding, WizardLayout } from '@byb/config-generator';

const DISPLAY_FONTS = [
  { value: 'Cinzel', label: 'Cinzel' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond' },
];

const BODY_FONTS = [
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Nunito', label: 'Nunito' },
];

const BUTTON_STYLES = [
  { value: 'solid', label: 'Solid' },
  { value: 'outline', label: 'Outline' },
  { value: 'ghost', label: 'Ghost' },
  { value: 'pill', label: 'Pill' },
];

const CARD_STYLES = [
  { value: 'flat', label: 'Flat' },
  { value: 'bordered', label: 'Bordered' },
  { value: 'elevated', label: 'Elevated' },
];

const HERO_STYLES = [
  { value: 'classic', label: 'Classic' },
  { value: 'blob', label: 'Blob' },
  { value: 'glow', label: 'Glow' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'sunflower', label: 'Sunflower' },
  { value: 'playful', label: 'Playful' },
  { value: 'boutique', label: 'Boutique' },
];

function getFieldError(errors: StepProps['errors'], field: string) {
  return errors.find((e) => e.field === field);
}

export function BrandingStep({ data, errors, onUpdate }: StepProps) {
  const branding = (data ?? {}) as Partial<WizardBranding>;

  // Initialize defaults on mount
  useEffect(() => {
    if (!branding.primaryColor) {
      onUpdate({
        primaryColor: '#171717',
        secondaryColor: '#f3e8ff',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (field: keyof WizardBranding, value: string) => {
    onUpdate({
      primaryColor: '#171717',
      secondaryColor: '#f3e8ff',
      ...branding,
      [field]: value,
    });
  };

  const handlePresetApply = (
    presetBranding: WizardBranding,
    _layout: WizardLayout,
  ) => {
    onUpdate(presetBranding);
  };

  return (
    <div className="space-y-8">
      {/* Color section */}
      <div>
        <h3 className="text-sm font-medium mb-4">Colors</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* Primary Color */}
          <div className="space-y-2">
            <Label htmlFor="primaryColor">
              Primary Color <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="primaryColor"
                type="color"
                value={branding.primaryColor ?? '#171717'}
                onChange={(e) => update('primaryColor', e.target.value)}
                className={cn(
                  'h-10 w-14 cursor-pointer p-1',
                  getFieldError(errors, 'primaryColor') && 'border-destructive',
                )}
              />
              <Input
                value={branding.primaryColor ?? '#171717'}
                onChange={(e) => update('primaryColor', e.target.value)}
                placeholder="#171717"
                className="flex-1 font-mono text-xs"
              />
            </div>
            {getFieldError(errors, 'primaryColor') && (
              <p className="text-xs text-destructive">
                {getFieldError(errors, 'primaryColor')!.message}
              </p>
            )}
          </div>

          {/* Secondary Color */}
          <div className="space-y-2">
            <Label htmlFor="secondaryColor">
              Secondary Color <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="secondaryColor"
                type="color"
                value={branding.secondaryColor ?? '#f3e8ff'}
                onChange={(e) => update('secondaryColor', e.target.value)}
                className={cn(
                  'h-10 w-14 cursor-pointer p-1',
                  getFieldError(errors, 'secondaryColor') && 'border-destructive',
                )}
              />
              <Input
                value={branding.secondaryColor ?? '#f3e8ff'}
                onChange={(e) => update('secondaryColor', e.target.value)}
                placeholder="#f3e8ff"
                className="flex-1 font-mono text-xs"
              />
            </div>
            {getFieldError(errors, 'secondaryColor') && (
              <p className="text-xs text-destructive">
                {getFieldError(errors, 'secondaryColor')!.message}
              </p>
            )}
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <Label htmlFor="backgroundColor">Background Color</Label>
            <div className="flex items-center gap-3">
              <Input
                id="backgroundColor"
                type="color"
                value={branding.backgroundColor ?? '#ffffff'}
                onChange={(e) => update('backgroundColor', e.target.value)}
                className="h-10 w-14 cursor-pointer p-1"
              />
              <Input
                value={branding.backgroundColor ?? '#ffffff'}
                onChange={(e) => update('backgroundColor', e.target.value)}
                placeholder="#ffffff"
                className="flex-1 font-mono text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Typography section */}
      <div>
        <h3 className="text-sm font-medium mb-4">Typography</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Display Font */}
          <div className="space-y-2">
            <Label htmlFor="displayFont">Display Font</Label>
            <Select
              id="displayFont"
              value={branding.displayFont ?? ''}
              onValueChange={(val) => update('displayFont', val)}
            >
              <option value="">Select a display font...</option>
              {DISPLAY_FONTS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Body Font */}
          <div className="space-y-2">
            <Label htmlFor="bodyFont">Body Font</Label>
            <Select
              id="bodyFont"
              value={branding.bodyFont ?? ''}
              onValueChange={(val) => update('bodyFont', val)}
            >
              <option value="">Select a body font...</option>
              {BODY_FONTS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Style section */}
      <div>
        <h3 className="text-sm font-medium mb-4">Component Styles</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* Button Style */}
          <div className="space-y-2">
            <Label htmlFor="buttonStyle">Button Style</Label>
            <Select
              id="buttonStyle"
              value={branding.buttonStyle ?? 'solid'}
              onValueChange={(val) => update('buttonStyle', val)}
            >
              {BUTTON_STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Card Style */}
          <div className="space-y-2">
            <Label htmlFor="cardStyle">Card Style</Label>
            <Select
              id="cardStyle"
              value={branding.cardStyle ?? 'bordered'}
              onValueChange={(val) => update('cardStyle', val)}
            >
              {CARD_STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Hero Style */}
          <div className="space-y-2">
            <Label htmlFor="heroStyle">Hero Style</Label>
            <Select
              id="heroStyle"
              value={branding.heroStyle ?? 'classic'}
              onValueChange={(val) => update('heroStyle', val)}
            >
              {HERO_STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Preset Gallery */}
      <div>
        <h3 className="text-sm font-medium mb-1">Quick Start with a Preset</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Choose a preset to auto-fill branding values. You can customize everything afterwards.
        </p>
        <PresetGallery onApply={handlePresetApply} />
      </div>
    </div>
  );
}
