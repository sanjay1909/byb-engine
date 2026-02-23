import { useState } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useStoreManager } from '@/hooks/useStoreManager';
import { NewStoreButton } from '@/components/admin/NewStoreButton';
import { StoreList } from '@/components/admin/StoreList';
import { StoreDetail } from '@/components/admin/StoreDetail';
import { SummaryStats } from '@/components/admin/SummaryStats';

export function AdminDashboard() {
  const { stores, getStore, summary, count } = useStoreManager();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const allStores = stores();
  const dashboardSummary = summary();
  const totalStores = count();

  const selectedStore = selectedStoreId ? getStore(selectedStoreId) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                BYB Engine Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage your stores, monitor provisioning, and view analytics.
              </p>
            </div>
          </div>
          <NewStoreButton />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="stores">
          <TabsList className="mb-6">
            <TabsTrigger value="stores">Stores</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="stores">
            <StoreList
              stores={allStores}
              onSelectStore={(id) => setSelectedStoreId(id)}
            />
          </TabsContent>

          <TabsContent value="summary">
            <SummaryStats
              summary={dashboardSummary}
              totalStores={totalStores}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Store detail side panel */}
      {selectedStore && (
        <StoreDetail
          store={selectedStore}
          onClose={() => setSelectedStoreId(null)}
        />
      )}
    </div>
  );
}
