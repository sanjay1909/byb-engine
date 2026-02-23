import { useState, useMemo, useCallback } from 'react';
import { listPresets, filterPresets, applyPreset } from '@byb/presets';
import type { SitePreset, PresetFilter, AppliedPreset } from '@byb/presets';

export function usePresetGallery() {
  const [filter, setFilter] = useState<PresetFilter>({});
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const allPresets = useMemo(() => listPresets(), []);

  const filteredPresets = useMemo(() => {
    const hasFilter = filter.industry || filter.style || filter.search;
    return hasFilter ? filterPresets(filter) : [...allPresets];
  }, [filter, allPresets]);

  const selectedPreset = useMemo(
    () => allPresets.find((p) => p.id === selectedPresetId) ?? null,
    [allPresets, selectedPresetId],
  );

  const industries = useMemo(() => {
    const set = new Set(allPresets.map((p) => p.industry));
    return [...set].sort();
  }, [allPresets]);

  const styles = useMemo(() => {
    const set = new Set(allPresets.map((p) => p.style));
    return [...set].sort();
  }, [allPresets]);

  const apply = useCallback((presetId: string): AppliedPreset | undefined => {
    setSelectedPresetId(presetId);
    return applyPreset(presetId);
  }, []);

  const clearFilter = useCallback(() => setFilter({}), []);

  return {
    presets: filteredPresets,
    allPresets,
    filter,
    setFilter,
    selectedPreset,
    selectedPresetId,
    setSelectedPresetId,
    industries,
    styles,
    apply,
    clearFilter,
  };
}
