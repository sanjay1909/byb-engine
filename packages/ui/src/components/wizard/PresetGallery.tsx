import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { usePresetGallery } from '@/hooks/usePresetGallery';
import { Check, X } from 'lucide-react';
import type { WizardBranding, WizardLayout } from '@byb/config-generator';

interface PresetGalleryProps {
  onApply: (branding: WizardBranding, layout: WizardLayout) => void;
}

export function PresetGallery({ onApply }: PresetGalleryProps) {
  const {
    presets,
    filter,
    setFilter,
    selectedPresetId,
    industries,
    styles,
    apply,
    clearFilter,
  } = usePresetGallery();

  const hasActiveFilter = !!filter.industry || !!filter.style;

  const handleApply = (presetId: string) => {
    const result = apply(presetId);
    if (result) {
      onApply(result.branding, result.layout);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filter.industry ?? ''}
          onValueChange={(val) =>
            setFilter({ ...filter, industry: val || undefined } as any)
          }
          className="w-40"
        >
          <option value="">All Industries</option>
          {industries.map((ind) => (
            <option key={ind} value={ind}>
              {ind.charAt(0).toUpperCase() + ind.slice(1)}
            </option>
          ))}
        </Select>

        <Select
          value={filter.style ?? ''}
          onValueChange={(val) =>
            setFilter({ ...filter, style: val || undefined } as any)
          }
          className="w-40"
        >
          <option value="">All Styles</option>
          {styles.map((style) => (
            <option key={style} value={style}>
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </option>
          ))}
        </Select>

        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilter}
            className="gap-1 text-xs"
          >
            <X className="h-3 w-3" />
            Clear Filters
          </Button>
        )}

        <span className="text-xs text-muted-foreground ml-auto">
          {presets.length} preset{presets.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Preset grid */}
      {presets.length === 0 ? (
        <div className="rounded-lg border border-dashed py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No presets match your filters.
          </p>
          <Button
            variant="link"
            size="sm"
            className="mt-1"
            onClick={clearFilter}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {presets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApply(preset.id)}
                className={cn(
                  'group relative flex flex-col rounded-lg border-2 p-4 text-left transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/30 hover:shadow-sm',
                )}
              >
                {/* Selected check mark */}
                {isSelected && (
                  <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}

                {/* Color swatches */}
                <div className="flex gap-1.5 mb-3">
                  <div
                    className="h-6 w-6 rounded-full border"
                    style={{
                      backgroundColor: preset.branding.primaryColor,
                    }}
                    title={`Primary: ${preset.branding.primaryColor}`}
                  />
                  <div
                    className="h-6 w-6 rounded-full border"
                    style={{
                      backgroundColor: preset.branding.secondaryColor,
                    }}
                    title={`Secondary: ${preset.branding.secondaryColor}`}
                  />
                  {preset.branding.backgroundColor && (
                    <div
                      className="h-6 w-6 rounded-full border"
                      style={{
                        backgroundColor: preset.branding.backgroundColor,
                      }}
                      title={`Background: ${preset.branding.backgroundColor}`}
                    />
                  )}
                </div>

                {/* Name and description */}
                <p className="text-sm font-medium leading-tight">
                  {preset.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {preset.description}
                </p>

                {/* Badges */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {preset.industry}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {preset.style}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
