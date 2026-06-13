import { useMemo } from "react";
import type { ManufacturingEntry } from "@/lib/api";
import type { TrendView } from "@/pages/dashboard/types";
import { buildProductionTrendData } from "@/pages/dashboard/utils/dashboardCalculations";

export function useProductionTrend(params: {
  activeReportCategory: string;
  manufacturingEntries: ManufacturingEntry[];
  reportFromDate: string;
  reportToDate: string;
  trendView: TrendView;
}) {
  const { activeReportCategory, manufacturingEntries, reportFromDate, reportToDate, trendView } = params;

  const productionTrendData = useMemo(
    () =>
      buildProductionTrendData({
        activeReportCategory,
        manufacturingEntries,
        reportFromDate,
        reportToDate,
        trendView,
      }),
    [activeReportCategory, manufacturingEntries, reportFromDate, reportToDate, trendView],
  );

  const peakProductionPoint = useMemo(
    () =>
      productionTrendData.reduce<{ key: string; label: string; totalProductionKg: number } | null>((peak, point) => {
        if (!peak || point.totalProductionKg > peak.totalProductionKg) {
          return point;
        }

        return peak;
      }, null),
    [productionTrendData],
  );

  return {
    peakProductionPoint,
    productionTrendData,
  };
}
