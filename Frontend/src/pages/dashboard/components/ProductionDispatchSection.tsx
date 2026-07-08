import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { DispatchEntry, ManufacturingEntry } from "@/lib/api";
import { DataBadge, DataTable } from "@/components/ui/DataTable";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipText } from "@/components/ui/tooltip-text";
import { formatCalendarDate } from "@/components/ui/calendar";
import { parseNumber } from "@/pages/dashboard/utils/dashboardCalculations";

const PRODUCTION_DISPATCH_PAGE_SIZE = 5;

type ProductionDispatchSectionProps = {
  dispatchEntries: DispatchEntry[];
  isLoading: boolean;
  manufacturingEntries: ManufacturingEntry[];
};

type ProductionTableRow = {
  id: string;
  batchNo: string;
  tphBatch: string;
  productName: string;
  color: string;
  token: string;
  bagSize: string;
  quantity: string;
};

export function ProductionDispatchSection({
  dispatchEntries,
  isLoading,
  manufacturingEntries,
}: ProductionDispatchSectionProps) {
  const [selectedProductionDispatchDate, setSelectedProductionDispatchDate] = useState(() => formatCalendarDate(new Date()));
  const [productionPage, setProductionPage] = useState(1);
  const [dispatchPage, setDispatchPage] = useState(1);

  useEffect(() => {
    setProductionPage(1);
    setDispatchPage(1);
  }, [selectedProductionDispatchDate]);

  const productionRows = useMemo<ProductionTableRow[]>(
    () =>
      manufacturingEntries
        .filter((entry) => entry.productionDate === selectedProductionDispatchDate)
        .flatMap((entry) => {
          const productItems = entry.productItems.length > 0
            ? entry.productItems
            : [{
              token: entry.token,
              bagSize: entry.bagSize,
              totalBagsProduced: entry.totalBagsProduced,
            }];

          return productItems.map((item, index) => ({
            id: `${entry.id}-${index}`,
            batchNo: entry.batchNo,
            tphBatch: entry.tphBatch,
            productName: entry.finishedProductName,
            color: entry.color,
            token: item.token,
            bagSize: item.bagSize,
            quantity: item.totalBagsProduced || entry.totalBagsProduced,
          }));
        })
        .sort((left, right) => right.batchNo.localeCompare(left.batchNo)),
    [manufacturingEntries, selectedProductionDispatchDate],
  );

  const filteredDispatchEntries = useMemo<DispatchEntry[]>(
    () =>
      dispatchEntries
        .filter((entry) => entry.date === selectedProductionDispatchDate)
        .sort((left, right) => `${right.date} ${right.time}`.localeCompare(`${left.date} ${left.time}`)),
    [dispatchEntries, selectedProductionDispatchDate],
  );

  const totalProductionPages = Math.max(1, Math.ceil(productionRows.length / PRODUCTION_DISPATCH_PAGE_SIZE));
  const totalDispatchPages = Math.max(1, Math.ceil(filteredDispatchEntries.length / PRODUCTION_DISPATCH_PAGE_SIZE));

  useEffect(() => {
    if (productionPage > totalProductionPages) {
      setProductionPage(totalProductionPages);
    }
  }, [productionPage, totalProductionPages]);

  useEffect(() => {
    if (dispatchPage > totalDispatchPages) {
      setDispatchPage(totalDispatchPages);
    }
  }, [dispatchPage, totalDispatchPages]);

  const paginatedProductionRows = useMemo(
    () =>
      productionRows.slice(
        (productionPage - 1) * PRODUCTION_DISPATCH_PAGE_SIZE,
        productionPage * PRODUCTION_DISPATCH_PAGE_SIZE,
      ),
    [productionPage, productionRows],
  );

  const paginatedDispatchRows = useMemo(
    () =>
      filteredDispatchEntries.slice(
        (dispatchPage - 1) * PRODUCTION_DISPATCH_PAGE_SIZE,
        dispatchPage * PRODUCTION_DISPATCH_PAGE_SIZE,
      ),
    [dispatchPage, filteredDispatchEntries],
  );

  const productionColumns = useMemo<ColumnDef<ProductionTableRow>[]>(
    () => [
      {
        accessorKey: "batchNo",
        header: "Batch No.",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[120px] truncate font-medium text-slate-900" content={row.original.batchNo || "-"}>
            {row.original.batchNo || "-"}
          </TooltipText>
        ),
      },
      {
        accessorKey: "tphBatch",
        header: "TPH/Batch",
        cell: ({ row }) => row.original.tphBatch || "-",
      },
      {
        accessorKey: "productName",
        header: "Product Name",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[220px] truncate" content={row.original.productName || "-"}>
            {row.original.productName || "-"}
          </TooltipText>
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
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) => <span className="block text-right">{parseNumber(Number(row.original.quantity) * Number(row.original.bagSize))}</span>,
      },
    ],
    [],
  );

  const dispatchColumns = useMemo<ColumnDef<DispatchEntry>[]>(
    () => [
      {
        accessorKey: "productName",
        header: "Product Name",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[220px] truncate font-medium text-slate-900" content={row.original.productName || "-"}>
            {row.original.productName || "-"}
          </TooltipText>
        ),
      },
      {
        accessorKey: "productColor",
        header: "Color",
        cell: ({ row }) => (row.original.productColor ? <DataBadge type="color">{row.original.productColor}</DataBadge> : "-"),
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
        accessorKey: "totalBags",
        header: "Dispatch Bags",
        cell: ({ row }) => <span className="block text-right">{parseNumber(row.original.totalBags)}</span>,
      },
      {
        accessorKey: "dispatchSite",
        header: "Dispatch Site",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[180px] truncate" content={row.original.dispatchSite || "-"}>
            {row.original.dispatchSite || "-"}
          </TooltipText>
        ),
      },
    ],
    [],
  );

  return (
    <Card className="min-w-0 border-white/70 bg-white/85 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div>
          <CardTitle className="text-lg sm:text-xl">Production & Dispatch</CardTitle>
          <CardDescription className="hidden sm:block">
            Daily production and dispatch records filtered by the selected date.
          </CardDescription>
        </div>
        <div className="w-full sm:w-[260px]">
          <DatePickerInput
            id="dashboard-production-dispatch-date"
            name="dashboardProductionDispatchDate"
            value={selectedProductionDispatchDate}
            onChange={setSelectedProductionDispatchDate}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
          <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
            <CardHeader className="gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
              <div>
                <CardTitle className="text-base sm:text-lg">Production</CardTitle>
                <CardDescription>{productionRows.length} records for the selected date.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <DataTable
                columns={productionColumns}
                data={paginatedProductionRows}
                emptyMessage="No production records found for the selected date."
                isLoading={isLoading}
              />

              {!isLoading && productionRows.length > PRODUCTION_DISPATCH_PAGE_SIZE ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground sm:text-sm">
                    Page {productionPage} of {totalProductionPages}
                  </span>
                  <Pagination className="w-auto justify-end">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          type="button"
                          onClick={() => setProductionPage((page) => Math.max(1, page - 1))}
                          disabled={productionPage === 1}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          type="button"
                          onClick={() => setProductionPage((page) => Math.min(totalProductionPages, page + 1))}
                          disabled={productionPage === totalProductionPages}
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
                <CardTitle className="text-base sm:text-lg">Dispatch</CardTitle>
                <CardDescription>{filteredDispatchEntries.length} records for the selected date.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <DataTable
                columns={dispatchColumns}
                data={paginatedDispatchRows}
                emptyMessage="No dispatch records found for the selected date."
                isLoading={isLoading}
              />

              {!isLoading && filteredDispatchEntries.length > PRODUCTION_DISPATCH_PAGE_SIZE ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground sm:text-sm">
                    Page {dispatchPage} of {totalDispatchPages}
                  </span>
                  <Pagination className="w-auto justify-end">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          type="button"
                          onClick={() => setDispatchPage((page) => Math.max(1, page - 1))}
                          disabled={dispatchPage === 1}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          type="button"
                          onClick={() => setDispatchPage((page) => Math.min(totalDispatchPages, page + 1))}
                          disabled={dispatchPage === totalDispatchPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
