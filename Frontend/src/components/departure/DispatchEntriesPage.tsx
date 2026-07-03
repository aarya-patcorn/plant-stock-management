import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Pencil, Save } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataBadge, DataTable } from "@/components/ui/DataTable";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TooltipText } from "@/components/ui/tooltip-text";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  fetchDispatchEntries,
  fetchProductionMaterialLogs,
  type DispatchEntry,
  type ProductionMaterialLog,
  updateDispatchEntry,
} from "@/lib/api";
import LoadingLoader from "@/components/ui/LoadingLoader";
import {
  TableFiltersBar,
  type Filter,
  type FilterFieldConfig,
  createDateFilterField,
  createNumberFilterField,
  createSelectFilterField,
  createSelectOptions,
  createTextFilterField,
} from "@/components/ui/table-filters";
import { applyTableFilters } from "@/lib/tableFilters";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const EDIT_SHEET_ANIMATION_MS = 300;

function Field({
  children,
  className,
  htmlFor,
  label,
}: {
  children: ReactNode;
  className?: string;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function buildDispatchLabel(entry: DispatchEntry) {
  return [entry.productCategory, entry.productName, entry.productColor].filter(Boolean).join(" / ");
}

function normalizeTimeForInput(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(trimmedValue)) {
    return trimmedValue;
  }

  const match = trimmedValue.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return trimmedValue;
  }

  const hours = Number(match[1]) % 12 + (match[3].toUpperCase() === "PM" ? 12 : 0);
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

export function DispatchEntriesPage() {
  const [entries, setEntries] = useState<DispatchEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<DispatchEntry | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filters, setFilters] = useState<Filter[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [isUpdating, setIsUpdating] = useState(false);
  const [productionEntries, setProductionEntries] = useState<ProductionMaterialLog[]>([]);
  const editSheetCloseTimeoutRef = useRef<number | null>(null);

  const clearEditSheetCloseTimeout = () => {
    if (editSheetCloseTimeoutRef.current !== null) {
      window.clearTimeout(editSheetCloseTimeoutRef.current);
      editSheetCloseTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearEditSheetCloseTimeout();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    void fetchDispatchEntries()
      .then((dispatchEntries) => {
        if (!isMounted) {
          return;
        }

        setEntries(dispatchEntries);
        setLoadError("");
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setEntries([]);
        setLoadError(error instanceof Error ? error.message : "Unable to fetch dispatch entries.");
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

  useEffect(() => {
    let isMounted = true;

    void fetchProductionMaterialLogs()
      .then((entries) => {
        if (!isMounted) {
          return;
        }

        setProductionEntries(entries.filter((entry) => entry.productCategory && entry.productName));
      })
      .catch(() => {
        if (isMounted) {
          setProductionEntries([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedEntries = useMemo(
    () => [...entries].sort((left, right) => `${right.date} ${right.time}`.localeCompare(`${left.date} ${left.time}`)),
    [entries],
  );

  const filterFields = useMemo<FilterFieldConfig[]>(
    () => [
      createDateFilterField("date", "Date"),
      createTextFilterField("challan", "Challan"),
      createSelectFilterField("productCategory", "Category", createSelectOptions(entries.map((entry) => entry.productCategory))),
      createTextFilterField("productName", "Product"),
      createSelectFilterField("token", "Token", createSelectOptions(entries.map((entry) => entry.token))),
      createSelectFilterField("bagSize", "Bag Size", createSelectOptions(entries.map((entry) => entry.bagSize))),
      createNumberFilterField("totalBags", "Departed Bags"),
      createTextFilterField("dispatchSite", "Dispatch Site"),
      createTextFilterField("vehicleNo", "Vehicle No"),
      createSelectFilterField("user", "Entry By", createSelectOptions(entries.map((entry) => entry.user))),
    ],
    [entries],
  );

  const filteredEntries = useMemo(
    () =>
      applyTableFilters(
        sortedEntries,
        filters,
        {
          date: (entry) => entry.date,
          challan: (entry) => entry.challanNo || entry.challanName,
          productCategory: (entry) => entry.productCategory,
          productName: (entry) => entry.productName,
          token: (entry) => entry.token,
          bagSize: (entry) => entry.bagSize,
          totalBags: (entry) => entry.totalBags,
          dispatchSite: (entry) => entry.dispatchSite,
          vehicleNo: (entry) => entry.vehicleNo,
          user: (entry) => entry.user,
        },
        {
          date: "date",
          totalBags: "number",
        },
      ),
    [filters, sortedEntries],
  );

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const paginatedEntries = useMemo(
    () => filteredEntries.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, filteredEntries, pageSize],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startEditing = (entry: DispatchEntry) => {
    clearEditSheetCloseTimeout();
    setEditingEntry({
      ...entry,
      time: normalizeTimeForInput(entry.time),
      dispatchTime: normalizeTimeForInput(entry.dispatchTime),
    });
    setIsEditSheetOpen(true);
  };

  const updateEditingEntry = (updates: Partial<DispatchEntry>) => {
    setEditingEntry((current) => (current ? { ...current, ...updates } : current));
  };

  const closeEditSheet = () => {
    setIsEditSheetOpen(false);
    clearEditSheetCloseTimeout();
    editSheetCloseTimeoutRef.current = window.setTimeout(() => {
      setEditingEntry(null);
      editSheetCloseTimeoutRef.current = null;
    }, EDIT_SHEET_ANIMATION_MS);
  };

  const handleUpdate = async () => {
    if (!editingEntry) {
      return;
    }

    setIsUpdating(true);

    try {
      await updateDispatchEntry({
        ...editingEntry,
        productColor: editingEntry.productCategory === "Tile Cleaner" ? "" : editingEntry.productColor,
      });
      setEntries((current) =>
        current.map((entry) => (entry.id === editingEntry.id ? editingEntry : entry)),
      );
      closeEditSheet();
      toast.success("Dispatch entry updated successfully.");

      void fetchDispatchEntries()
        .then((dispatchEntries) => {
          setEntries(dispatchEntries);
          setLoadError("");
        })
        .catch(() => { });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update dispatch entry.");
    } finally {
      setIsUpdating(false);
    }
  };

  const productCategories = useMemo(
    () => Array.from(new Set(productionEntries.map((entry) => entry.productCategory))).filter(Boolean),
    [productionEntries],
  );

  const productNames = useMemo(
    () =>
      Array.from(
        new Set(
          productionEntries
            .filter((entry) => entry.productCategory === editingEntry?.productCategory)
            .map((entry) => entry.productName),
        ),
      ).filter(Boolean),
    [editingEntry?.productCategory, productionEntries],
  );

  const productColors = useMemo(
    () =>
      Array.from(
        new Set(
          productionEntries
            .filter(
              (entry) =>
                entry.productCategory === editingEntry?.productCategory &&
                entry.productName === editingEntry?.productName,
            )
            .map((entry) => entry.productColor),
        ),
      ).filter(Boolean),
    [editingEntry?.productCategory, editingEntry?.productName, productionEntries],
  );

  const isTileCleanerSelected = editingEntry?.productCategory === "Tile Cleaner";

  const tokenOptions = useMemo(
    () =>
      Array.from(
        new Set(
          productionEntries
            .filter(
              (entry) =>
                entry.productCategory === editingEntry?.productCategory &&
                entry.productName === editingEntry?.productName,
            )
            .map((entry) => entry.token),
        ),
      ).filter(Boolean),
    [editingEntry?.productCategory, editingEntry?.productName, productionEntries],
  );

  const bagSizes = useMemo(
    () =>
      Array.from(
        new Set(
          productionEntries
            .filter(
              (entry) =>
                entry.productCategory === editingEntry?.productCategory &&
                entry.productName === editingEntry?.productName &&
                (isTileCleanerSelected || entry.productColor === editingEntry?.productColor) &&
                (!editingEntry?.token || entry.token === editingEntry.token),
            )
            .map((entry) => entry.bagSize),
        ),
      ).filter(Boolean),
    [
      editingEntry?.bagSize,
      editingEntry?.productCategory,
      editingEntry?.productColor,
      editingEntry?.productName,
      editingEntry?.token,
      isTileCleanerSelected,
      productionEntries,
    ],
  );

  const selectedProductionEntry = useMemo(
    () =>
      productionEntries.find(
        (entry) =>
          entry.productCategory === editingEntry?.productCategory &&
          entry.productName === editingEntry?.productName &&
          (!editingEntry?.token || entry.token === editingEntry.token) &&
          (isTileCleanerSelected || entry.productColor === editingEntry?.productColor) &&
          entry.bagSize === editingEntry?.bagSize,
      ),
    [
      editingEntry?.bagSize,
      editingEntry?.productCategory,
      editingEntry?.productColor,
      editingEntry?.productName,
      editingEntry?.token,
      isTileCleanerSelected,
      productionEntries,
    ],
  );

  useEffect(() => {
    if (!selectedProductionEntry) {
      return;
    }

    setEditingEntry((current) =>
      current && current.quantity !== String(selectedProductionEntry.currentQuantity)
        ? { ...current, quantity: String(selectedProductionEntry.currentQuantity) }
        : current,
    );
  }, [selectedProductionEntry]);

  const dispatchColumns = useMemo<ColumnDef<DispatchEntry>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) =>
          row.original.date
            ? new Date(row.original.date).toLocaleDateString("en-GB").replace(/\//g, "-")
            : "-",
      },
      {
        accessorKey: "time",
        header: "Time",
        cell: ({ row }) => row.original.time || "-",
      },
      {
        id: "challan",
        accessorFn: (row) => row.challanNo || row.challanName || "",
        header: "Challan",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[160px] truncate" content={row.original.challanNo || row.original.challanName || "-"}>
            {row.original.challanNo || row.original.challanName || "-"}
          </TooltipText>
        ),
      },
      {
        id: "product",
        accessorFn: (row) => buildDispatchLabel(row),
        header: "Product",
        cell: ({ row }) => (
          <div className="min-w-[220px] max-w-[260px] space-y-1">
            <TooltipText as="p" className="truncate font-medium text-slate-900" content={buildDispatchLabel(row.original) || "-"}>
              {buildDispatchLabel(row.original) || "-"}
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
        accessorKey: "totalBags",
        header: "Departed Bags",
        cell: ({ row }) => row.original.totalBags || "-",
      },
      {
        accessorKey: "wastageQty",
        header: "Wastage Qty",
        cell: ({ row }) => row.original.wastageQty || "-",
      },
      {
        accessorKey: "vehicleNo",
        header: "Vehicle",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[140px] truncate" content={row.original.vehicleNo || "-"}>
            {row.original.vehicleNo || "-"}
          </TooltipText>
        ),
      },
      {
        accessorKey: "driverName",
        header: "Driver",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[140px] truncate" content={row.original.driverName || "-"}>
            {row.original.driverName || "-"}
          </TooltipText>
        ),
      },
      {
        accessorKey: "dispatchSite",
        header: "Dispatch Site",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[160px] truncate" content={row.original.dispatchSite || "-"}>
            {row.original.dispatchSite || "-"}
          </TooltipText>
        ),
      },
      {
        accessorKey: "user",
        header: "Entry By",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[160px] truncate" content={row.original.user || "-"}>
            {row.original.user || "-"}
          </TooltipText>
        ),
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[180px] truncate" content={row.original.remarks || "-"}>
            {row.original.remarks || "-"}
          </TooltipText>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-center gap-2">
            <Button size="icon" type="button" variant="outline" onClick={() => startEditing(row.original)}>
              <Pencil />
            </Button>
          </div>
        ),
      },
    ],
    [startEditing],
  );

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-white/70 bg-white/88 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <CardHeader className="gap-5 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Dispatch Register
            </p>
            <CardTitle className="text-3xl tracking-[-0.03em]">All dispatch entries</CardTitle>
            <CardDescription className="max-w-2xl">Review saved dispatch records, update shipment details, and manage departure tracking from one workspace.</CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link to="/product-departure">
              <ArrowLeft />
              Back to dispatch form
            </Link>
          </Button>
        </CardHeader>
      </Card>

      <Sheet open={isEditSheetOpen} onOpenChange={(open) => {
        if (open) {
          setIsEditSheetOpen(true);
          return;
        }

        closeEditSheet();
      }}>
        <SheetContent
          side="right"
          className="h-full w-full max-w-full overflow-hidden border-l border-slate-200 bg-white p-0 sm:w-[760px] sm:max-w-[760px] lg:w-[860px] lg:max-w-[860px]"
        >
          {editingEntry ? (
            <div className="flex h-full flex-col">
              <SheetHeader className="shrink-0 border-b border-slate-200/80 px-5 py-4 pr-12">
                <SheetTitle>Update Entry</SheetTitle>
                <SheetDescription>Update the selected dispatch record and save your changes.</SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-5 py-5">
                <div className="space-y-6">
                  <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-background/60 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Dispatch details</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Core dispatch identity, date, time, and token information.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <Field htmlFor="edit-date" label="Date">
                        <DatePickerInput
                          id="edit-date"
                          name="date"
                          value={editingEntry.date}
                          onChange={(value) =>
                            setEditingEntry((current) => current ? { ...current, date: value } : current)
                          }
                        />
                      </Field>
                      <Field htmlFor="edit-time" label="Time">
                        <Input
                          id="edit-time"
                          type="time"
                          value={editingEntry.time}
                          onChange={(event) =>
                            setEditingEntry((current) => current ? { ...current, time: event.target.value } : current)
                          }
                        />
                      </Field>
                      <Field htmlFor="edit-token" label="Token">
                        <Select
                          id="edit-token"
                          disabled
                          value={editingEntry.token}
                          onChange={(event) =>
                            updateEditingEntry({
                              token: event.target.value,
                              bagSize: "",
                              quantity: "",
                            })
                          }
                        >
                          <option value="">Select token type</option>
                          {tokenOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-background/60 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Product details</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Challan and product information for the dispatch record.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <Field htmlFor="edit-challanNo" label="Challan No">
                        <Input
                          id="edit-challanNo"
                          value={editingEntry.challanNo}
                          onChange={(event) =>
                            setEditingEntry((current) => current ? { ...current, challanNo: event.target.value } : current)
                          }
                        />
                      </Field>
                      <Field htmlFor="edit-productCategory" label="Product Category">
                        <Select
                          id="edit-productCategory"
                          disabled
                          value={editingEntry.productCategory}
                          onChange={(event) =>
                            updateEditingEntry({
                              productCategory: event.target.value,
                              productName: "",
                              token: "",
                              productColor: "",
                              bagSize: "",
                              quantity: "",
                            })
                          }
                        >
                          <option value="">Select category</option>
                          {productCategories.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field htmlFor="edit-productName" label="Product Name">
                        <Select
                          id="edit-productName"
                          disabled
                          value={editingEntry.productName}
                          onChange={(event) =>
                            updateEditingEntry({
                              productName: event.target.value,
                              token: "",
                              productColor: "",
                              bagSize: "",
                              quantity: "",
                            })
                          }
                        >
                          <option value="">Select product</option>
                          {productNames.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field htmlFor="edit-productColor" label="Product Color">
                        <Select
                          id="edit-productColor"
                          disabled
                          value={isTileCleanerSelected ? "" : editingEntry.productColor}
                          onChange={(event) =>
                            updateEditingEntry({
                              productColor: event.target.value,
                              bagSize: "",
                              quantity: "",
                            })
                          }
                        >
                          <option value="">
                            {isTileCleanerSelected ? "Not applicable for Tile Cleaner" : "Select color"}
                          </option>
                          {productColors.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-background/60 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Quantity details</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Bag size, stock values, and dispatch destination details.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <Field htmlFor="edit-bagSize" label="Bag Size">
                        <Select
                          id="edit-bagSize"
                          disabled
                          value={editingEntry.bagSize}
                          onChange={(event) =>
                            updateEditingEntry({
                              bagSize: event.target.value,
                            })
                          }
                        >
                          <option value="">Select bag size</option>
                          {bagSizes.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field htmlFor="edit-quantity" label="Stock">
                        <Input
                          id="edit-quantity"
                          disabled
                          value={editingEntry.quantity}
                          onChange={(event) =>
                            setEditingEntry((current) => current ? { ...current, quantity: event.target.value } : current)
                          }
                        />
                      </Field>
                      <Field htmlFor="edit-totalBags" label="Departed Bags">
                        <Input
                          id="edit-totalBags"
                          disabled
                          value={editingEntry.totalBags}
                          onChange={(event) =>
                            setEditingEntry((current) => current ? { ...current, totalBags: event.target.value } : current)
                          }
                        />
                      </Field>
                      <Field htmlFor="edit-wastageQty" label="Wastage Quantity">
                        <Input
                          id="edit-wastageQty"
                          inputMode="decimal"
                          step="any"
                          type="number"
                          value={editingEntry.wastageQty}
                          onChange={(event) =>
                            setEditingEntry((current) => current ? { ...current, wastageQty: event.target.value } : current)
                          }
                        />
                      </Field>
                      <Field htmlFor="edit-dispatchSite" label="Dispatch Site">
                        <Input
                          id="edit-dispatchSite"
                          value={editingEntry.dispatchSite}
                          onChange={(event) =>
                            setEditingEntry((current) => current ? { ...current, dispatchSite: event.target.value } : current)
                          }
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-background/60 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Transport details</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Vehicle, driver, challan, and dispatch execution details.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <Field htmlFor="edit-vehicleNo" label="Vehicle No">
                        <Input
                          id="edit-vehicleNo"
                          value={editingEntry.vehicleNo}
                          onChange={(event) =>
                            setEditingEntry((current) => current ? { ...current, vehicleNo: event.target.value } : current)
                          }
                        />
                      </Field>
                      <Field htmlFor="edit-driverName" label="Driver Name">
                        <Input
                          id="edit-driverName"
                          value={editingEntry.driverName}
                          onChange={(event) =>
                            setEditingEntry((current) => current ? { ...current, driverName: event.target.value } : current)
                          }
                        />
                      </Field>
                      <Field htmlFor="edit-driverContact" label="Driver Contact">
                        <Input
                          id="edit-driverContact"
                          value={editingEntry.driverContact}
                          onChange={(event) =>
                            setEditingEntry((current) => current ? { ...current, driverContact: event.target.value } : current)
                          }
                        />
                      </Field>
                      <Field htmlFor="edit-challanName" label="Challan Name">
                        <Input
                          id="edit-challanName"
                          value={editingEntry.challanName}
                          onChange={(event) =>
                            setEditingEntry((current) => current ? { ...current, challanName: event.target.value } : current)
                          }
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-background/60 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Schedule notes</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Dispatch timing and local notes for update support.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field htmlFor="edit-dispatchTime" label="Dispatch Time">
                        <Input
                          id="edit-dispatchTime"
                          type="time"
                          value={editingEntry.dispatchTime}
                          onChange={(event) =>
                            setEditingEntry((current) => current ? { ...current, dispatchTime: event.target.value } : current)
                          }
                        />
                      </Field>
                      <Field htmlFor="edit-todayVehicleNo" label="Today Vehicle No">
                        <Input
                          id="edit-todayVehicleNo"
                          value={editingEntry.todayVehicleNo}
                          onChange={(event) =>
                            setEditingEntry((current) => current ? { ...current, todayVehicleNo: event.target.value } : current)
                          }
                        />
                      </Field>
                    </div>

                    <Field htmlFor="edit-remarks" label="Remarks">
                      <Textarea
                        id="edit-remarks"
                        value={editingEntry.remarks}
                        placeholder="Add dispatch remarks"
                        onChange={(event) =>
                          setEditingEntry((current) => current ? { ...current, remarks: event.target.value } : current)
                        }
                      />
                    </Field>
                  </div>
                </div>
              </div>

              <SheetFooter className="shrink-0 border-t border-slate-200/80 bg-white px-5 py-4">
                <Button onClick={closeEditSheet} type="button" variant="outline">
                  Cancel
                </Button>
                <Button disabled={isUpdating} onClick={handleUpdate} type="button">
                  <Save />
                  {isUpdating ? "Saving Changes..." : "Save Changes"}
                </Button>
              </SheetFooter>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Card className="overflow-hidden border-white/70 bg-white/88 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <CardHeader className="gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end sm:justify-between sm:space-y-0">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Records
            </p>
            <CardTitle className="mt-2">Saved entries</CardTitle>
            <CardDescription>
              {isLoading
                ? "Loading dispatch entries from sheet..."
                : sortedEntries.length === 0
                  ? "No dispatch entries have been saved yet."
                  : `${sortedEntries.length} dispatch entries available.`}
            </CardDescription>
          </div>
          <div className="rounded-xl border border-slate-200 bg-background/70 px-3 py-2 text-sm font-medium text-muted-foreground">
            {isLoading ? "Loading..." : `${filteredEntries.length} total`}
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {!isLoading && !loadError && sortedEntries.length > 0 ? (
            <div className="mb-5">
              <TableFiltersBar fields={filterFields} filters={filters} onChange={setFilters} />
            </div>
          ) : null}

          {loadError ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-destructive">
              {loadError}
            </div>
          ) : isLoading ? (
            <div className="flex justify-center rounded-md border border-dashed p-6">
              <LoadingLoader />
            </div>
          ) : sortedEntries.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Add a dispatch entry first, then review it here.
            </div>
          ) : (
            <>
              <div className="space-y-4 lg:hidden">
                {paginatedEntries.map((entry) => (
                  <Card key={entry.id} className="rounded-md border shadow-none">
                    <CardContent className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{buildDispatchLabel(entry) || "Dispatch entry"}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{entry.challanNo || entry.id}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            type="button"
                            variant="outline"
                            onClick={() => startEditing(entry)}
                          >
                            <Pencil />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Date</p>
                          <p className="mt-1">{entry.date
                            ? new Date(entry.date).toLocaleDateString("en-GB").replace(/\//g, "-")
                            : "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Time</p>
                          <p className="mt-1">{entry.time || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Token</p>
                          <p className="mt-1">{entry.token || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Bag Size</p>
                          <p className="mt-1">{entry.bagSize || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Stock</p>
                          <p className="mt-1">{entry.quantity || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Departed Bags</p>
                          <p className="mt-1">{entry.totalBags || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Wastage Qty</p>
                          <p className="mt-1">{entry.wastageQty || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Remarks</p>
                          <p className="mt-1">{entry.remarks || "-"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Vehicle</p>
                          <p className="mt-1">{entry.vehicleNo || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Site</p>
                          <p className="mt-1">{entry.dispatchSite || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Entry By</p>
                          <p className="mt-1">{entry.user || "-"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="hidden lg:block">
                <DataTable
                  columns={dispatchColumns}
                  data={paginatedEntries}
                  emptyMessage="No dispatch entries available."
                />
              </div>
            </>
          )}

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
        </CardContent>
      </Card>
    </div>
  );
}









