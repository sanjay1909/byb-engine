import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ExternalLink,
  Cloud,
  MapPin,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { StoreRecord, StoreStatus } from '@byb/store-manager';

export interface StoreDetailProps {
  store: StoreRecord;
  onClose: () => void;
}

const statusConfig: Record<
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
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function StoreDetail({ store, onClose }: StoreDetailProps) {
  const cfg = statusConfig[store.status] ?? statusConfig.created;
  const urlEntries = Object.entries(store.urls).filter(
    ([, value]) => value != null && value !== '',
  ) as [string, string][];

  const urlLabels: Record<string, string> = {
    siteUrl: 'Site',
    adminUrl: 'Admin',
    apiUrl: 'API',
    cdnUrl: 'CDN',
  };

  // History, newest first
  const history = [...store.history].reverse();

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />

      {/* Side panel */}
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l bg-background shadow-xl overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground truncate">
              {store.storeName}
            </h2>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {store.storeId}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0 -mt-1 -mr-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-6 space-y-6 pb-8">
          {/* Status + provider */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Cloud className="h-3.5 w-3.5" />
              <span className="font-medium">
                {store.cloudProvider.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{store.region}</span>
            </div>
          </div>

          <Separator />

          {/* URLs */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">URLs</h3>
            {urlEntries.length > 0 ? (
              <div className="space-y-2">
                {urlEntries.map(([key, url]) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-accent transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {urlLabels[key] ?? key}
                      </p>
                      <p className="text-sm font-mono text-foreground truncate">
                        {url}
                      </p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No URLs assigned yet.
              </p>
            )}
          </section>

          <Separator />

          {/* History */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Status History
            </h3>
            {history.length > 0 ? (
              <div className="space-y-0">
                {history.map((event, idx) => {
                  const eventCfg =
                    statusConfig[event.status] ?? statusConfig.created;
                  return (
                    <div
                      key={`${event.status}-${event.timestamp}-${idx}`}
                      className="relative flex gap-3 pb-4 last:pb-0"
                    >
                      {/* Timeline dot + line */}
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            'h-2.5 w-2.5 rounded-full mt-1.5 shrink-0',
                            event.status === 'active' && 'bg-emerald-500',
                            event.status === 'error' && 'bg-red-500',
                            event.status === 'provisioning' && 'bg-blue-500',
                            event.status === 'suspended' && 'bg-amber-500',
                            event.status === 'created' && 'bg-gray-400',
                            event.status === 'deprovisioning' && 'bg-gray-400',
                            event.status === 'deleted' && 'bg-gray-300',
                          )}
                        />
                        {idx < history.length - 1 && (
                          <div className="w-px flex-1 bg-border mt-1" />
                        )}
                      </div>

                      {/* Event content */}
                      <div className="flex-1 min-w-0 -mt-0.5">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={eventCfg.variant}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {eventCfg.label}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            {formatDate(event.timestamp)}
                          </span>
                        </div>
                        {event.reason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {event.reason}
                          </p>
                        )}
                        {event.errorDetail && (
                          <p className="text-xs text-red-600 mt-1">
                            {event.errorDetail}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No history events recorded.
              </p>
            )}
          </section>

          <Separator />

          {/* Timestamps */}
          <section className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Created {formatDate(store.createdAt)}
            </div>
            {store.updatedAt !== store.createdAt && (
              <>
                <ArrowRight className="h-3 w-3" />
                <span>Updated {formatDate(store.updatedAt)}</span>
              </>
            )}
          </section>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
