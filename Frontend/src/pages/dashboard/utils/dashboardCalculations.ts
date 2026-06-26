import { AlertTriangle, Boxes, Package, ShoppingBag, Truck, Warehouse } from "lucide-react";
import type { DispatchEntry, ManufacturingEntry, ProductionMaterialLog, PurchaseEntry } from "@/lib/api";
import type {
  DashboardStats,
  InventoryAlert,
  OperationSnapshotItem,
  TrendView,
  UnifiedActivity,
} from "@/pages/dashboard/types";
import { getTodayKey, isWithinDateRange, normalizeLabel, normalizeDateValue } from "@/pages/dashboard/utils/dashboardFilters";
import {
  buildInventoryAlertLabel,
  buildInventoryLabel,
  formatCount,
  formatTrendLabel,
} from "@/pages/dashboard/utils/dashboardFormatters";

export function parseNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function parseBagSizeToKg(value: string) {
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

export function resolveProductionKg(entry: ManufacturingEntry) {
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

export function clampPercentage(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthDateRange() {
  const today = new Date();
  return {
    fromDate: formatDateInput(new Date(today.getFullYear(), today.getMonth(), 1)),
    toDate: formatDateInput(today),
  };
}

export function getInventoryStockMetrics(entry: PurchaseEntry) {
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

export function getInventoryStockTone(percentage: number) {
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

export function getProductionStockMetrics(entry: ProductionMaterialLog) {
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

export function getProductionStockTone(percentage: number) {
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

export function getInventoryAlertThreshold(entry: PurchaseEntry) {
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
      return { threshold: 30, thresholdLabel: "30 mt" };
    }
  }

  if (rawMaterialName === "sand") {
    if (packagingType === "grey" && level2.includes("600 micron")) {
      return { threshold: 30, thresholdLabel: "30 mt" };
    }

    if (packagingType === "grey" && level2.includes("1200 micron")) {
      return { threshold: 30, thresholdLabel: "30 mt" };
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
      return { threshold: 3000, thresholdLabel: "3000 bags" };
    }

    if (level3 === "coupon") {
      return { threshold: 3000, thresholdLabel: "3000 pcs" };
    }

    if (level2 === "tile grout" && level3.includes("pouch")) {
      return { threshold: 2000, thresholdLabel: "2000 nos" };
    }

    if (level2 === "epoxy" && level3.includes("bucket")) {
      return { threshold: 500, thresholdLabel: "500 bucket" };
    }
  }

  if (packagingBag && packagingBag.includes("coupon")) {
    return { threshold: 3000, thresholdLabel: "3000 pcs" };
  }

  return null;
}

export function calculateDashboardStats(
  manufacturingEntries: ManufacturingEntry[],
  dispatchEntries: DispatchEntry[],
): DashboardStats {
  const todayKey = getTodayKey();
  const todaysManufacturedItems = manufacturingEntries.filter((entry) => entry.productionDate === todayKey).length;
  const todaysDispatchBags = dispatchEntries
    .filter((entry) => entry.date === todayKey)
    .reduce((sum, entry) => sum + parseNumber(entry.totalBags), 0);

  return {
    todaysDispatchBags,
    todaysManufacturedItems,
  };
}

export function sortInventoryEntries(entries: PurchaseEntry[]) {
  return [...entries].sort((left, right) => `${right.date} ${right.time}`.localeCompare(`${left.date} ${left.time}`));
}

export function sortProductionLogs(entries: ProductionMaterialLog[]) {
  return [...entries].sort((left, right) => `${right.token} ${right.bagSize}`.localeCompare(`${left.token} ${left.bagSize}`));
}

export function buildUnifiedActivities(
  purchaseEntries: PurchaseEntry[],
  manufacturingEntries: ManufacturingEntry[],
  dispatchEntries: DispatchEntry[],
): UnifiedActivity[] {
  return [
    ...purchaseEntries.map((entry) => ({
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
    ...manufacturingEntries.map((entry) => ({
      id: `production-${entry.id}`,
      itemName:
        [entry.productCategory, entry.finishedProductName, entry.color].filter(Boolean).join(" / ") || "Production entry",
      meta: entry.productionDate || "-",
      quantity: [entry.totalBagsProduced, "bags", entry.bagSize].filter(Boolean).join(" ") || "-",
      secondaryBadge: entry.batchNo || "-",
      secondaryLabel: "Batch No.",
      secondaryInfo: `Batch No: ${entry.batchNo || "-"}`,
      sortKey: `${entry.productionDate} ${entry.batchNo}`,
      type: "Production" as const,
    })),
    ...dispatchEntries.map((entry) => ({
      id: `dispatch-${entry.id}`,
      itemName: [entry.productCategory, entry.productName, entry.productColor].filter(Boolean).join(" / ") || "Dispatch entry",
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
    .slice(0, 5);
}

export function buildLowStockAlerts(entries: PurchaseEntry[]): InventoryAlert[] {
  return entries
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
    });
}

export function buildOperationsSnapshot(params: {
  dashboardStats: DashboardStats;
  inventoryEntries: PurchaseEntry[];
  lowStockCount: number;
  productionMaterialLogs: ProductionMaterialLog[];
  purchaseEntries: PurchaseEntry[];
}): OperationSnapshotItem[] {
  const { dashboardStats, inventoryEntries, lowStockCount, productionMaterialLogs, purchaseEntries } = params;
  const totalInventory = inventoryEntries.length;
  const rawMaterialStock = inventoryEntries.reduce((sum, entry) => sum + parseNumber(entry.currentStock), 0) / 1000;
  const finishedGoods = productionMaterialLogs.reduce((sum, entry) => sum + parseNumber(entry.currentQuantity), 0) / 1000;
  const totalFinishedGoodsDispatched = productionMaterialLogs.reduce(
    (sum, entry) => sum + parseNumber(entry.shippedQuantity),
    0,
  );
  const lowStockRate = totalInventory > 0 ? lowStockCount / totalInventory : 0;
  const finishedGoodsAvailability =
    finishedGoods + totalFinishedGoodsDispatched > 0
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
  const finishedGoodsStatus =
    finishedGoodsAvailability > 0.55 ? "healthy" : finishedGoodsAvailability > 0.3 ? "warning" : "critical";
  const productionStatus = dashboardStats.todaysManufacturedItems > 0 ? "healthy" : "warning";
  const dispatchStatus = dashboardStats.todaysDispatchBags > 0 ? "healthy" : "warning";
  const lowStockStatus = lowStockCount === 0 ? "healthy" : lowStockCount <= 5 ? "warning" : "critical";

  return [
    {
      caption: "Stock on Hand",
      description: "Current raw material stock available for plant operations.",
      icon: ShoppingBag,
      statusClassName: resolveStatusTone(rawMaterialStatus),
      statusLabel: rawMaterialStatus === "healthy" ? "Healthy" : rawMaterialStatus === "warning" ? "Warning" : "Critical",
      title: "Raw Material Stock",
      trendLabel: `${formatCount(purchaseEntries.length)} items`,
    },
    {
      caption: "Warehouse",
      description: "Available finished goods from production material logs.",
      icon: Boxes,
      statusClassName: resolveStatusTone(finishedGoodsStatus),
      statusLabel:
        finishedGoodsStatus === "healthy" ? "Healthy" : finishedGoodsStatus === "warning" ? "Warning" : "Critical",
      title: "Finished Goods",
      trendLabel: `${formatCount(totalFinishedGoodsDispatched)} dispatched`,
    },
    {
      caption: "Production Today",
      description: "Manufacturing entries created for the current day.",
      icon: Package,
      statusClassName: resolveStatusTone(productionStatus),
      statusLabel: productionStatus === "healthy" ? "Healthy" : "Warning",
      title: "Today's Production",
      trendLabel: "Live today",
    },
    {
      caption: "Dispatch Today",
      description: "Dispatch bags recorded today from outgoing shipments.",
      icon: Truck,
      statusClassName: resolveStatusTone(dispatchStatus),
      statusLabel: dispatchStatus === "healthy" ? "Healthy" : "Warning",
      title: "Today's Dispatch",
      trendLabel: "Outbound today",
    },
  ].map((item) => ({
    ...item,
    value:
      item.caption === "Inventory"
        ? formatCount(totalInventory)
        : item.caption === "Stock on Hand"
          ? `${formatCount(rawMaterialStock)} mt`
          : item.caption === "Warehouse"
            ? `${formatCount(finishedGoods)} mt`
            : item.caption === "Production Today"
              ? formatCount(dashboardStats.todaysManufacturedItems)
              : item.caption === "Dispatch Today"
                ? formatCount(dashboardStats.todaysDispatchBags)
                : formatCount(lowStockCount),
  }));
}

export function buildProductionTrendData(params: {
  activeReportCategory: string;
  manufacturingEntries: ManufacturingEntry[];
  reportFromDate: string;
  reportToDate: string;
  trendView: TrendView;
}) {
  const { activeReportCategory, manufacturingEntries, reportFromDate, reportToDate, trendView } = params;
  const grouped = new Map<string, { label: string; totalProductionKg: number }>();

  manufacturingEntries
    .filter((entry) => {
      const matchesCategory = !activeReportCategory || entry.productCategory === activeReportCategory;
      return matchesCategory && isWithinDateRange(entry.productionDate, reportFromDate, reportToDate);
    })
    .forEach((entry) => {
      const normalizedDate = normalizeDateValue(entry.productionDate);

      if (!normalizedDate) {
        return;
      }

      const key =
        trendView === "day" ? normalizedDate : trendView === "month" ? normalizedDate.slice(0, 7) : normalizedDate.slice(0, 4);
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
}
