import { useState } from 'react';
import { ArrowUpRight, Package } from 'lucide-react';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { StoreRecord, StoreStatus } from '@byb/store-manager';

export interface StoreListProps {
  stores: StoreRecord[];
  onSelectStore: (storeId: string) => void;
}

const statusFilter: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'created', label: 'Created' },
  { value: 'provisioning', label: 'Provisioning' },
  { value: 'active', label: 'Active' },
  { value: 'error', label: 'Error' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'deleted', label: 'Deleted' },
];

const statusBadgeConfig: Record<
  StoreStatus,
  { variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'; label: string }
> = {
  created: { variant: 'secondary', label: 'Created' },
  provisioning: { variant: 'default', label: 'Provisioning' },
  active: { variant: 'success', label: 'Active' },
  error: { variant: 'destructive', label: 'Error' },
  suspended: { variant: 'warning', label: 'Suspended' },
  deprovisioning: { variant: 'default', label: 'Deprovisioning' },
  deleted: { variant: 'outline', label: 'Deleted' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function StoreList({ stores, onSelectStore }: StoreListProps) {
  const [filter, setFilter] = useState('all');

  const filtered =
    filter === 'all'
      ? stores
      : stores.filter((s) => s.status === filter);

  if (stores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-lg font-medium text-foreground mb-1">
          No stores yet
        </p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Create your first store using the wizard to get started. Click the
          &ldquo;New Store&rdquo; button above.
        </p>
        <div className="mt-4">
          <ArrowUpRight className="h-5 w-5 text-muted-foreground/50 rotate-45" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Select
          value={filter}
          onValueChange={setFilter}
          className="w-48"
        >
          {statusFilter.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <span className="text-xs text-muted-foreground">
          {filtered.length} store{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Store table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left font-medium text-muted-foreground px-4 py-3">
                Store
              </th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3">
                Status
              </th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">
                Provider
              </th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">
                Region
              </th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((store) => {
              const badge =
                statusBadgeConfig[store.status] ?? statusBadgeConfig.created;
              return (
                <tr
                  key={store.storeId}
                  onClick={() => onSelectStore(store.storeId)}
                  className={cn(
                    'border-b last:border-b-0 cursor-pointer transition-colors',
                    'hover:bg-accent/50',
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {store.storeName}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {store.storeId}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={badge.variant} className="text-[11px]">
                      {badge.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant="outline" className="text-[11px] font-mono">
                      {store.cloudProvider.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {store.region}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums hidden lg:table-cell">
                    {formatDate(store.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty filter state */}
      {filtered.length === 0 && stores.length > 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            No stores match the selected filter.
          </p>
        </div>
      )}
    </div>
  );
}
