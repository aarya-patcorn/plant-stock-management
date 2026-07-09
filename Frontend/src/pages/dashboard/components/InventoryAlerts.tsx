import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataBadge, DataTable } from "@/components/ui/DataTable";
import LoadingLoader from "@/components/ui/LoadingLoader";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import {
  TableFiltersBar,
  type Filter,
  type FilterFieldConfig,
  createNumberFilterField,
  createSelectFilterField,
  createSelectOptions,
  createTextFilterField,
} from "@/components/ui/table-filters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipText } from "@/components/ui/tooltip-text";
import type { InventoryEntry, ProductionMaterialLog } from "@/lib/api";
import { applyTableFilters } from "@/lib/tableFilters";
import { getInventoryAlertThreshold, parseNumber } from "@/pages/dashboard/utils/dashboardCalculations";

const ALERTS_PAGE_SIZE = 5;

type InventoryAlertsProps = {
  inventoryEntries: InventoryEntry[];
  isLoading: boolean;
  productionMaterialLogs: ProductionMaterialLog[];
};

export type RawMaterialAlertRow = {
  id: string;
  rawMaterialName: string;
  packagingType: string;
  productName: string;
  color: string;
  quantity: number;
  unit: string;
};

type FinishedGoodsAlertRow = {
  id: string;
  productCategory: string;
  productName: string;
  bagSize: string;
  color: string;
  quantity: number;
};

function compactValue(value: string) {
  return value.trim();
}

function renderTextCell(value: string, className = "block max-w-[220px] truncate") {
  const text = compactValue(value);

  if (!text || text === "-") {
    return "";
  }

  return (
    <TooltipText as="span" className={className} content={text}>
      {text}
    </TooltipText>
  );
}

function isColorLikeValue(value: string) {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return false;
  }

  return [
    "grey",
    "gray",
    "white",
    "black",
    "blue",
    "red",
    "yellow",
    "green",
    "ivory",
    "terracotta",
    "coffee brown",
    "jaisalmer",
    "sabal",
    "savetrane",
    "slate grey",
    "light grey",
    "dark grey",
  ].some((token) => normalized.includes(token));
}

function resolveRawMaterialAlertColor(entry: InventoryEntry) {
  const rawMaterialName = compactValue(entry.rawMaterialName);
  const packagingType = compactValue(entry.packagingType);
  const level2 = compactValue(entry.level2);
  const level3 = compactValue(entry.level3);
  const sandEpoxyColor = compactValue(entry.sandEpoxyColor);
  const bagColor = compactValue(entry.bagColor);
  const packagingBagColor = compactValue(entry.packagingBagColor);

  if (
    rawMaterialName === "Packaging" &&
    packagingType === "FG" &&
    level2 === "Epoxy" &&
    level3 === "Coloured Sand" &&
    sandEpoxyColor
  ) {
    return sandEpoxyColor;
  }

  if (bagColor) {
    return bagColor;
  }

  if (packagingBagColor) {
    return packagingBagColor;
  }

  if (isColorLikeValue(packagingType)) {
    return packagingType;
  }

  if (sandEpoxyColor) {
    return sandEpoxyColor;
  }

  return "";
}

