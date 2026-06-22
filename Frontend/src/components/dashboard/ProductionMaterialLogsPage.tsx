import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { fetchProductionMaterialLogs, type ProductionMaterialLog } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataBadge, DataTable } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/select";
import LoadingLoader from "@/components/ui/LoadingLoader";

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

export function ProductionMaterialLogsPage() {
  const PAGE_SIZE = 7;
  const [entries, setEntries] = useState<ProductionMaterialLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedProductCategory, setSelectedProductCategory] = useState("");
  const [selectedProductName, setSelectedProductName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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

  const totalPages = Math.max(1, Math.ceil(sortedEntries.length / PAGE_SIZE));

  const paginatedEntries = useMemo(
    () =>
      sortedEntries.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
      ),
    [currentPage, sortedEntries],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProductCategory, selectedProductName]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const logColumns = useMemo<ColumnDef<ProductionMaterialLog>[]>(
    () => [
      {
        id: "product",
        accessorFn: (row) => buildProductLabel(row),
        header: "Product",
        cell: ({ row }) => (
          <div className="min-w-[240px] max-w-[300px] space-y-1">
            <p className="truncate font-medium text-slate-900" title={buildProductLabel(row.original) || "-"}>
              {buildProductLabel(row.original) || "Production log"}
            </p>
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
            <CardTitle>All production material logs</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle>Production material log list</CardTitle>
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



