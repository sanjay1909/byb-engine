import { useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LayoutGrid } from 'lucide-react';
import type { StepProps } from '../StepRenderer';
import type { WizardLayout } from '@byb/config-generator';

const DEFAULT_PAGES: WizardLayout['pages'] = [
  { pageId: 'home', label: 'Home', enabled: true },
  { pageId: 'products', label: 'Products', enabled: true },
  { pageId: 'blog', label: 'Blog', enabled: false },
  { pageId: 'contact', label: 'Contact', enabled: false },
  { pageId: 'our-story', label: 'Our Story', enabled: false },
  { pageId: 'faq', label: 'FAQ', enabled: false },
];

/** Pages that are always required and cannot be toggled off */
const REQUIRED_PAGES = new Set(['home', 'products']);

const PAGE_DESCRIPTIONS: Record<string, string> = {
  home: 'The landing page featuring your hero section, featured products, and brand story.',
  products: 'Product catalog with search, filters, and detailed product pages.',
  blog: 'A blog section to share updates, tips, and drive organic traffic.',
  contact: 'Contact form with your email, phone, and optional map embed.',
  'our-story': 'Tell visitors about your brand, mission, and team.',
  faq: 'Frequently asked questions to reduce support inquiries.',
};

export function LayoutStep({ data, errors, onUpdate }: StepProps) {
  const layout = (data ?? {}) as Partial<WizardLayout>;
  const pages = layout.pages?.length ? layout.pages : DEFAULT_PAGES;

  // Initialize defaults on mount
  useEffect(() => {
    if (!layout.pages?.length) {
      onUpdate({ pages: DEFAULT_PAGES });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePage = (pageId: string, enabled: boolean) => {
    const updatedPages = pages.map((p) =>
      p.pageId === pageId ? { ...p, enabled } : { ...p },
    );

    const updatedLayout: Partial<WizardLayout> = {
      ...layout,
      pages: updatedPages,
      includeBlog: updatedPages.find((p) => p.pageId === 'blog')?.enabled,
      includeContact: updatedPages.find((p) => p.pageId === 'contact')?.enabled,
      includeStory: updatedPages.find((p) => p.pageId === 'our-story')?.enabled,
    };

    onUpdate(updatedLayout);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <LayoutGrid className="h-4 w-4" />
        <p className="text-sm">
          Toggle pages on or off. Home and Products are always enabled.
        </p>
      </div>

      <div className="space-y-1">
        {pages.map((page) => {
          const isRequired = REQUIRED_PAGES.has(page.pageId);
          return (
            <div
              key={page.pageId}
              className="flex items-start justify-between gap-4 rounded-lg border px-4 py-4"
            >
              <div className="space-y-1">
                <Label className="text-sm font-medium">{page.label}</Label>
                <p className="text-xs text-muted-foreground">
                  {PAGE_DESCRIPTIONS[page.pageId] ?? ''}
                </p>
              </div>
              <Switch
                checked={page.enabled}
                onCheckedChange={(checked) => togglePage(page.pageId, checked)}
                disabled={isRequired}
                aria-label={`Toggle ${page.label}`}
              />
            </div>
          );
        })}
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
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