export function mapRawMaterialAlertRow(entry: InventoryEntry): RawMaterialAlertRow {
  const rawMaterialName = compactValue(entry.rawMaterialName);
  const packagingType = compactValue(entry.packagingType);
  const level2 = compactValue(entry.level2);
  const level3 = compactValue(entry.level3);
  const level4 = compactValue(entry.level4);
  const resolvedColor = resolveRawMaterialAlertColor(entry);

  if (rawMaterialName === "Packaging" && packagingType === "FG") {
    const unit = compactValue(entry.unit).toLowerCase();
    const productNameSuffix = unit === "pcs" ? "Coupon" : unit === "bags" ? "Bags" : "";

    return {
      id: entry.id,
      rawMaterialName,
      packagingType: level2,
      productName: [level4, level3, productNameSuffix].filter(Boolean).join(" / "),
      color: resolvedColor,
      quantity: parseNumber(entry.currentStock),
      unit: unit || "",
    };
  }

  if (rawMaterialName === "Chemical") {
    return {
      id: entry.id,
      rawMaterialName,
      packagingType,
      productName: level2,
      color: resolvedColor,
      quantity: parseNumber(entry.currentStock),
      unit: compactValue(entry.unit).toLowerCase() || ""
    };
  }

  if (rawMaterialName === "Cement") {
    return {
      id: entry.id,
      rawMaterialName,
      packagingType,
      productName: level2,
      color: "",
      quantity: parseNumber(entry.currentStock),
      unit: compactValue(entry.unit).toLowerCase() || "",
    };
  }

  if (rawMaterialName === "Sand") {
    return {
      id: entry.id,
      rawMaterialName,
      packagingType: "",
      productName: level2 || "",
      color: packagingType,
      quantity: parseNumber(entry.currentStock),
      unit: compactValue(entry.unit).toLowerCase() || "",
    };
  }

  if (isColorLikeValue(packagingType)) {
    return {
      id: entry.id,
      rawMaterialName,
      packagingType: "",
      productName: [level2, level3, level4].filter(Boolean).join(" / "),
      color: resolvedColor,
      quantity: parseNumber(entry.currentStock),
      unit: compactValue(entry.unit).toLowerCase() || "",
    };
  }

  return {
    id: entry.id,
    rawMaterialName,
    packagingType,
    productName: [level2, level3, level4].filter(Boolean).join(" / "),
    color: resolvedColor,
    quantity: parseNumber(entry.currentStock),
    unit: compactValue(entry.unit).toLowerCase() || "",
  };
}

