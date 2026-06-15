import { useEffect, useMemo, useState } from "react";
import { DashboardReportCategory, DashboardReportProductStock } from "@/lib/api";
import { InventoryAlerts } from "@/pages/dashboard/components/InventoryAlerts";
import { InventoryPreview } from "@/pages/dashboard/components/InventoryPreview";
import { OperationsSnapshot } from "@/pages/dashboard/components/OperationsSnapshot";
import { ProductionLogsPreview } from "@/pages/dashboard/components/ProductionLogsPreview";
import { ProductionTrendChart } from "@/pages/dashboard/components/ProductionTrendChart";
import { ReportsSection } from "@/pages/dashboard/components/ReportsSection";
import { UnifiedActivityFeed } from "@/pages/dashboard/components/UnifiedActivityFeed";
import { useDashboardData } from "@/pages/dashboard/hooks/useDashboardData";
import { useProductionTrend } from "@/pages/dashboard/hooks/useProductionTrend";
import type { DashboardReportProductStock as DashboardReportProductStockType, TrendView } from "@/pages/dashboard/types";
import {
  buildLowStockAlerts,
  buildOperationsSnapshot,
  buildUnifiedActivities,
  calculateDashboardStats,
  parseNumber,
  sortInventoryEntries,
  sortProductionLogs,
} from "@/pages/dashboard/utils/dashboardCalculations";

export function Dashboard() {
  const STOCK_PAGE_SIZE = 5;
  const ITEMS_PER_PAGE = 6;
  const {
    activeReportCategory,
    data,
    isLoading,
    loadError,
    reportFromDate,
    reportToDate,
    reportsData,
    reportsError,
    reportsLoading,
    setActiveReportCategory,
    setReportFromDate,
    setReportToDate,
    setStockPage,
    stockPage,
  } = useDashboardData();
  const [currentPage, setCurrentPage] = useState(1);
  const [trendView, setTrendView] = useState<TrendView>("day");

  const dashboardStats = useMemo(
    () => calculateDashboardStats(data.manufacturingEntries, data.dispatchEntries),
    [data.dispatchEntries, data.manufacturingEntries],
  );

  const sortedInventoryEntries = useMemo(
    () => sortInventoryEntries(data.inventoryEntries),
    [data.inventoryEntries],
  );

  const sortedProductionLogs = useMemo(
    () => sortProductionLogs(data.productionMaterialLogs),
    [data.productionMaterialLogs],
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

  const totalPages = Math.ceil(lowStockAlerts.length / ITEMS_PER_PAGE);
  const paginatedAlerts = lowStockAlerts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [lowStockAlerts]);

  const activeReportSummary = useMemo<DashboardReportCategory | null>(
    () =>
      activeReportCategory
        ? reportsData.productionByCategory.find((item) => item.productCategory === activeReportCategory) || null
        : null,
    [activeReportCategory, reportsData.productionByCategory],
  );

  const reportCategoryOptions = useMemo(
    () => reportsData.productionByCategory.map((item) => item.productCategory),
    [reportsData.productionByCategory],
  );

  const activeCategoryProductStocks = useMemo<DashboardReportProductStockType[]>(() => {
    const categoryStocks = activeReportCategory
      ? reportsData.productStocksByCategory[activeReportCategory] || []
      : Object.values(reportsData.productStocksByCategory).flat();

    return [...categoryStocks].sort(
      (left, right) => parseNumber(right.currentQuantity) - parseNumber(left.currentQuantity),
    );
  }, [activeReportCategory, reportsData.productStocksByCategory]);

  const totalStockPages = useMemo(
    () => Math.max(1, Math.ceil(activeCategoryProductStocks.length / STOCK_PAGE_SIZE)),
    [activeCategoryProductStocks.length],
  );

  const paginatedStocks = useMemo(
    () => activeCategoryProductStocks.slice((stockPage - 1) * STOCK_PAGE_SIZE, stockPage * STOCK_PAGE_SIZE),
    [activeCategoryProductStocks, stockPage],
  );

  const { peakProductionPoint, productionTrendData } = useProductionTrend({
    activeReportCategory,
    manufacturingEntries: data.manufacturingEntries,
    reportFromDate,
    reportToDate,
    trendView,
  });

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
        alerts={lowStockAlerts}
        currentPage={currentPage}
        isLoading={isLoading}
        onNextPage={() => setCurrentPage((page) => page + 1)}
        onPreviousPage={() => setCurrentPage((page) => page - 1)}
        paginatedAlerts={paginatedAlerts}
        totalPages={totalPages}
      />

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.9fr)] lg:items-start lg:gap-5">
        <ReportsSection
          activeCategoryProductStocks={activeCategoryProductStocks}
          activeReportCategory={activeReportCategory}
          activeReportSummary={activeReportSummary}
          onCategoryChange={(value) => {
            setActiveReportCategory(value);
            setStockPage(1);
          }}
          onFromDateChange={setReportFromDate}
          onNextPage={() => setStockPage((page) => Math.min(totalStockPages, page + 1))}
          onPreviousPage={() => setStockPage((page) => Math.max(1, page - 1))}
          onToDateChange={setReportToDate}
          paginatedStocks={paginatedStocks}
          reportCategoryOptions={reportCategoryOptions}
          reportFromDate={reportFromDate}
          reportToDate={reportToDate}
          reportsError={reportsError}
          reportsLoading={reportsLoading}
          stockPage={stockPage}
          totalStockPages={totalStockPages}
        />

        <ProductionTrendChart
          activeReportCategory={activeReportCategory}
          onTrendViewChange={setTrendView}
          peakProductionPoint={peakProductionPoint}
          productionTrendData={productionTrendData}
          trendView={trendView}
        />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.15fr)] xl:gap-6">
        <InventoryPreview entries={sortedInventoryEntries} isLoading={isLoading} />
        <ProductionLogsPreview isLoading={isLoading} logs={sortedProductionLogs} />
      </div>

      <UnifiedActivityFeed activities={unifiedActivities} href="/reports" />
    </div>
  );
}
