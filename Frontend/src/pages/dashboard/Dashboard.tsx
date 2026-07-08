import { useMemo } from "react";
import { InventoryAlerts } from "@/pages/dashboard/components/InventoryAlerts";
import { OperationsSnapshot } from "@/pages/dashboard/components/OperationsSnapshot";
import { ProductionDispatchSection } from "@/pages/dashboard/components/ProductionDispatchSection";
import { UnifiedActivityFeed } from "@/pages/dashboard/components/UnifiedActivityFeed";
import { useDashboardData } from "@/pages/dashboard/hooks/useDashboardData";
import {
  buildLowStockAlerts,
  buildOperationsSnapshot,
  buildUnifiedActivities,
  calculateDashboardStats,
  parseNumber,
  sortInventoryEntries,
} from "@/pages/dashboard/utils/dashboardCalculations";

export function Dashboard() {
  const {
    data,
    isLoading,
    loadError,
  } = useDashboardData();

  const dashboardStats = useMemo(
    () => calculateDashboardStats(data.manufacturingEntries, data.dispatchEntries),
    [data.dispatchEntries, data.manufacturingEntries],
  );

  const sortedInventoryEntries = useMemo(
    () => sortInventoryEntries(data.inventoryEntries),
    [data.inventoryEntries],
  );

  const unifiedActivities = useMemo(
    () => buildUnifiedActivities(data.purchaseEntries, data.manufacturingEntries, data.dispatchEntries),
    [data.dispatchEntries, data.manufacturingEntries, data.purchaseEntries],
  );

  const lowStockAlerts = useMemo(
    () => buildLowStockAlerts(sortedInventoryEntries),
    [sortedInventoryEntries],
  );

  const operationsSnapshot = useMemo(
    () =>
      buildOperationsSnapshot({
        dashboardStats,
        inventoryEntries: data.inventoryEntries,
        lowStockCount: lowStockAlerts.length,
        productionMaterialLogs: data.productionMaterialLogs,
        purchaseEntries: data.purchaseEntries,
      }),
    [
      dashboardStats,
      data.inventoryEntries,
      data.productionMaterialLogs,
      data.purchaseEntries,
      lowStockAlerts.length,
    ],
  );

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden sm:space-y-6">
      <OperationsSnapshot
        dispatchCount={data.dispatchEntries.length}
        isLoading={isLoading}
        items={operationsSnapshot}
        productionLogCount={data.productionMaterialLogs.length}
      />

      {loadError ? (
        <div className="rounded-lg border border-dashed border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive sm:p-4 sm:text-sm">
          {loadError}
        </div>
      ) : null}

      <InventoryAlerts
        inventoryEntries={sortedInventoryEntries}
        isLoading={isLoading}
        productionMaterialLogs={data.productionMaterialLogs}
      />

      <ProductionDispatchSection
        dispatchEntries={data.dispatchEntries}
        isLoading={isLoading}
        manufacturingEntries={data.manufacturingEntries}
      />

      <UnifiedActivityFeed activities={unifiedActivities} href="/reports" />
    </div>
  );
}
