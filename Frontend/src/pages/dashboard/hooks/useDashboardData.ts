import { useEffect, useMemo, useState } from "react";
import {
  fetchDashboardReports,
  fetchDispatchEntries,
  fetchInventory,
  fetchManufacturingEntries,
  fetchProductionMaterialLogs,
  fetchPurchaseEntries,
} from "@/lib/api";
import type { DashboardData, DashboardReportsState } from "@/pages/dashboard/types";
import { getCurrentMonthDateRange } from "@/pages/dashboard/utils/dashboardCalculations";

export function useDashboardData() {
  const initialReportRange = useMemo(() => getCurrentMonthDateRange(), []);
  const [data, setData] = useState<DashboardData>({
    dispatchEntries: [],
    inventoryEntries: [],
    manufacturingEntries: [],
    productionMaterialLogs: [],
    purchaseEntries: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reportFromDate, setReportFromDate] = useState(initialReportRange.fromDate);
  const [reportToDate, setReportToDate] = useState(initialReportRange.toDate);
  const [reportsData, setReportsData] = useState<DashboardReportsState>({
    productionByCategory: [],
    productStocksByCategory: {},
  });
  const [activeReportCategory, setActiveReportCategory] = useState("");
  const [stockPage, setStockPage] = useState(1);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState("");

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      fetchInventory(),
      fetchProductionMaterialLogs(),
      fetchPurchaseEntries(),
      fetchManufacturingEntries(),
      fetchDispatchEntries(),
    ])
      .then(([inventoryEntries, productionMaterialLogs, purchaseEntries, manufacturingEntries, dispatchEntries]) => {
        if (!isMounted) {
          return;
        }

        setData({
          dispatchEntries,
          inventoryEntries,
          manufacturingEntries,
          productionMaterialLogs,
          purchaseEntries,
        });
        setLoadError("");
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : "Unable to load dashboard data.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!reportFromDate || !reportToDate) {
      setReportsData({ productionByCategory: [], productStocksByCategory: {} });
      setActiveReportCategory("");
      setStockPage(1);
      setReportsError("");
      setReportsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    if (reportFromDate > reportToDate) {
      setReportsData({ productionByCategory: [], productStocksByCategory: {} });
      setActiveReportCategory("");
      setStockPage(1);
      setReportsError("From Date cannot be greater than To Date.");
      setReportsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setReportsLoading(true);

    void fetchDashboardReports(reportFromDate, reportToDate)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setReportsData(response);
        setReportsError("");
        setStockPage(1);
        setActiveReportCategory((currentCategory) =>
          response.productionByCategory.some((item) => item.productCategory === currentCategory) ? currentCategory : "",
        );
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setReportsData({ productionByCategory: [], productStocksByCategory: {} });
        setActiveReportCategory("");
        setStockPage(1);
        setReportsError(error instanceof Error ? error.message : "Unable to load reports.");
      })
      .finally(() => {
        if (isMounted) {
          setReportsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [reportFromDate, reportToDate]);

  return {
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
  };
}
