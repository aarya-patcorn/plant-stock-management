import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { fetchInventory, type InventoryEntry } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataBadge, DataTable } from "@/components/ui/DataTable";
import { TooltipText } from "@/components/ui/tooltip-text";
import LoadingLoader from "@/components/ui/LoadingLoader";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "../ui/pagination";
import {
  TableFiltersBar,
  type Filter,
  type FilterFieldConfig,
  createNumberFilterField,
  createSelectFilterField,
  createSelectOptions,
  createTextFilterField,
} from "@/components/ui/table-filters";
import { applyTableFilters } from "@/lib/tableFilters";
import { mapRawMaterialAlertRow, type RawMaterialAlertRow } from "@/pages/dashboard/components/InventoryAlerts";

function buildInventoryLabel(entry: InventoryEntry) {
  return [entry.level2, entry.level3, entry.level4, entry.sandEpoxyColor]
    .filter(Boolean)
    .join(" / ");
}

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

function renderTextCell(value: string, className = "block max-w-[220px] truncate") {
  const text = value.trim();

  if (!text || text === "-") {
    return "";
  }

  return (
    <TooltipText as="span" className={className} content={text}>
      {text}
    </TooltipText>
  );
}

export function InventoryEntriesPage() {
  const [entries, setEntries] = useState<InventoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [rawMaterialFilter, setRawMaterialFilter] = useState("");
  const [packagingTypeFilter, setPackagingTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [tableFilters, setTableFilters] = useState<Filter[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

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

  const sortedEntries = useMemo(() => [...entries], [entries]);

  const rawMaterialOptions = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.rawMaterialName).filter(Boolean))),
    [entries],
  );

  const packagingTypeOptions = useMemo(() => {
    if (!rawMaterialFilter) {
      return [];
    }

    return Array.from(
      new Set(
        entries
          .filter((entry) => entry.rawMaterialName === rawMaterialFilter)
          .map((entry) => entry.packagingType)
          .filter(Boolean),
      ),
    );
  }, [entries, rawMaterialFilter]);

  const filteredEntries = useMemo(
    () =>
      sortedEntries.filter(
        (entry) =>
          (!rawMaterialFilter || entry.rawMaterialName === rawMaterialFilter) &&
          (!packagingTypeFilter || entry.packagingType === packagingTypeFilter),
      ),
    [packagingTypeFilter, rawMaterialFilter, sortedEntries],
  );

  const searchedEntries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return filteredEntries;
    }

    return filteredEntries.filter((entry) => {
      const searchableValues = [
        buildInventoryLabel(entry),
        entry.rawMaterialName,
        entry.packagingType,
        entry.level2,
        entry.level3,
        entry.level4,
        entry.packagingBagColor,
        entry.bagColor,
        entry.sandEpoxyColor,
        entry.coupon,
        entry.unit,
        entry.purchaseStock,
        entry.usedInProduction,
        entry.currentStock,
      ];

      return searchableValues.some((value) => String(value ?? "").toLowerCase().includes(normalizedQuery));
    });
  }, [filteredEntries, searchQuery]);

  const mappedEntries = useMemo<RawMaterialAlertRow[]>(
    () => searchedEntries.map(mapRawMaterialAlertRow),
    [searchedEntries],
  );

  const tableFilterFields = useMemo<FilterFieldConfig[]>(
    () => [
      createTextFilterField("rawMaterialName", "Raw Material"),
      createTextFilterField("packagingType", "Packaging Type"),
      createTextFilterField("productName", "Product Name"),
      createTextFilterField("color", "Color"),
      createNumberFilterField("quantity", "Quantity"),
      createSelectFilterField(
        "rawMaterialCategory",
        "Category",
        createSelectOptions(mappedEntries.map((row) => row.rawMaterialName)),
      ),
    ],
    [mappedEntries],
  );

  const filteredTableEntries = useMemo(
    () =>
      applyTableFilters(
        mappedEntries,
        tableFilters,
        {
          rawMaterialName: (row) => row.rawMaterialName,
          packagingType: (row) => row.packagingType,
          productName: (row) => row.productName,
          color: (row) => row.color,
          quantity: (row) => row.quantity,
          unit: (row) => row.unit,
          rawMaterialCategory: (row) => row.rawMaterialName,
        },
        {
          quantity: "number",
        },
      ),
    [mappedEntries, tableFilters],
  );

  const totalPages = Math.max(1, Math.ceil(filteredTableEntries.length / pageSize));

  const paginatedEntries = useMemo(
    () => filteredTableEntries.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, filteredTableEntries, pageSize],
  );

  useEffect(() => {
    setPackagingTypeFilter("");
  }, [rawMaterialFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [packagingTypeFilter, rawMaterialFilter, searchQuery, tableFilters, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const inventoryColumns = useMemo<ColumnDef<RawMaterialAlertRow>[]>(
    () => [
      {
        accessorKey: "rawMaterialName",
        header: "Raw Material Name",
        cell: ({ row }) =>
          row.original.rawMaterialName ? <DataBadge type="rawMaterialName">{row.original.rawMaterialName}</DataBadge> : "-",
      },
      {
        accessorKey: "packagingType",
        header: "Packaging Type",
        cell: ({ row }) => renderTextCell(row.original.packagingType, "block max-w-[180px] truncate") || "-",
      },
      {
        accessorKey: "productName",
        header: "Product Name",
        cell: ({ row }) => renderTextCell(row.original.productName) || "-",
      },
      {
        accessorKey: "color",
        header: "Color",
        cell: ({ row }) => (row.original.color ? <DataBadge type="color">{row.original.color}</DataBadge> : "-"),
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) => (
          <div className="flex justify-end items-center gap-2">
            <span>{row.original.quantity}</span>
            {row.original.unit ? (
              <DataBadge type="unit">{row.original.unit}</DataBadge>
            ) : null}
          </div>
        ),
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
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div>
            <CardTitle>Inventory list</CardTitle>
            <CardDescription>
              {isLoading
                ? "Loading inventory from sheet..."
                : filteredTableEntries.length === 0
                  ? "No inventory entries found."
                  : `${filteredTableEntries.length} inventory entries available.`}
            </CardDescription>
          </div>
          <TableFiltersBar fields={tableFilterFields} filters={tableFilters} onChange={setTableFilters} className="shrink-0" />
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
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Search</p>
                  <Input
                    placeholder="Search inventory..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>
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
                  <Select value={packagingTypeFilter} onChange={(event) => setPackagingTypeFilter(event.target.value)} disabled={!rawMaterialFilter}>
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
                emptyMessage="No inventory entries found."
              />

              {!isLoading && !loadError && sortedEntries.length > 0 ? (
                <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">Rows per page</span>
                    <Select
                      value={String(pageSize)}
                      onChange={(event) => {
                        setPageSize(Number(event.target.value));
                        setCurrentPage(1);
                      }}
                      className="w-[88px]"
                    >
                      {PAGE_SIZE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <Pagination className="w-auto justify-start sm:justify-end">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          type="button"
                          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                          disabled={currentPage === 1}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          type="button"
                          onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                          disabled={currentPage === totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


