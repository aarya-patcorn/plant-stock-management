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
        accessorKey: "currentQuantity",
        header: "Current Stock",
        cell: ({ row }) => (
          <span className="block text-right">{formatCount(parseNumber(row.original.currentQuantity))}</span>
        ),
      },
      {
        accessorKey: "totalBagsProduced",
        header: "Total Stock",
        cell: ({ row }) => (
          <span className="block text-right">{formatCount(parseNumber(row.original.totalBagsProduced))}</span>
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
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Reports</CardTitle>
            <CardDescription>Category-wise production and product stock reports.</CardDescription>
          </div>
          <Badge variant="outline">
            {reportsLoading ? "Loading..." : `${reportCategoryOptions.length} categories`}
          </Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:max-w-4xl">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="report-from-date">
              From Date
            </label>
            <Input
              id="report-from-date"
              max={reportToDate || undefined}
              onChange={(event) => onFromDateChange(event.target.value)}
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
              onChange={(event) => onToDateChange(event.target.value)}
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
      <CardContent className="space-y-5">
        {reportsLoading ? (
          <div className="flex justify-center rounded-md border border-dashed p-6">
            <LoadingLoader />
          </div>
        ) : reportsError ? (
          <div className="rounded-md border border-dashed border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {reportsError}
          </div>
        ) : reportCategoryOptions.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            No production report found for selected date range.
          </div>
        ) : (
          <div className="rounded-2xl border bg-background/70 p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {activeReportCategory
                    ? `${activeReportCategory} Product Stock Details`
                    : "All Categories Product Stock Details"}
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
              <div className="mt-4 overflow-x-auto">
                <DataTable
                  columns={reportStockColumns}
                  data={paginatedStocks}
                  emptyMessage="No product stock found for this category."
                />
              </div>
            )}

            {activeCategoryProductStocks.length > 0 ? (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button disabled={stockPage === 1} onClick={onPreviousPage} type="button" variant="outline">
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {stockPage} of {totalStockPages}
                </span>
                <Button
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
