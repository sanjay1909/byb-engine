import {
  Store,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Cloud,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { StoreSummary } from '@byb/store-manager';

export interface SummaryStatsProps {
  summary: StoreSummary;
  totalStores: number;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  className?: string;
  valueClassName?: string;
}

function StatCard({
  label,
  value,
  icon,
  className,
  valueClassName,
}: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className={cn('text-3xl font-bold tabular-nums', valueClassName)}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

const providerLabels: Record<string, string> = {
  aws: 'AWS',
  azure: 'Azure',
  gcp: 'GCP',
};

export function SummaryStats({ summary, totalStores }: SummaryStatsProps) {
  const providerEntries = Object.entries(summary.byProvider).filter(
    ([, count]) => count > 0,
  );

  return (
    <div className="space-y-6">
      {/* Primary stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Stores"
          value={totalStores}
          icon={<Store className="h-4 w-4 text-muted-foreground" />}
          valueClassName="text-foreground"
        />
        <StatCard
          label="Active"
          value={summary.byStatus.active ?? 0}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          valueClassName="text-emerald-600"
        />
        <StatCard
          label="Provisioning"
          value={summary.byStatus.provisioning ?? 0}
          icon={<Loader2 className="h-4 w-4 text-blue-500" />}
          valueClassName="text-blue-600"
        />
        <StatCard
          label="Errors"
          value={summary.byStatus.error ?? 0}
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          valueClassName="text-red-600"
        />
      </div>

      {/* Cloud provider breakdown */}
      {providerEntries.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Cloud className="h-4 w-4" />
              By Cloud Provider
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {providerEntries.map(([provider, count]) => (
                <div
                  key={provider}
                  className="flex items-center justify-between rounded-md border px-3 py-2.5"
                >
                  <span className="text-sm font-medium text-foreground">
                    {providerLabels[provider] ?? provider.toUpperCase()}
                  </span>
                  <span className="text-lg font-bold tabular-nums text-foreground">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state for providers */}
      {providerEntries.length === 0 && totalStores === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Cloud className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No stores have been created yet. Provider stats will appear here
              once you create your first store.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
