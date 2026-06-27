import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type {
  DashboardReportCategory,
  DashboardReportProductStock,
  DashboardReports,
  DispatchEntry,
  InventoryEntry,
  ManufacturingEntry,
  ProductionMaterialLog,
  PurchaseEntry,
} from "@/lib/api";

export type { DashboardReportCategory, DashboardReportProductStock, DashboardReports };

export type DashboardData = {
  dispatchEntries: DispatchEntry[];
  inventoryEntries: InventoryEntry[];
  manufacturingEntries: ManufacturingEntry[];
  productionMaterialLogs: ProductionMaterialLog[];
  purchaseEntries: PurchaseEntry[];
};

export type TrendView = "day" | "month" | "year";

export type UnifiedActivity = {
  id: string;
  itemName: string;
  meta: string;
  quantity: string;
  secondaryBadge: string;
  secondaryLabel: string;
  secondaryInfo: string;
  type: "Purchase" | "Production" | "Dispatch";
};

export type InventoryAlert = {
  id: string;
  label: string;
  threshold: number;
  thresholdLabel: string;
  unitLabel: string;
  value: number;
};

export type OperationSnapshotItem = {
  caption: string;
  description: string;
  icon: LucideIcon;
  statusClassName: string;
  statusLabel: string;
  title: string;
  trendLabel?: string;
  value: ReactNode;
};

export type ProductionTrendPoint = {
  key: string;
  label: string;
  totalProductionKg: number;
};

export type DashboardStats = {
  todaysDispatchBags: number;
  todaysProductionKg: number;
};

export type DashboardReportsState = DashboardReports;
