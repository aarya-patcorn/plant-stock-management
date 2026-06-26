import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { fetchInventory, type PurchaseEntry } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataBadge, DataTable } from "@/components/ui/DataTable";
import { TooltipText } from "@/components/ui/tooltip-text";
import LoadingLoader from "@/components/ui/LoadingLoader";
import { Select } from "@/components/ui/select";

function buildInventoryLabel(entry: PurchaseEntry) {
  return [entry.rawMaterialName, entry.packagingType, entry.level2, entry.level3, entry.level4]
    .filter(Boolean)
    .join(" / ");
}

export function InventoryEntriesPage() {
  const PAGE_SIZE = 7;
  const [entries, setEntries] = useState<PurchaseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [rawMaterialFilter, setRawMaterialFilter] = useState("");
  const [packagingTypeFilter, setPackagingTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    void fetchInventory()
      .then((inventoryEntries) => {
        if (!isMounted) {
          return;
        }

        setEntries(inventoryEntries);
        setLoadError("");
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setEntries([]);
        setLoadError(error instanceof Error ? error.message : "Unable to fetch inventory entries.");
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

  const sortedEntries = useMemo(
    () =>
      [...entries].sort((left, right) =>
        `${right.date} ${right.time}`.localeCompare(`${left.date} ${left.time}`),
      ),
    [entries],
  );

  const rawMaterialOptions = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.rawMaterialName).filter(Boolean))),
    [entries],
  );

  const packagingTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          entries
            .filter((entry) => !rawMaterialFilter || entry.rawMaterialName === rawMaterialFilter)
            .map((entry) => entry.packagingType)
            .filter(Boolean),
        ),
      ),
    [entries, rawMaterialFilter],
  );

  const filteredEntries = useMemo(
    () =>
      sortedEntries.filter(
        (entry) =>
          (!rawMaterialFilter || entry.rawMaterialName === rawMaterialFilter) &&
          (!packagingTypeFilter || entry.packagingType === packagingTypeFilter),
      ),
    [packagingTypeFilter, rawMaterialFilter, sortedEntries],
  );

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));

  const paginatedEntries = useMemo(
    () =>
      filteredEntries.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
      ),
    [currentPage, filteredEntries],
  );

  useEffect(() => {
    setPackagingTypeFilter("");
  }, [rawMaterialFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [packagingTypeFilter, rawMaterialFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const inventoryColumns = useMemo<ColumnDef<PurchaseEntry>[]>(
    () => [
      {
        id: "material",
        accessorFn: (row) => buildInventoryLabel(row),
        header: "Material",
        cell: ({ row }) => (
          <div className="min-w-[260px] max-w-[320px] space-y-1">
            <TooltipText as="p" className="truncate font-medium text-slate-900" content={buildInventoryLabel(row.original) || "-"}>
              {buildInventoryLabel(row.original) || "Inventory item"}
            </TooltipText>
            <div className="flex flex-wrap gap-2">
              {row.original.rawMaterialName ? (
                <DataBadge type="rawMaterialName">{row.original.rawMaterialName}</DataBadge>
              ) : null}
              {row.original.packagingType ? (
                <DataBadge type="productCategory">{row.original.packagingType}</DataBadge>
              ) : null}
              {row.original.packagingBagColor ? (
                <DataBadge type="packagingBagColor">{row.original.packagingBagColor}</DataBadge>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        id: "quantity",
        accessorFn: (row) => [row.purchaseStock || row.quantityPurchased, row.unit].filter(Boolean).join(" "),
        header: "Quantity",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span>{[row.original.purchaseStock || row.original.quantityPurchased, row.original.unit].filter(Boolean).join(" ") || "-"}</span>
            {row.original.unit ? <DataBadge type="unit">{row.original.unit}</DataBadge> : null}
          </div>
        ),
      },
      {
        id: "purchaseStock",
        accessorFn: (row) => row.purchaseStock || row.quantityPurchased || "0",
        header: "Purchase Stock",
        cell: ({ row }) => row.original.purchaseStock || row.original.quantityPurchased || "0",
      },
      {
        accessorKey: "usedInProduction",
        header: "Used In Production",
        cell: ({ row }) => row.original.usedInProduction || "0",
      },
      {
        accessorKey: "currentStock",
        header: "Current Stock",
        cell: ({ row }) => row.original.currentStock || "0",
      },
    ],
    [],
  );

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>All inventory entries</CardTitle>
            <CardDescription>Review every inventory item with purchase, used, and current stock values.</CardDescription>
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
          <CardTitle>Inventory list</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading inventory from sheet..."
              : filteredEntries.length === 0
                ? "No inventory entries found yet."
                : `${filteredEntries.length} inventory entries available.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-destructive">{loadError}</div>
          ) : isLoading ? (
            <div className="flex justify-center rounded-md border border-dashed p-6">
              <LoadingLoader />
            </div>
          ) : sortedEntries.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">Inventory entries will appear here once available.</div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Raw Material Name</p>
                  <Select value={rawMaterialFilter} onChange={(event) => setRawMaterialFilter(event.target.value)}>
                    <option value="">All</option>
                    {rawMaterialOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Packaging Type</p>
                  <Select value={packagingTypeFilter} onChange={(event) => setPackagingTypeFilter(event.target.value)}>
                    <option value="">All</option>
                    {packagingTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <DataTable
                columns={inventoryColumns}
                data={paginatedEntries}
                emptyMessage="No inventory entries match the selected filters."
              />

              {filteredEntries.length > 0 ? (
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
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}




