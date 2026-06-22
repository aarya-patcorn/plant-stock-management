import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataBadge, DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import LoadingLoader from "@/components/ui/LoadingLoader";
import { Select } from "@/components/ui/select";
import type {
  DashboardReportCategory,
  DashboardReportProductStock,
} from "@/pages/dashboard/types";
import { parseNumber } from "@/pages/dashboard/utils/dashboardCalculations";
import { formatCount } from "@/pages/dashboard/utils/dashboardFormatters";

type ReportsSectionProps = {
  activeCategoryProductStocks: DashboardReportProductStock[];
  activeReportCategory: string;
  activeReportSummary: DashboardReportCategory | null;
  onCategoryChange: (value: string) => void;
  onFromDateChange: (value: string) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onToDateChange: (value: string) => void;
  paginatedStocks: DashboardReportProductStock[];
  reportCategoryOptions: string[];
  reportFromDate: string;
  reportToDate: string;
  reportsError: string;
  reportsLoading: boolean;
  stockPage: number;
  totalStockPages: number;
};

export function ReportsSection({
  activeCategoryProductStocks,
  activeReportCategory,
  activeReportSummary,
  onCategoryChange,
  onFromDateChange,
  onNextPage,
  onPreviousPage,
  onToDateChange,
  paginatedStocks,
  reportCategoryOptions,
  reportFromDate,
  reportToDate,
  reportsError,
  reportsLoading,
  stockPage,
  totalStockPages,
}: ReportsSectionProps) {
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
        cell: ({ row }) => (row.original.color ? <DataBadge type="color">{row.original.color}</DataBadge> : "-"),
      },
      {
        accessorKey: "token",
        header: "Token",
        cell: ({ row }) => (row.original.token ? <DataBadge type="token">{row.original.token}</DataBadge> : "-"),
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
          <span className="block text-right">{formatCount(parseNumber(row.original.totalBagsProduced) + (row.original.dispatchedBags))}</span>
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
    <Card className="min-w-0 border-white/70 bg-white/85 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <CardHeader className="gap-3 sm:gap-4">
        <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-lg sm:text-xl">Reports</CardTitle>
            <CardDescription className="hidden sm:block">Category-wise production and product stock reports.</CardDescription>
          </div>
          <Badge className="w-fit text-[10px] sm:text-xs" variant="outline">
            {reportsLoading ? "Loading..." : `${reportCategoryOptions.length} categories`}
          </Badge>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-2 lg:max-w-4xl lg:grid-cols-3">
          <div className="min-w-0 space-y-1">
            <label className="text-xs font-medium text-foreground sm:text-sm" htmlFor="report-from-date">
              From Date
            </label>
            <Input
              className="h-9 min-w-0 px-2 text-xs sm:h-11 sm:px-3.5 sm:text-sm"
              id="report-from-date"
              max={reportToDate || undefined}
              onChange={(event) => onFromDateChange(event.target.value)}
              type="date"
              value={reportFromDate}
            />
          </div>
          <div className="min-w-0 space-y-1">
            <label className="text-xs font-medium text-foreground sm:text-sm" htmlFor="report-to-date">
              To Date
            </label>
            <Input
              className="h-9 min-w-0 px-2 text-xs sm:h-11 sm:px-3.5 sm:text-sm"
              id="report-to-date"
              min={reportFromDate || undefined}
              onChange={(event) => onToDateChange(event.target.value)}
              type="date"
              value={reportToDate}
            />
          </div>
          <div className="col-span-2 min-w-0 space-y-1 lg:col-span-1">
            <label className="text-xs font-medium text-foreground sm:text-sm" htmlFor="report-category">
              Product Category
            </label>
            <Select
              className="h-9 min-w-0 px-2 text-xs sm:h-11 sm:px-3.5 sm:text-sm"
              id="report-category"
              onChange={(event) => onCategoryChange(event.target.value)}
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
      <CardContent className="space-y-4 sm:space-y-5">
        {reportsLoading ? (
          <div className="flex justify-center rounded-md border border-dashed p-4 sm:p-6">
            <LoadingLoader />
          </div>
        ) : reportsError ? (
          <div className="rounded-md border border-dashed border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive sm:p-4 sm:text-sm">
            {reportsError}
          </div>
        ) : reportCategoryOptions.length === 0 ? (
          <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground sm:p-4 sm:text-sm">
            No production report found for selected date range.
          </div>
        ) : (
          <div className="rounded-xl border bg-background/70 p-3 sm:rounded-2xl sm:p-5">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground sm:text-lg">
                  {activeReportCategory
                    ? `${activeReportCategory} Product Stock Details`
                    : "All Categories Product Stock Details"}
                </h3>
                <p className="hidden text-sm text-muted-foreground sm:block">Sorted by highest current stock first.</p>
              </div>
              {activeReportCategory && activeReportSummary ? (
                <Badge className="w-fit text-[10px] sm:text-xs" variant="outline">{formatCount(activeReportSummary.productsCount)} products</Badge>
              ) : (
                <Badge className="w-fit text-[10px] sm:text-xs" variant="outline">{formatCount(activeCategoryProductStocks.length)} products</Badge>
              )}
            </div>

            {activeCategoryProductStocks.length === 0 ? (
              <div className="mt-3 rounded-md border border-dashed p-3 text-xs text-muted-foreground sm:mt-4 sm:p-4 sm:text-sm">
                No product stock found for this category.
              </div>
            ) : (
              <div className="mt-3 overflow-x-auto sm:mt-4">
                <DataTable
                  columns={reportStockColumns}
                  data={paginatedStocks}
                  emptyMessage="No product stock found for this category."
                />
              </div>
            )}

            {activeCategoryProductStocks.length > 0 ? (
              <div className="mt-4 flex items-center justify-between gap-2">
                <Button className="h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm" disabled={stockPage === 1} onClick={onPreviousPage} type="button" variant="outline">
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground sm:text-sm">
                  Page {stockPage} of {totalStockPages}
                </span>
                <Button
                  className="h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
                  disabled={stockPage === totalStockPages}
                  onClick={onNextPage}
                  type="button"
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