export function InventoryAlerts({
  inventoryEntries,
  isLoading,
  productionMaterialLogs,
}: InventoryAlertsProps) {
  const [rawFilters, setRawFilters] = useState<Filter[]>([]);
  const [finishedGoodsFilters, setFinishedGoodsFilters] = useState<Filter[]>([]);
  const [rawPage, setRawPage] = useState(1);
  const [finishedGoodsPage, setFinishedGoodsPage] = useState(1);

  const rawMaterialRows = useMemo<RawMaterialAlertRow[]>(
    () =>
      inventoryEntries
        .filter((entry) => {
          const thresholdRule = getInventoryAlertThreshold(entry);

          if (!thresholdRule) {
            return false;
          }

          return parseNumber(entry.currentStock) <= thresholdRule.threshold;
        })
        .map(mapRawMaterialAlertRow)
        .sort((left, right) => left.quantity - right.quantity),
    [inventoryEntries],
  );

  const finishedGoodsRows = useMemo<FinishedGoodsAlertRow[]>(
    () =>
      productionMaterialLogs
        .filter((entry) => ["Tile Adhesive", "Bondure"].includes(entry.productCategory))
        .map((entry) => ({
          id: entry.id,
          productCategory: compactValue(entry.productCategory),
          productName: compactValue(entry.productName),
          bagSize: compactValue(entry.bagSize),
          color: compactValue(entry.productColor),
          quantity: parseNumber(entry.currentQuantity),
        }))
        .filter((entry) => entry.quantity < 200)
        .sort((left, right) => left.quantity - right.quantity),
    [productionMaterialLogs],
  );

  const rawFilterFields = useMemo<FilterFieldConfig[]>(
    () => [
      createTextFilterField("rawMaterialName", "Raw Material"),
      createTextFilterField("packagingType", "Packaging Type"),
      createTextFilterField("productName", "Product Name"),
      createTextFilterField("color", "Color"),
      createNumberFilterField("quantity", "Quantity"),
      createSelectFilterField(
        "rawMaterialCategory",
        "Category",
        createSelectOptions(rawMaterialRows.map((row) => row.rawMaterialName)),
      ),
    ],
    [rawMaterialRows],
  );

  const finishedGoodsFilterFields = useMemo<FilterFieldConfig[]>(
    () => [
      createTextFilterField("productCategory", "Product Category"),
      createTextFilterField("productName", "Product Name"),
      createTextFilterField("bagSize", "Bag Size"),
      createTextFilterField("color", "Color"),
      createNumberFilterField("quantity", "Quantity"),
      createSelectFilterField(
        "productCategorySelect",
        "Category",
        createSelectOptions(finishedGoodsRows.map((row) => row.productCategory)),
      ),
    ],
    [finishedGoodsRows],
  );

  const filteredRawMaterialRows = useMemo(
    () =>
      applyTableFilters(
        rawMaterialRows,
        rawFilters,
        {
          rawMaterialName: (row) => row.rawMaterialName,
          packagingType: (row) => row.packagingType,
          productName: (row) => row.productName,
          color: (row) => row.color,
          quantity: (row) => row.quantity,
          rawMaterialCategory: (row) => row.rawMaterialName,
        },
        {
          quantity: "number",
        },
      ),
    [rawFilters, rawMaterialRows],
  );

  const filteredFinishedGoodsRows = useMemo(
    () =>
      applyTableFilters(
        finishedGoodsRows,
        finishedGoodsFilters,
        {
          productCategory: (row) => row.productCategory,
          productName: (row) => row.productName,
          bagSize: (row) => row.bagSize,
          color: (row) => row.color,
          quantity: (row) => row.quantity,
          productCategorySelect: (row) => row.productCategory,
        },
        {
          quantity: "number",
        },
      ),
    [finishedGoodsFilters, finishedGoodsRows],
  );

  const rawMaterialTotalPages = Math.max(1, Math.ceil(filteredRawMaterialRows.length / ALERTS_PAGE_SIZE));
  const finishedGoodsTotalPages = Math.max(1, Math.ceil(filteredFinishedGoodsRows.length / ALERTS_PAGE_SIZE));

  const paginatedRawMaterialRows = useMemo(
    () => filteredRawMaterialRows.slice((rawPage - 1) * ALERTS_PAGE_SIZE, rawPage * ALERTS_PAGE_SIZE),
    [filteredRawMaterialRows, rawPage],
  );

  const paginatedFinishedGoodsRows = useMemo(
    () =>
      filteredFinishedGoodsRows.slice(
        (finishedGoodsPage - 1) * ALERTS_PAGE_SIZE,
        finishedGoodsPage * ALERTS_PAGE_SIZE,
      ),
    [filteredFinishedGoodsRows, finishedGoodsPage],
  );

  useEffect(() => {
    setRawPage(1);
  }, [rawFilters]);

  useEffect(() => {
    setFinishedGoodsPage(1);
  }, [finishedGoodsFilters]);

  useEffect(() => {
    if (rawPage > rawMaterialTotalPages) {
      setRawPage(rawMaterialTotalPages);
    }
  }, [rawMaterialTotalPages, rawPage]);

  useEffect(() => {
    if (finishedGoodsPage > finishedGoodsTotalPages) {
      setFinishedGoodsPage(finishedGoodsTotalPages);
    }
  }, [finishedGoodsPage, finishedGoodsTotalPages]);

  const rawMaterialColumns = useMemo<ColumnDef<RawMaterialAlertRow>[]>(
    () => [
      {
        accessorKey: "rawMaterialName",
        header: "Raw Material Name",
        cell: ({ row }) =>
          row.original.rawMaterialName ? <DataBadge type="rawMaterialName">{row.original.rawMaterialName}</DataBadge> : "N/A",
      },
      {
        accessorKey: "packagingType",
        header: "Packaging Type",
        cell: ({ row }) => renderTextCell(row.original.packagingType, "block max-w-[180px] truncate") || "N/A",
      },
      {
        accessorKey: "productName",
        header: "Product Name",
        cell: ({ row }) => renderTextCell(row.original.productName) || "N/A",
      },
      {
        accessorKey: "color",
        header: "Color",
        cell: ({ row }) => (row.original.color ? <DataBadge type="color">{row.original.color}</DataBadge> : "N/A"),
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) => <span className="block text-right">{row.original.quantity}</span>,
      },
    ],
    [],
  );

  const finishedGoodsColumns = useMemo<ColumnDef<FinishedGoodsAlertRow>[]>(
    () => [
      {
        accessorKey: "productCategory",
        header: "Product Category",
        cell: ({ row }) =>
          row.original.productCategory ? <DataBadge type="productCategory">{row.original.productCategory}</DataBadge> : "",
      },
      {
        accessorKey: "productName",
        header: "Product Name",
        cell: ({ row }) => renderTextCell(row.original.productName) || "-",
      },
      {
        accessorKey: "bagSize",
        header: "Bag Size",
        cell: ({ row }) => renderTextCell(row.original.bagSize, "block max-w-[120px] truncate") || "N/A",
      },
      {
        accessorKey: "color",
        header: "Color",
        cell: ({ row }) => (row.original.color ? <DataBadge type="color">{row.original.color}</DataBadge> : "N/A"),
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) => <span className="block text-right">{row.original.quantity}</span>,
      },
    ],
    [],
  );

  const showEmptyState = !isLoading && rawMaterialRows.length === 0 && finishedGoodsRows.length === 0;

  return (
    <Card className="border-white/70 bg-white/85 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <CardHeader className="gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg sm:text-xl">Inventory Alerts</CardTitle>
            <CardDescription className="hidden sm:block">
              Low-stock raw materials and finished goods requiring attention.
            </CardDescription>
          </div>
          <div className="rounded-xl border border-slate-200 bg-background/70 px-3 py-2 text-sm font-medium text-muted-foreground">
            {isLoading ? "Loading..." : `${rawMaterialRows.length + finishedGoodsRows.length} total alerts`}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {isLoading ? (
          <div className="flex justify-center rounded-md border border-dashed p-6">
            <LoadingLoader />
          </div>
        ) : showEmptyState ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            No inventory alerts right now.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
            <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
              <CardHeader className="gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                <div>
                  <CardTitle className="text-base sm:text-lg">Raw Material Alerts</CardTitle>
                  <CardDescription>{filteredRawMaterialRows.length} low-stock raw material records.</CardDescription>
                </div>
                <TableFiltersBar fields={rawFilterFields} filters={rawFilters} onChange={setRawFilters} className="shrink-0" />
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <DataTable
                  columns={rawMaterialColumns}
                  data={paginatedRawMaterialRows}
                  emptyMessage="No raw material alerts found."
                />

                {filteredRawMaterialRows.length > ALERTS_PAGE_SIZE ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground sm:text-sm">
                      Page {rawPage} of {rawMaterialTotalPages}
                    </span>
                    <Pagination className="w-auto justify-end">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            type="button"
                            onClick={() => setRawPage((page) => Math.max(1, page - 1))}
                            disabled={rawPage === 1}
                          />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext
                            type="button"
                            onClick={() => setRawPage((page) => Math.min(rawMaterialTotalPages, page + 1))}
                            disabled={rawPage === rawMaterialTotalPages}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
              <CardHeader className="gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                <div>
                  <CardTitle className="text-base sm:text-lg">Finished Goods Alerts</CardTitle>
                  <CardDescription>{filteredFinishedGoodsRows.length} finished goods below 200 bags.</CardDescription>
                </div>
                <TableFiltersBar
                  fields={finishedGoodsFilterFields}
                  filters={finishedGoodsFilters}
                  onChange={setFinishedGoodsFilters}
                  className="shrink-0"
                />
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <DataTable
                  columns={finishedGoodsColumns}
                  data={paginatedFinishedGoodsRows}
                  emptyMessage="No finished goods alerts found."
                />

                {filteredFinishedGoodsRows.length > ALERTS_PAGE_SIZE ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground sm:text-sm">
                      Page {finishedGoodsPage} of {finishedGoodsTotalPages}
                    </span>
                    <Pagination className="w-auto justify-end">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            type="button"
                            onClick={() => setFinishedGoodsPage((page) => Math.max(1, page - 1))}
                            disabled={finishedGoodsPage === 1}
                          />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext
                            type="button"
                            onClick={() => setFinishedGoodsPage((page) => Math.min(finishedGoodsTotalPages, page + 1))}
                            disabled={finishedGoodsPage === finishedGoodsTotalPages}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


