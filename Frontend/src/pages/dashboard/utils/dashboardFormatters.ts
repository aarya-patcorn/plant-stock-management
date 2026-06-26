import type { InventoryEntry, ProductionMaterialLog, PurchaseEntry } from "@/lib/api";
import type { TrendView } from "@/pages/dashboard/types";

export function formatCount(value: number) {
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}

export function formatKgToMt(value: number) {
  return `${formatCount(value / 1000)} mt`;
}

export function formatTrendAxis(value: number) {
  return `${formatCount(value / 1000)} mt`;
}

export function formatTrendLabel(value: string, view: TrendView) {
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

export function buildInventoryLabel(entry: Pick<InventoryEntry, "rawMaterialName" | "packagingType" | "level2" | "level3" | "level4">) {
  return [entry.rawMaterialName, entry.packagingType, entry.level2, entry.level3, entry.level4]
    .filter(Boolean)
    .join(" / ");
}

export function buildInventoryCategoryPath(entry: Pick<InventoryEntry, "packagingType" | "level2" | "level3" | "level4">) {
  return [entry.packagingType, entry.level2, entry.level3, entry.level4].filter(Boolean).join(" / ");
}

export function buildProductLabel(entry: ProductionMaterialLog) {
  return [entry.productCategory, entry.productName, entry.productColor].filter(Boolean).join(" / ");
}

export function buildInventoryAlertLabel(
  entry: Pick<InventoryEntry, "rawMaterialName" | "packagingType" | "level2" | "level3"> & Partial<Pick<PurchaseEntry, "packagingBag" | "bucketSize">>,
) {
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
