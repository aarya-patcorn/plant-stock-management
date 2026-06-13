import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Boxes, Package, ShoppingBag, ShoppingCart, TrendingUp, Truck, Warehouse } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "react-router-dom";
import {
  fetchDashboardReports,
  fetchDispatchEntries,
  fetchInventory,
  fetchManufacturingEntries,
  fetchProductionMaterialLogs,
  fetchPurchaseEntries,
  type DashboardReportCategory,
  type DashboardReportProductStock,
  type DashboardReports,
  type DispatchEntry,
  type ManufacturingEntry,
  type ProductionMaterialLog,
  type PurchaseEntry,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataBadge, DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/input";
import LoadingLoader from "@/components/ui/LoadingLoader";
import { Select } from "@/components/ui/select";

type DashboardData = {
  dispatchEntries: DispatchEntry[];
  inventoryEntries: PurchaseEntry[];
  manufacturingEntries: ManufacturingEntry[];
  productionMaterialLogs: ProductionMaterialLog[];
  purchaseEntries: PurchaseEntry[];
};

type TrendView = "day" | "month" | "year";

function parseNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatCount(value: number) {
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}

function formatKgToMt(value: number) {
  return `${formatCount(value / 1000)} mt`;
}

function normalizeDateValue(value: string) {
  const trimmed = String(value || "").trim();

  if (!trimmed) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const date = new Date(trimmed);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-CA", { timeZone: "UTC" });
}

function isWithinDateRange(value: string, fromDate: string, toDate: string) {
  const normalized = normalizeDateValue(value);

  if (!normalized) {
    return false;
  }

  return normalized >= fromDate && normalized <= toDate;
}

function parseBagSizeToKg(value: string) {
  const text = String(value || "").trim().toLowerCase();

  if (!text) {
    return 0;
  }

  const match = text.match(/(\d+(?:\.\d+)?)/);

  if (!match) {
    return 0;
  }

  const quantity = Number(match[1]);

  if (!Number.isFinite(quantity)) {
    return 0;
  }

  if (text.includes("gm") || text.includes("gram")) {
    return quantity / 1000;
  }

  if (text.includes("mt") || text.includes("ton")) {
    return quantity * 1000;
  }

  return quantity;
}

function resolveProductionKg(entry: ManufacturingEntry) {
  const directQuantity = parseNumber(entry.rawMaterialQty.split(",")[0]);

  if (directQuantity > 0) {
    return directQuantity;
  }

  return entry.productItems.reduce((sum, item) => {
    const totalBagsProduced = parseNumber(item.totalBagsProduced);
    const bagSizeInKg = parseBagSizeToKg(item.bagSize);
    return sum + totalBagsProduced * bagSizeInKg;
  }, 0);
}

function formatTrendAxis(value: number) {
  return `${formatCount(value / 1000)} mt`;
}

function formatTrendLabel(value: string, view: TrendView) {
  if (view === "day") {
    return value;
  }

  if (view === "month") {
    const [year, month] = value.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  }

  return value;
}

function clampPercentage(value: number) {
  return Math.max(0, Math.min(100, value));
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentMonthDateRange() {
  const today = new Date();
  return {
    fromDate: formatDateInput(new Date(today.getFullYear(), today.getMonth(), 1)),
    toDate: formatDateInput(today),
  };
}

function buildInventoryLabel(entry: PurchaseEntry) {
  return [entry.rawMaterialName, entry.packagingType, entry.level2, entry.level3, entry.level4]
    .filter(Boolean)
    .join(" / ");
}

function buildInventoryCategoryPath(entry: PurchaseEntry) {
  return [entry.packagingType, entry.level2, entry.level3, entry.level4].filter(Boolean).join(" / ");
}

function buildProductLabel(entry: ProductionMaterialLog) {
  return [entry.productCategory, entry.productName, entry.productColor].filter(Boolean).join(" / ");
}

function getInventoryStockMetrics(entry: PurchaseEntry) {
  const purchaseStock = parseNumber(entry.purchaseStock || entry.quantityPurchased);
  const currentStock = parseNumber(entry.currentStock);
  const usedInProduction = parseNumber(entry.usedInProduction);
  const percentage = purchaseStock > 0 ? clampPercentage((currentStock / purchaseStock) * 100) : 0;

  return {
    currentStock,
    percentage,
    purchaseStock,
    usedInProduction,
  };
}

function getInventoryStockTone(percentage: number) {
  if (percentage < 20) {
    return {
      badgeVariant: "destructive" as const,
      barClassName: "bg-red-500",
      label: "Low Stock",
      textClassName: "text-red-700",
      trackClassName: "bg-red-50",
    };
  }

  if (percentage <= 50) {
    return {
      badgeVariant: "warning" as const,
      barClassName: "bg-amber-500",
      label: "Medium Stock",
      textClassName: "text-amber-700",
      trackClassName: "bg-amber-50",
    };
  }

  return {
    badgeVariant: "success" as const,
    barClassName: "bg-emerald-500",
    label: "Healthy Stock",
    textClassName: "text-emerald-700",
    trackClassName: "bg-emerald-50",
  };
}

function getProductionStockMetrics(entry: ProductionMaterialLog) {
  const currentStock = parseNumber(entry.currentQuantity);
  const dispatchedBags = parseNumber(entry.shippedQuantity);
  const totalStock = currentStock + dispatchedBags;
  const percentage = totalStock > 0 ? clampPercentage((currentStock / totalStock) * 100) : 0;

  return {
    currentStock,
    dispatchedBags,
    percentage,
  };
}

function getProductionStockTone(percentage: number) {
  if (percentage < 20) {
    return {
      badgeVariant: "destructive" as const,
      barClassName: "bg-red-500",
      label: "Critical",
      textClassName: "text-red-700",
      trackClassName: "bg-red-50",
    };
  }

  if (percentage <= 50) {
    return {
      badgeVariant: "warning" as const,
      barClassName: "bg-amber-500",
      label: "Low Stock",
      textClassName: "text-amber-700",
      trackClassName: "bg-amber-50",
    };
  }

  return {
    badgeVariant: "success" as const,
    barClassName: "bg-emerald-500",
    label: "In Stock",
    textClassName: "text-emerald-700",
    trackClassName: "bg-emerald-50",
  };
}

function StockProgress({
  barClassName,
  percentage,
  quantityLabel,
  textClassName,
  trackClassName,
}: {
  barClassName: string;
  percentage: number;
  quantityLabel: string;
  textClassName: string;
  trackClassName: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className={["h-2 flex-1 overflow-hidden rounded-full", trackClassName].join(" ")}>
          <div
            className={["h-full rounded-full transition-all", barClassName].join(" ")}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={["min-w-[3rem] text-right text-xs font-semibold", textClassName].join(" ")}>
          {formatCount(percentage)}%
        </span>
      </div>
      <p className="text-xs font-medium text-slate-600">{quantityLabel}</p>
    </div>
  );
}

function normalizeLabel(value: string) {
  return value.trim().toLowerCase();
}

function buildInventoryAlertLabel(entry: PurchaseEntry) {
  return [
    entry.rawMaterialName,
    entry.packagingType,
    entry.level2,
    entry.packagingBag,
    entry.level3,
    entry.bucketSize,
  ]
    .filter(Boolean)
    .join(" / ");
}

function getInventoryAlertThreshold(entry: PurchaseEntry) {
  const rawMaterialName = normalizeLabel(entry.rawMaterialName);
  const packagingType = normalizeLabel(entry.packagingType);
  const level2 = normalizeLabel(entry.level2);
  const level3 = normalizeLabel(entry.level3);
  const packagingBag = normalizeLabel(entry.packagingBag);
  const unit = normalizeLabel(entry.unit);

  if (rawMaterialName === "cement") {
    if ((packagingType === "ppc" || packagingType === "opc") && level2 === "silo") {
      return { threshold: 30, thresholdLabel: "30 mt" };
    }

    if (packagingType === "white cement" && level2 === "bag") {
      return { threshold: 5, thresholdLabel: "5 mt" };
    }
  }

  if (rawMaterialName === "sand") {
    if (packagingType === "grey" && level2.includes("600 micron")) {
      return { threshold: 15, thresholdLabel: "15 mt" };
    }

    if (packagingType === "grey" && level2.includes("1200 micron")) {
      return { threshold: 10, thresholdLabel: "10 mt" };
    }

    if (packagingType === "white") {
      return { threshold: 10, thresholdLabel: "10 mt" };
    }
  }

  if (rawMaterialName === "chemical") {
    return { threshold: 30, thresholdLabel: "100 kg" };
  }

  if (rawMaterialName === "packaging") {
    if (unit === "bags") {
      return { threshold: 2000, thresholdLabel: "2000 bags" };
    }

    if (level3 === "coupon") {
      return { threshold: 2000, thresholdLabel: "2000 pcs" };
    }

    if (level2 === "tile grout" && level3.includes("pouch")) {
      return { threshold: 2000, thresholdLabel: "2000 nos" };
    }

    if (level2 === "epoxy" && level3.includes("bucket")) {
      return { threshold: 500, thresholdLabel: "500 bucket" };
    }
  }

  if (packagingBag && packagingBag.includes("coupon")) {
    return { threshold: 2000, thresholdLabel: "200 pcs" };
  }

  return null;
}

function getTodayKey() {
  return new Date().toLocaleDateString("en-CA");
}

function SnapshotWidget({
  caption,
  icon: Icon,
  statusClassName,
  statusLabel,
  title,
  trendLabel,
  value,
}: {
  caption: string;
  icon: typeof Boxes;
  statusClassName: string;
  statusLabel: string;
  title: string;
  trendLabel?: string;
  value: React.ReactNode;
}) {
  return (
    <Card className="border border-slate-200/80 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-700">
            <Icon className="size-4.5" />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {trendLabel ? (
              <Badge className="border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-50" variant="outline">
                {trendLabel}
              </Badge>
            ) : null}
            <Badge className={statusClassName} variant="outline">
              {statusLabel}
            </Badge>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{caption}</p>
          <p className="text-2xl font-bold tracking-tight text-slate-950">{value}</p>
          <p className="text-sm font-medium text-slate-800">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InventoryAlertGaugeCard({
  label,
  threshold,
  thresholdLabel,
  unitLabel,
  value,
}: {
  label: string;
  threshold: number;
  thresholdLabel: string;
  unitLabel: string;
  value: number;
}) {
  const percentage = threshold > 0 ? clampPercentage((value / threshold) * 100) : 0;
  const tone =
    percentage <= 20
      ? {
          badgeClassName: "border-red-200 bg-red-50 text-red-700 hover:bg-red-50",
          progressClassName: "stroke-red-500",
          trackClassName: "stroke-red-100",
        }
      : percentage <= 50
        ? {
            badgeClassName: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50",
            progressClassName: "stroke-amber-500",
            trackClassName: "stroke-amber-100",
          }
        : {
            badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
            progressClassName: "stroke-emerald-500",
            trackClassName: "stroke-emerald-100",
          };
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="overflow-hidden border border-slate-200 bg-white/95 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950" title={label}>
              {label}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">Threshold alert</p>
          </div>
          <Badge className={tone.badgeClassName} variant="outline">
            {unitLabel}
          </Badge>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
            <svg className="-rotate-90" height="96" width="96" viewBox="0 0 96 96">
              <circle
                className={tone.trackClassName}
                cx="48"
                cy="48"
                fill="none"
                r={radius}
                strokeWidth="8"
              />
              <circle
                className={[tone.progressClassName, "transition-all duration-300 ease-out"].join(" ")}
                cx="48"
                cy="48"
                fill="none"
                r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                strokeWidth="8"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-slate-950">{formatCount(percentage)}%</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Stock</span>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Current / Threshold</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                {formatCount(value)} / {thresholdLabel}
              </p>
            </div>
            <p className="text-xs text-slate-500">
              Current stock is at {formatCount(percentage)}% of the configured threshold.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UnifiedActivityFeed({
  activities,
  href,
}: {
  activities: Array<{
    id: string;
    itemName: string;
    meta: string;
    quantity: string;
    secondaryBadge: string;
    secondaryLabel: string;
    secondaryInfo: string;
    type: "Purchase" | "Production" | "Dispatch";
  }>;
  href: string;
}) {
  const activityAppearance = {
    Dispatch: {
      accentClassName: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50",
      icon: Truck,
      iconClassName: "border-amber-200 bg-amber-100 text-amber-700",
      rowClassName: "bg-amber-50/35",
    },
    Production: {
      accentClassName: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
      icon: Package,
      iconClassName: "border-emerald-200 bg-emerald-100 text-emerald-700",
      rowClassName: "bg-emerald-50/35",
    },
    Purchase: {
      accentClassName: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50",
      icon: ShoppingCart,
      iconClassName: "border-sky-200 bg-sky-100 text-sky-700",
      rowClassName: "bg-sky-50/35",
    },
  } as const;

  return (
    <Card className="border-white/70 bg-white/85 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <CardTitle>Unified Activity Feed</CardTitle>
          <CardDescription>Latest purchase, production, and dispatch activity in one compact timeline.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {activities.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Recent activity will appear here once available.
          </div>
        ) : (
          activities.map((activity, index) => {
            const appearance = activityAppearance[activity.type];
            const Icon = appearance.icon;

            return (
              <div
                className={[
                  "rounded-xl border border-slate-200 px-3 py-3 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm",
                  index % 2 === 0 ? "bg-white" : appearance.rowClassName,
                ].join(" ")}
                key={activity.id}
              >
                <div className="flex items-start gap-3">
                  <div className={["mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border", appearance.iconClassName].join(" ")}>
                    <Icon className="size-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={appearance.accentClassName} variant="outline">
                            <Icon className="mr-1 size-3.5" />
                            {activity.type}
                          </Badge>
                          <p className="truncate text-sm font-semibold text-foreground" title={activity.itemName}>
                            {activity.itemName}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge className="border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-50" variant="outline">
                            {activity.secondaryLabel}
                          </Badge>
                          <Badge className="border-slate-200 bg-white text-slate-700 hover:bg-white" variant="outline">
                            {activity.secondaryBadge}
                          </Badge>
                          {activity.type === "Production" ? (
                            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50" variant="outline">
                              Plant Stock
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Date</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{activity.meta || "-"}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-base font-bold tracking-tight text-slate-950">{activity.quantity}</p>
                      <p className="truncate text-xs text-slate-500" title={activity.secondaryInfo}>
                        {activity.secondaryInfo}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const STOCK_PAGE_SIZE = 5;
  const ITEMS_PER_PAGE = 6;
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
  const [reportsData, setReportsData] = useState<DashboardReports>({
    productionByCategory: [],
    productStocksByCategory: {},
  });
  const [activeReportCategory, setActiveReportCategory] = useState("");
  const [stockPage, setStockPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [trendView, setTrendView] = useState<TrendView>("day");
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

  const dashboardStats = useMemo(() => {
    const todayKey = getTodayKey();
    const todaysManufacturedItems = data.manufacturingEntries.filter(
      (entry) => entry.productionDate === todayKey,
    ).length;
    const todaysDispatchBags = data.dispatchEntries
      .filter((entry) => entry.date === todayKey)
      .reduce((sum, entry) => sum + parseNumber(entry.totalBags), 0);

    return {
      todaysDispatchBags,
      todaysManufacturedItems,
    };
  }, [data.dispatchEntries, data.manufacturingEntries]);

  const sortedInventoryEntries = useMemo(
    () =>
      [...data.inventoryEntries].sort((left, right) =>
        `${right.date} ${right.time}`.localeCompare(`${left.date} ${left.time}`),
      ),
    [data.inventoryEntries],
  );

  const sortedProductionLogs = useMemo(
    () =>
      [...data.productionMaterialLogs].sort((left, right) =>
        `${right.token} ${right.bagSize}`.localeCompare(`${left.token} ${left.bagSize}`),
      ),
    [data.productionMaterialLogs],
  );

  const unifiedActivities = useMemo(
    () =>
      [
        ...data.purchaseEntries.map((entry) => ({
          id: `purchase-${entry.id}`,
          itemName: buildInventoryLabel(entry) || "Purchase entry",
          meta: entry.date || "-",
          quantity: [entry.quantityPurchased || entry.purchaseStock, entry.unit].filter(Boolean).join(" ") || "-",
          secondaryBadge: entry.supplierName || "-",
          secondaryLabel: "Supplier",
          secondaryInfo: `Supplier: ${entry.supplierName || "-"}`,
          sortKey: `${entry.date} ${entry.time}`,
          type: "Purchase" as const,
        })),
        ...data.manufacturingEntries.map((entry) => ({
          id: `production-${entry.id}`,
          itemName:
            [entry.productCategory, entry.finishedProductName, entry.color].filter(Boolean).join(" / ") ||
            "Production entry",
          meta: entry.productionDate || "-",
          quantity: [entry.totalBagsProduced, "bags", entry.bagSize].filter(Boolean).join(" ") || "-",
          secondaryBadge: entry.batchNo || "-",
          secondaryLabel: "Batch No.",
          secondaryInfo: `Batch No: ${entry.batchNo || "-"}`,
          sortKey: `${entry.productionDate} ${entry.batchNo}`,
          type: "Production" as const,
        })),
        ...data.dispatchEntries.map((entry) => ({
          id: `dispatch-${entry.id}`,
          itemName:
            [entry.productCategory, entry.productName, entry.productColor].filter(Boolean).join(" / ") ||
            "Dispatch entry",
          meta: entry.date || "-",
          quantity: [entry.totalBags, "bags"].filter(Boolean).join(" ") || "-",
          secondaryBadge: entry.dispatchSite || "-",
          secondaryLabel: "Warehouse",
          secondaryInfo: `Warehouse: ${entry.dispatchSite || "-"}`,
          sortKey: `${entry.date} ${entry.time}`,
          type: "Dispatch" as const,
        })),
      ]
        .sort((left, right) => right.sortKey.localeCompare(left.sortKey))
        .slice(0, 5),
    [data.dispatchEntries, data.manufacturingEntries, data.purchaseEntries],
  );

  const lowStockAlerts = useMemo(
    () =>
      sortedInventoryEntries
        .filter((entry) => {
          const thresholdRule = getInventoryAlertThreshold(entry);

          if (!thresholdRule) {
            return false;
          }

          return parseNumber(entry.currentStock) <= thresholdRule.threshold;
        })
        .map((entry) => {
          const thresholdRule = getInventoryAlertThreshold(entry);
          const currentStock = parseNumber(entry.currentStock);

          return {
            id: entry.id,
            label: buildInventoryAlertLabel(entry) || "Inventory item",
            threshold: thresholdRule?.threshold || 0,
            thresholdLabel: thresholdRule?.thresholdLabel || "",
            unitLabel: entry.unit || "unit",
            value: currentStock,
          };
        }),
    [sortedInventoryEntries],
  );

  const operationsSnapshot = useMemo(() => {
    const totalInventory = data.inventoryEntries.length;
    const rawMaterialStock = data.inventoryEntries.reduce((sum, entry) => sum + parseNumber(entry.currentStock), 0) / 1000;
    const finishedGoods = data.productionMaterialLogs.reduce((sum, entry) => sum + parseNumber(entry.currentQuantity), 0) / 1000;
    const totalFinishedGoodsDispatched = data.productionMaterialLogs.reduce(
      (sum, entry) => sum + parseNumber(entry.shippedQuantity),
      0,
    );
    const lowStockCount = lowStockAlerts.length;
    const lowStockRate = totalInventory > 0 ? lowStockCount / totalInventory : 0;
    const finishedGoodsAvailability = finishedGoods + totalFinishedGoodsDispatched > 0
      ? finishedGoods / (finishedGoods + totalFinishedGoodsDispatched)
      : 0;

    const resolveStatusTone = (status: "healthy" | "warning" | "critical") =>
      status === "healthy"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
        : status === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50"
          : "border-red-200 bg-red-50 text-red-700 hover:bg-red-50";

    const inventoryStatus = lowStockCount === 0 ? "healthy" : lowStockRate > 0.12 ? "critical" : "warning";
    const rawMaterialStatus = lowStockCount <= 2 ? "healthy" : lowStockCount <= 5 ? "warning" : "critical";
    const finishedGoodsStatus = finishedGoodsAvailability > 0.55 ? "healthy" : finishedGoodsAvailability > 0.3 ? "warning" : "critical";
    const productionStatus = dashboardStats.todaysManufacturedItems > 0 ? "healthy" : "warning";
    const dispatchStatus = dashboardStats.todaysDispatchBags > 0 ? "healthy" : "warning";
    const lowStockStatus = lowStockCount === 0 ? "healthy" : lowStockCount <= 5 ? "warning" : "critical";

    return [
      {
        caption: "Stock on Hand",
        icon: ShoppingBag,
        statusClassName: resolveStatusTone(rawMaterialStatus),
        statusLabel: rawMaterialStatus === "healthy" ? "Healthy" : rawMaterialStatus === "warning" ? "Warning" : "Critical",
        title: "Raw Material Stock",
        trendLabel: `${formatCount(data.purchaseEntries.length)} items`,
        value: `${formatCount(rawMaterialStock)} mt`,
      },
      {
        caption: "Warehouse",
        icon: Boxes,
        statusClassName: resolveStatusTone(finishedGoodsStatus),
        statusLabel: finishedGoodsStatus === "healthy" ? "Healthy" : finishedGoodsStatus === "warning" ? "Warning" : "Critical",
        title: "Finished Goods",
        trendLabel: `${formatCount(totalFinishedGoodsDispatched)} dispatched`,
        value: `${formatCount(finishedGoods)} mt`,
      },
      {
        caption: "Production Today",
        icon: Package,
        statusClassName: resolveStatusTone(productionStatus),
        statusLabel: productionStatus === "healthy" ? "Healthy" : "Warning",
        title: "Today's Production",
        trendLabel: "Live today",
        value: formatCount(dashboardStats.todaysManufacturedItems),
      },
      {
        caption: "Dispatch Today",
        icon: Truck,
        statusClassName: resolveStatusTone(dispatchStatus),
        statusLabel: dispatchStatus === "healthy" ? "Healthy" : "Warning",
        title: "Today's Dispatch",
        trendLabel: "Outbound today",
        value: formatCount(dashboardStats.todaysDispatchBags),
      },
    ] as const;
  }, [
    dashboardStats.todaysDispatchBags,
    dashboardStats.todaysManufacturedItems,
    data.inventoryEntries.length,
    data.productionMaterialLogs,
    data.purchaseEntries,
    lowStockAlerts.length,
  ]);

  const totalPages = Math.ceil(lowStockAlerts.length / ITEMS_PER_PAGE);
  const paginatedAlerts = lowStockAlerts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

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

  const activeCategoryProductStocks = useMemo<DashboardReportProductStock[]>(() => {
    const categoryStocks = activeReportCategory
      ? reportsData.productStocksByCategory[activeReportCategory] || []
      : Object.values(reportsData.productStocksByCategory).flat();

    return [...categoryStocks].sort(
      (left, right) => parseNumber(right.currentQuantity) - parseNumber(left.currentQuantity),
    );
  }, [activeReportCategory, reportsData.productStocksByCategory]);

  const totalStockPages = useMemo(
    () => Math.max(1, Math.ceil(activeCategoryProductStocks.length / STOCK_PAGE_SIZE)),
    [STOCK_PAGE_SIZE, activeCategoryProductStocks.length],
  );

  const paginatedStocks = useMemo(
    () =>
      activeCategoryProductStocks.slice(
        (stockPage - 1) * STOCK_PAGE_SIZE,
        stockPage * STOCK_PAGE_SIZE,
      ),
    [STOCK_PAGE_SIZE, activeCategoryProductStocks, stockPage],
  );

  const productionTrendData = useMemo(() => {
    const grouped = new Map<string, { label: string; totalProductionKg: number }>();

    data.manufacturingEntries
      .filter((entry) => {
        const matchesCategory = !activeReportCategory || entry.productCategory === activeReportCategory;
        return matchesCategory && isWithinDateRange(entry.productionDate, reportFromDate, reportToDate);
      })
      .forEach((entry) => {
        const normalizedDate = normalizeDateValue(entry.productionDate);

        if (!normalizedDate) {
          return;
        }

        const key = trendView === "day"
          ? normalizedDate
          : trendView === "month"
            ? normalizedDate.slice(0, 7)
            : normalizedDate.slice(0, 4);
        const current = grouped.get(key) || {
          label: formatTrendLabel(key, trendView),
          totalProductionKg: 0,
        };

        current.totalProductionKg += resolveProductionKg(entry);
        grouped.set(key, current);
      });

    return Array.from(grouped.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => ({
        key,
        label: value.label,
        totalProductionKg: value.totalProductionKg,
      }));
  }, [activeReportCategory, data.manufacturingEntries, reportFromDate, reportToDate, trendView]);

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

  const reportStockColumns = useMemo<ColumnDef<DashboardReportProductStock>[]>(
    () => [
      {
        accessorKey: "productName",
        header: "Product Name",
        cell: ({ row }) => (
          <span className="block max-w-[220px] truncate font-medium text-slate-900" title={row.original.productName || "-"}>
            {row.original.productName || "-"}
          </span>
        ),
      },
      {
        accessorKey: "color",
        header: "Color",
        cell: ({ row }) =>
          row.original.color ? <DataBadge type="color">{row.original.color}</DataBadge> : "-",
      },
      {
        accessorKey: "token",
        header: "Token",
        cell: ({ row }) =>
          row.original.token ? <DataBadge type="token">{row.original.token}</DataBadge> : "-",
      },
      {
        accessorKey: "bagSize",
        header: "Bag Size",
        cell: ({ row }) => row.original.bagSize || "-",
      },
      {
        accessorKey: "totalBagsProduced",
        header: "Total Stock",
        cell: ({ row }) => (
          <span className="block text-right">{formatCount(parseNumber(row.original.currentQuantity + row.original.dispatchedBags))}</span>
        ),
      },
      {
        accessorKey: "currentQuantity",
        header: "Current Stock",
        cell: ({ row }) => (
          <span className="block text-right">{formatCount(parseNumber(row.original.currentQuantity))}</span>
        ),
      },
      {
        accessorKey: "dispatchedBags",
        header: "Dispatched Bags",
        cell: ({ row }) => (
          <span className="block text-right">{formatCount(parseNumber(row.original.dispatchedBags))}</span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200/80 bg-white/92 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <CardHeader className="gap-3 border-b border-slate-200/80 pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Operations Snapshot</p>
              <CardTitle className="mt-1 text-2xl text-slate-950">Inventory control </CardTitle>
              <CardDescription className="mt-1 max-w-3xl text-sm text-slate-600">
                Compact operational KPIs for stock, production, dispatch, and shortage monitoring.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-50" variant="outline">
                {isLoading ? "Refreshing..." : `${formatCount(data.dispatchEntries.length)} dispatch records`}
              </Badge>
              <Badge className="border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-50" variant="outline">
                {isLoading ? "Refreshing..." : `${formatCount(data.productionMaterialLogs.length)} production logs`}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {operationsSnapshot.map((item) => (
              <SnapshotWidget
                caption={item.caption}
                icon={item.icon}
                key={item.title}
                statusClassName={item.statusClassName}
                statusLabel={item.statusLabel}
                title={item.title}
                trendLabel={item.trendLabel}
                value={isLoading ? <LoadingLoader /> : item.value}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {loadError ? (
        <div className="rounded-lg border border-dashed border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}

      <Card className="border-white/70 bg-white/85 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle>Inventory Alerts</CardTitle>
            <CardDescription>
              Low-stock inventory items based on operational minimum stock thresholds.
            </CardDescription>
          </div>
          <Badge variant="outline">{isLoading ? "Loading..." : `${lowStockAlerts.length} alerts`}</Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center rounded-md border border-dashed p-6">
              <LoadingLoader />
            </div>
          ) : lowStockAlerts.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No low-stock inventory alerts right now.
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {paginatedAlerts.map((alert) => (
                  <InventoryAlertGaugeCard
                    key={alert.id}
                    label={alert.label}
                    threshold={alert.threshold}
                    thresholdLabel={alert.thresholdLabel}
                    unitLabel={alert.unitLabel}
                    value={alert.value}
                  />
                ))}
              </div>

              {totalPages > 1 ? (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <Button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((page) => page - 1)}
                  >
                    Previous
                  </Button>

                  <span>
                    Page {currentPage} of {totalPages || 1}
                  </span>

                  <Button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((page) => page + 1)}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)] xl:items-start">
        <Card className="border-white/70 bg-white/85 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Reports</CardTitle>
                <CardDescription>Category-wise production and product stock reports.</CardDescription>
              </div>
              <Badge variant="outline">
                {reportsLoading ? "Loading..." : `${reportsData.productionByCategory.length} categories`}
              </Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-3 xl:max-w-4xl">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="report-from-date">
                  From Date
                </label>
                <Input
                  id="report-from-date"
                  max={reportToDate || undefined}
                  onChange={(event) => setReportFromDate(event.target.value)}
                  type="date"
                  value={reportFromDate}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="report-to-date">
                  To Date
                </label>
                <Input
                  id="report-to-date"
                  min={reportFromDate || undefined}
                  onChange={(event) => setReportToDate(event.target.value)}
                  type="date"
                  value={reportToDate}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="report-category">
                  Product Category
                </label>
                <Select
                  id="report-category"
                  onChange={(event) => {
                    setActiveReportCategory(event.target.value);
                    setStockPage(1);
                  }}
                  value={activeReportCategory}
                >
                  <option value="">All</option>
                  {reportCategoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {reportsLoading ? (
              <div className="flex justify-center rounded-md border border-dashed p-6">
                <LoadingLoader />
              </div>
            ) : reportsError ? (
              <div className="rounded-md border border-dashed border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                {reportsError}
              </div>
            ) : reportsData.productionByCategory.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                No production report found for selected date range.
              </div>
            ) : (
              <>
                <div className="rounded-2xl border bg-background/70 p-4 sm:p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {activeReportCategory ? `${activeReportCategory} Product Stock Details` : "All Categories Product Stock Details"}
                      </h3>
                      <p className="text-sm text-muted-foreground">Sorted by highest current stock first.</p>
                    </div>
                    {activeReportCategory && activeReportSummary ? (
                      <Badge variant="outline">{formatCount(activeReportSummary.productsCount)} products</Badge>
                    ) : (
                      <Badge variant="outline">{formatCount(activeCategoryProductStocks.length)} products</Badge>
                    )}
                  </div>

                  {activeCategoryProductStocks.length === 0 ? (
                    <div className="mt-4 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                      No product stock found for this category.
                    </div>
                  ) : (
                    <div className="mt-4">
                      <DataTable
                        columns={reportStockColumns}
                        data={paginatedStocks}
                        emptyMessage="No product stock found for this category."
                      />
                    </div>
                  )}

                  {activeCategoryProductStocks.length > 0 ? (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        disabled={stockPage === 1}
                        onClick={() => setStockPage((page) => Math.max(1, page - 1))}
                        type="button"
                        variant="outline"
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {stockPage} of {totalStockPages}
                      </span>
                      <Button
                        disabled={stockPage === totalStockPages}
                        onClick={() => setStockPage((page) => Math.min(totalStockPages, page + 1))}
                        type="button"
                        variant="outline"
                      >
                        Next
                      </Button>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/90 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <CardHeader className="gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Production Trend</CardTitle>
                <CardDescription>
                  {activeReportCategory
                    ? `${activeReportCategory} production trend for the selected date range.`
                    : "Production trend for the selected date range."}
                </CardDescription>
              </div>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                {(["day", "month", "year"] as TrendView[]).map((view) => (
                  <button
                    className={[
                      "rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition",
                      trendView === view ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900",
                    ].join(" ")}
                    key={view}
                    onClick={() => setTrendView(view)}
                    type="button"
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Peak {trendView}
                </p>
                <p className="mt-1 text-base font-semibold text-slate-950">
                  {peakProductionPoint ? peakProductionPoint.label : "No data"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Peak Production
                </p>
                <p className="mt-1 text-base font-semibold text-slate-950">
                  {peakProductionPoint ? formatKgToMt(peakProductionPoint.totalProductionKg) : "0 mt"}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {productionTrendData.length === 0 ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                No production trend available for the selected date range.
              </div>
            ) : (
              <div className="h-[320px] w-full">
                <ResponsiveContainer height="100%" width="100%">
                  <LineChart data={productionTrendData} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      axisLine={false}
                      dataKey="label"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis
                      axisLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      tickFormatter={formatTrendAxis}
                      tickLine={false}
                      width={74}
                    />
                    <Tooltip
                      contentStyle={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        boxShadow: "0 12px 28px rgba(15,23,42,0.08)",
                      }}
                      formatter={(value) => [formatKgToMt(Number(value) || 0), "Production"]}
                      labelFormatter={(label) => `${trendView.charAt(0).toUpperCase() + trendView.slice(1)}: ${label}`}
                    />
                    <Line
                      activeDot={{ r: 6, stroke: "#0f766e", strokeWidth: 2 }}
                      dataKey="totalProductionKg"
                      dot={(props) => {
                        const { cx, cy, payload } = props;

                        if (typeof cx !== "number" || typeof cy !== "number") {
                          return null;
                        }

                        const isPeak = payload.key === peakProductionPoint?.key;

                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            fill={isPeak ? "#f59e0b" : "#14b8a6"}
                            r={isPeak ? 5 : 3}
                            stroke={isPeak ? "#b45309" : "#0f766e"}
                            strokeWidth={isPeak ? 2 : 1.5}
                          />
                        );
                      }}
                      name="Production"
                      stroke="#0f766e"
                      strokeWidth={3}
                      type="monotone"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.15fr)]">
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle>Inventory List</CardTitle>
              <CardDescription>Top 3 recent inventory entries in a compact stock overview.</CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/inventory-entries">
                View entries
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center rounded-md border border-dashed p-6">
                <LoadingLoader />
              </div>
            ) : sortedInventoryEntries.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No inventory entries found yet.</div>
            ) : (
              <div className="grid gap-3">
                {sortedInventoryEntries.slice(0, 3).map((entry) => {
                  const { currentStock, percentage, purchaseStock, usedInProduction } = getInventoryStockMetrics(entry);
                  const stockTone = getInventoryStockTone(percentage);
                  const categoryPath = buildInventoryCategoryPath(entry) || "Category path not available";

                  return (
                    <div
                      className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                      key={entry.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
                              {percentage < 20 ? <AlertTriangle className="size-3.5" /> : <TrendingUp className="size-3.5" />}
                            </span>
                            <p
                              className="truncate text-sm font-semibold text-slate-900"
                              title={buildInventoryLabel(entry) || "Inventory item"}
                            >
                              {entry.rawMaterialName || "Inventory item"}
                            </p>
                          </div>
                          <p className="mt-1 truncate text-xs text-slate-500" title={categoryPath}>
                            {categoryPath}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant={stockTone.badgeVariant}>{stockTone.label}</Badge>
                          <Badge className="bg-slate-50 text-slate-700" variant="outline">
                            {entry.unit || "Unit N/A"}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-3">
                        <StockProgress
                          barClassName={stockTone.barClassName}
                          percentage={percentage}
                          quantityLabel={`${formatCount(currentStock)} ${entry.unit || ""}`.trim()}
                          textClassName={stockTone.textClassName}
                          trackClassName={stockTone.trackClassName}
                        />
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Purchase</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{formatCount(purchaseStock)}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Current</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{formatCount(currentStock)}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Used</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{formatCount(usedInProduction)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle>Production Material Logs</CardTitle>
              <CardDescription>Top 3 recent finished-product logs in compact inventory format.</CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/production-material-logs">
                View logs
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center rounded-md border border-dashed p-6">
                <LoadingLoader />
              </div>
            ) : sortedProductionLogs.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No production logs found yet.</div>
            ) : (
              <div className="grid gap-3">
                {sortedProductionLogs.slice(0, 3).map((entry) => {
                  const { currentStock, dispatchedBags, percentage } = getProductionStockMetrics(entry);
                  const stockTone = getProductionStockTone(percentage);

                  return (
                    <div
                      className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                      key={entry.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
                              {percentage < 20 ? <AlertTriangle className="size-3.5" /> : <Package className="size-3.5" />}
                            </span>
                            <p
                              className="truncate text-sm font-semibold text-slate-900"
                              title={entry.productName || "Production log"}
                            >
                              {entry.productName || "Production log"}
                            </p>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>{entry.productColor || "Color N/A"}</span>
                            <span className="text-slate-300">•</span>
                            <span>{entry.token || "Token N/A"}</span>
                            <span className="text-slate-300">•</span>
                            <span>{entry.bagSize || "Bag size N/A"}</span>
                          </div>
                        </div>
                        <Badge variant={stockTone.badgeVariant}>{stockTone.label}</Badge>
                      </div>

                      <div className="mt-3">
                        <StockProgress
                          barClassName={stockTone.barClassName}
                          percentage={percentage}
                          quantityLabel={`${formatCount(currentStock)} bags available`}
                          textClassName={stockTone.textClassName}
                          trackClassName={stockTone.trackClassName}
                        />
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Current Stock</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{formatCount(currentStock)}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Available Bags</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{formatCount(currentStock)}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Dispatched</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{formatCount(dispatchedBags)}</p>
                        </div>
                      </div>

                      {entry.remarks ? <p className="mt-2 truncate text-xs text-slate-500">{entry.remarks}</p> : null}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <UnifiedActivityFeed activities={unifiedActivities} href="/reports" />
  </div>
  );
}
