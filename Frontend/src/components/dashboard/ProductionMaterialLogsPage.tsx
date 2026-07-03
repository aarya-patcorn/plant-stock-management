import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { fetchProductionMaterialLogs, type ProductionMaterialLog } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataBadge, DataTable } from "@/components/ui/DataTable";
import { TooltipText } from "@/components/ui/tooltip-text";
import { Select } from "@/components/ui/select";
import LoadingLoader from "@/components/ui/LoadingLoader";
import { clampPercentage } from "@/pages/dashboard/utils/dashboardCalculations";

type ProductionLowStockAlert = {
  id: string;
  productCategory: string;
  productColor: string;
  productName: string;
  token: string;
  bagSize: string;
  currentQuantity: number;
  unit: string;
};

function buildProductLabel(entry: ProductionMaterialLog) {
  return [entry.productCategory, entry.productName, entry.productColor].filter(Boolean).join(" / ");
}

function toNumber(value: string) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function formatCount(value: number) {
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}

function getAlertUnit(entry: ProductionMaterialLog) {
  const unit = (entry as ProductionMaterialLog & { unit?: string }).unit;
  return unit?.trim() || "bags";
}

function ProductionLowStockAlertCard({
  bagSize,
  currentQuantity,
  productCategory,
  productColor,
  productName,
  token,
  unit,
}: ProductionLowStockAlert) {
  const threshold = 200;
  const percentage = clampPercentage((currentQuantity / threshold) * 100);
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
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const productLabel = [productCategory, productName, productColor].filter(Boolean).join(" / ");

  return (
    <Card className="overflow-hidden border border-slate-200 bg-white/95 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-0 sm:gap-0">
          <div className="min-w-0">
            <TooltipText as="p" className="truncate text-xs font-semibold text-slate-950 sm:text-sm" content={productLabel || "Low stock alert"}>
              {productLabel || "Low stock alert"}
            </TooltipText>
          </div>
          <Badge className={`${tone.badgeClassName} shrink-0 self-start text-[10px] sm:text-xs`} variant="outline">
            {unit}
          </Badge>
        </div>

        <div className="mt-3 flex min-w-0 items-center gap-3 sm:mt-4 sm:gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center sm:h-24 sm:w-24">
            <svg className="-rotate-90" height="56" width="56" viewBox="0 0 96 96">
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
              <span className="text-xs font-bold text-slate-950 sm:text-md">{formatCount(percentage)}%</span>
              <span className="text-[8px] font-medium uppercase tracking-[0.12em] text-slate-500 sm:text-[8px] sm:tracking-[0.16em]">Stock</span>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <p className="truncate text-sm font-semibold text-slate-950 sm:text-sm">
              {formatCount(currentQuantity)} / {threshold} {unit}
            </p>
            <div className="space-y-1 text-[11px] text-slate-500 sm:text-xs">
              <p className="truncate">
                <span className="font-medium text-slate-700">Bag Size:</span> {bagSize || "-"}
              </p>
              <p className="truncate">
                <span className="font-medium text-slate-700">Token:</span> {token || "-"}
              </p>
              <p className="truncate">
                <span className="font-medium text-slate-700">Current:</span> {formatCount(currentQuantity)} {unit}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductionMaterialLogsPage() {
  const PAGE_SIZE = 7;
  const ALERT_PAGE_SIZE = 3;
  const [entries, setEntries] = useState<ProductionMaterialLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedProductCategory, setSelectedProductCategory] = useState("");
  const [selectedProductName, setSelectedProductName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentAlertPage, setCurrentAlertPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    void fetchProductionMaterialLogs()
      .then((logs) => {
        if (!isMounted) {
          return;
        }

        setEntries(logs);
        setLoadError("");
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setEntries([]);
        setLoadError(error instanceof Error ? error.message : "Unable to fetch production material logs.");
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

  const productCategoryOptions = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.productCategory).filter(Boolean))),
    [entries],
  );

  const productNameOptions = useMemo(
    () =>
      Array.from(
        new Set(
          entries
            .filter(
              (entry) =>
                !selectedProductCategory || entry.productCategory === selectedProductCategory,
            )
            .map((entry) => entry.productName)
            .filter(Boolean),
        ),
      ),
    [entries, selectedProductCategory],
  );

  useEffect(() => {
    if (selectedProductName && !productNameOptions.includes(selectedProductName)) {
      setSelectedProductName("");
    }
  }, [productNameOptions, selectedProductName]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const categoryMatch =
        !selectedProductCategory || entry.productCategory === selectedProductCategory;
      const productMatch =
        !selectedProductName || entry.productName === selectedProductName;

      return categoryMatch && productMatch;
    });
  }, [entries, selectedProductCategory, selectedProductName]);

  const sortedEntries = useMemo(
    () =>
      [...filteredEntries].sort((left, right) =>
        `${right.token} ${right.bagSize}`.localeCompare(`${left.token} ${left.bagSize}`),
      ),
    [filteredEntries],
  );

  const lowStockAlerts = useMemo<ProductionLowStockAlert[]>(
    () =>
      sortedEntries
        .filter((entry) => entry.productCategory === "Tile Adhesive" && toNumber(entry.currentQuantity) < 200)
        .map((entry) => ({
          id: entry.id,
          productCategory: entry.productCategory,
          productColor: entry.productColor,
          productName: entry.productName,
          token: entry.token,
          bagSize: entry.bagSize,
          currentQuantity: toNumber(entry.currentQuantity),
          unit: getAlertUnit(entry),
        })),
    [sortedEntries],
  );

  const totalPages = Math.max(1, Math.ceil(sortedEntries.length / PAGE_SIZE));
  const totalAlertPages = Math.max(1, Math.ceil(lowStockAlerts.length / ALERT_PAGE_SIZE));

  const paginatedEntries = useMemo(
    () =>
      sortedEntries.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
      ),
    [currentPage, sortedEntries],
  );

  const paginatedAlerts = useMemo(
    () =>
      lowStockAlerts.slice(
        (currentAlertPage - 1) * ALERT_PAGE_SIZE,
        currentAlertPage * ALERT_PAGE_SIZE,
      ),
    [currentAlertPage, lowStockAlerts],
  );

  useEffect(() => {
    setCurrentPage(1);
    setCurrentAlertPage(1);
  }, [selectedProductCategory, selectedProductName]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (currentAlertPage > totalAlertPages) {
      setCurrentAlertPage(totalAlertPages);
    }
  }, [currentAlertPage, totalAlertPages]);

  const logColumns = useMemo<ColumnDef<ProductionMaterialLog>[]>(
    () => [
      {
        id: "product",
        accessorFn: (row) => buildProductLabel(row),
        header: "Product",
        cell: ({ row }) => (
          <div className="min-w-[240px] max-w-[300px] space-y-1">
            <TooltipText as="p" className="truncate font-medium text-slate-900" content={buildProductLabel(row.original) || "-"}>
              {buildProductLabel(row.original) || "Production log"}
            </TooltipText>
            {row.original.productCategory ? (
              <DataBadge type="productCategory">{row.original.productCategory}</DataBadge>
            ) : null}
          </div>
        ),
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
        id: "totalBagsProduced",
        header: "Total Stock",
        cell: ({ row }) => formatCount(toNumber(row.original.currentQuantity) + toNumber(row.original.shippedQuantity)),
      },
      {
        accessorKey: "currentQuantity",
        header: "Current Stock",
        cell: ({ row }) => formatCount(toNumber(row.original.currentQuantity)),
      },
      {
        accessorKey: "shippedQuantity",
        header: "Dispatched Bags",
        cell: ({ row }) => formatCount(toNumber(row.original.shippedQuantity)),
      }
    ],
    [],
  );

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>All stock material logs</CardTitle>
            <CardDescription>Review product-wise stock, available bags, and dispatched bags from production logs.</CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link to="/">
              <ArrowLeft />
              Back to dashboard
            </Link>
          </Button>
        </CardHeader>
      </Card>

      <Card className="border-white/70 bg-white/85 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="text-lg sm:text-xl">Low Stock Alerts</CardTitle>
            <CardDescription className="hidden sm:block">
              Tile Adhesive products with current stock below 200 bags.
            </CardDescription>
          </div>
          <Badge className="text-[10px] sm:text-xs" variant="outline">
            {isLoading ? "Loading..." : `${lowStockAlerts.length} alerts`}
          </Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center rounded-md border border-dashed p-4 sm:p-6">
              <LoadingLoader />
            </div>
          ) : loadError ? (
            <div className="rounded-md border border-dashed p-3 text-xs text-destructive sm:p-4 sm:text-sm">{loadError}</div>
          ) : lowStockAlerts.length === 0 ? (
            <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground sm:p-4 sm:text-sm">
              No low-stock production material alerts right now.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paginatedAlerts.map((alert) => (
                  <ProductionLowStockAlertCard {...alert} key={alert.id} />
                ))}
              </div>

              {totalAlertPages > 1 ? (
                <div className="mt-4 flex items-center justify-between gap-2 sm:justify-center sm:gap-3">
                  <Button
                    className="h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
                    type="button"
                    disabled={currentAlertPage === 1}
                    onClick={() => setCurrentAlertPage((page) => Math.max(1, page - 1))}
                  >
                    Previous
                  </Button>

                  <span className="text-xs sm:text-sm">
                    Page {currentAlertPage} of {totalAlertPages}
                  </span>

                  <Button
                    className="h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
                    type="button"
                    disabled={currentAlertPage >= totalAlertPages}
                    onClick={() => setCurrentAlertPage((page) => Math.min(totalAlertPages, page + 1))}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock material log list</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading production material logs from sheet..."
              : sortedEntries.length === 0
                ? "No production material logs found yet."
                : `${sortedEntries.length} production material logs available.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isLoading && !loadError ? (
            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Product Category</p>
                <Select
                  value={selectedProductCategory}
                  onChange={(event) => setSelectedProductCategory(event.target.value)}
                >
                  <option value="">All</option>
                  {productCategoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Product Name</p>
                <Select
                  value={selectedProductName}
                  onChange={(event) => setSelectedProductName(event.target.value)}
                >
                  <option value="">All</option>
                  {productNameOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          ) : null}
          {loadError ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-destructive">{loadError}</div>
          ) : isLoading ? (
            <div className="flex justify-center rounded-md border border-dashed p-6">
              <LoadingLoader />
            </div>
          ) : sortedEntries.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">Production material logs will appear here once available.</div>
          ) : (
            <div className="space-y-3">
              <DataTable
                columns={logColumns}
                data={paginatedEntries}
                emptyMessage="Production material logs will appear here once available."
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  type="button"
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  type="button"
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

