import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Pencil, Plus, Save, Trash2 } from "lucide-react";
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
  fetchManufacturingEntries,
  type ManufacturingEntry,
  updateManufacturingEntry,
} from "@/lib/api";
import {
  epoxyColors,
  epoxyProductColorMap,
  epoxyProducts,
  groutProductColorMap,
  groutProducts,
} from "@/components/manufacturing/manufacturingData";
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
const batchOptions = ["1TPH", "2TPH", "Manual Blender", "Sigma Mixer", "Manual Hand Mixer", "Other"];
const productCategories = ["Tile Adhesive", "Bondure", "Epoxy", "Grout", "Tile Cleaner", "Other"];
const groutColors = ["Black", "White", "Ivory", "Coffee Brown", "Grey", "Light Grey", "Green", "Blue", "Red", "Yellow"];
const tileAdhesiveWhiteProducts = ["K60", "K80", "K90", "Kamdhenu X"];
const tileAdhesiveGreyProducts = ["K50", "K60", "K80", "K90", "Kamdhenu X"];
const tileCleanerProducts = ["ShineX", "CrystalX"];

const getBatchDefaults = (tphBatch: string) => {
  switch (tphBatch) {
    case "1TPH":
      return { productCategory: "Tile Adhesive", color: "White" };
    case "2TPH":
      return { productCategory: "", color: "Grey" };
    case "Manual Blender":
      return { productCategory: "Grout", color: "" };
    case "Sigma Mixer":
      return { productCategory: "Epoxy", color: "" };
    case "Manual Hand Mixer":
      return { productCategory: "Tile Cleaner", color: "" };
    default:
      return { productCategory: "", color: "" };
  }
};

const getTotalBagsProduced = (tphBatch: string, bagSize: string) => {
  if (tphBatch === "2TPH" && bagSize === "20kg") return "50";
  if (tphBatch === "2TPH" && bagSize === "50kg") return "20";
  if (tphBatch === "1TPH" && bagSize === "20kg") return "25";
  if (tphBatch === "1TPH" && bagSize === "50kg") return "10";
  return "";
};

const emptyProductItem = {
  token: "",
  bagSize: "",
  totalBagsProduced: "",
};

function getProductItems(entry: ManufacturingEntry) {
  return entry.productItems.length > 0 ? entry.productItems : [emptyProductItem];
}

function formatProductItems(entry: ManufacturingEntry) {
  const productItems = getProductItems(entry);

  return productItems
    .map((item, index) =>
      [
        item.token,
        item.bagSize,
        item.totalBagsProduced ? `${item.totalBagsProduced} qty` : "",
      ].filter(Boolean).join(" / "),
    )
    .join(", ");
}

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

function buildManufacturingLabel(entry: ManufacturingEntry) {
  return [entry.productCategory, entry.finishedProductName, entry.color].filter(Boolean).join(" / ");
}

export function ManufacturingEntriesPage() {
  const [entries, setEntries] = useState<ManufacturingEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<ManufacturingEntry | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filters, setFilters] = useState<Filter[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [isUpdating, setIsUpdating] = useState(false);
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

    void fetchManufacturingEntries()
      .then((manufacturingEntries) => {
        if (!isMounted) {
          return;
        }

        setEntries(manufacturingEntries);
        setLoadError("");
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setEntries([]);
        setLoadError(error instanceof Error ? error.message : "Unable to fetch production entries.");
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
        `${right.productionDate} ${right.batchNo}`.localeCompare(`${left.productionDate} ${left.batchNo}`),
      ),
    [entries],
  );

  const filterFields = useMemo<FilterFieldConfig[]>(
    () => [
      createDateFilterField("productionDate", "Date"),
      createTextFilterField("batchNo", "Batch No"),
      createSelectFilterField("tphBatch", "Batch Type", createSelectOptions(entries.map((entry) => entry.tphBatch))),
      createSelectFilterField("productCategory", "Category", createSelectOptions(entries.map((entry) => entry.productCategory))),
      createTextFilterField("finishedProductName", "Product"),
      createTextFilterField("token", "Token"),
      createSelectFilterField("color", "Color", createSelectOptions(entries.map((entry) => entry.color))),
      createNumberFilterField("totalBagsProduced", "Total Quantity"),
      createNumberFilterField("wastageQty", "Wastage"),
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
          productionDate: (entry) => entry.productionDate,
          batchNo: (entry) => entry.batchNo,
          tphBatch: (entry) => entry.tphBatch,
          productCategory: (entry) => entry.productCategory,
          finishedProductName: (entry) => entry.finishedProductName,
          token: (entry) => entry.token,
          color: (entry) => entry.color,
          totalBagsProduced: (entry) => entry.totalBagsProduced,
          wastageQty: (entry) => entry.wastageQty,
          user: (entry) => entry.user,
        },
        {
          productionDate: "date",
          totalBagsProduced: "number",
          wastageQty: "number",
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

  const startEditing = (entry: ManufacturingEntry) => {
    clearEditSheetCloseTimeout();
    setEditingEntry(entry);
    setIsEditSheetOpen(true);
  };

  const updateEditingEntry = (updates: Partial<ManufacturingEntry>) => {
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

  const updateEditingProductItem = (
    index: number,
    field: "token" | "bagSize" | "totalBagsProduced",
    value: string,
  ) => {
    setEditingEntry((current) => {
      if (!current) return current;

      const productItems = getProductItems(current).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      );
      const totalBagsProduced = String(
        productItems.reduce((sum, item) => sum + (Number(item.totalBagsProduced) || 0), 0),
      );

      return {
        ...current,
        productItems,
        totalBagsProduced,
        token: productItems.map((item) => item.token).filter(Boolean).join(", "),
        bagSize: productItems.map((item) => item.bagSize).filter(Boolean).join(", "),
      };
    });
  };

  const removeEditingProductItem = (index: number) => {
    setEditingEntry((current) => {
      if (!current) return current;

      const productItems = getProductItems(current).filter((_, itemIndex) => itemIndex !== index);
      const nextProductItems = productItems.length > 0 ? productItems : [emptyProductItem];
      const totalBagsProduced = String(
        nextProductItems.reduce((sum, item) => sum + (Number(item.totalBagsProduced) || 0), 0),
      );

      return {
        ...current,
        productItems: nextProductItems,
        totalBagsProduced,
        token: nextProductItems.map((item) => item.token).filter(Boolean).join(", "),
        bagSize: nextProductItems.map((item) => item.bagSize).filter(Boolean).join(", "),
      };
    });
  };

  const handleUpdate = async () => {
    if (!editingEntry) {
      return;
    }

    setIsUpdating(true);

    try {
      const productItems = getProductItems(editingEntry).filter(
        (item) => item.token || item.bagSize || item.totalBagsProduced,
      );
      const updatedEntry = {
        ...editingEntry,
        productItems,
        token: productItems.map((item) => item.token).filter(Boolean).join(", "),
        bagSize: productItems.map((item) => item.bagSize).filter(Boolean).join(", "),
        totalBagsProduced: String(
          productItems.reduce((sum, item) => sum + (Number(item.totalBagsProduced) || 0), 0),
        ),
      };

      await updateManufacturingEntry(updatedEntry);
      setEntries((current) =>
        current.map((entry) => (entry.id === editingEntry.id ? updatedEntry : entry)),
      );
      closeEditSheet();
      toast.success("Production entry updated successfully.");

      void fetchManufacturingEntries()
        .then((manufacturingEntries) => {
          setEntries(manufacturingEntries);
          setLoadError("");
        })
        .catch(() => { });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update production entry.");
    } finally {
      setIsUpdating(false);
    }
  };

  const selectedProductCategory = editingEntry?.productCategory ?? "";
  const selectedColor =
    editingEntry?.tphBatch === "1TPH"
      ? "White"
      : editingEntry?.tphBatch === "2TPH"
        ? "Grey"
        : editingEntry?.color ?? "";
  const isTileAdhesiveProduct = selectedProductCategory === "Tile Adhesive";
  const productCategoryOptions = editingEntry?.tphBatch === "2TPH"
    ? ["Tile Adhesive", "Bondure", "Other"]
    : productCategories;
  const isProductCategoryLocked = Boolean(
    editingEntry?.tphBatch &&
    ["1TPH", "Manual Blender", "Sigma Mixer", "Manual Hand Mixer"].includes(editingEntry.tphBatch),
  );
  const colorOptions =
    editingEntry?.tphBatch === "Manual Blender"
      ? groutColors
      : editingEntry?.tphBatch === "Sigma Mixer"
        ? epoxyColors
        : [];
  const isColorDisabled = Boolean(
    editingEntry?.tphBatch &&
    (["1TPH", "2TPH", "Manual Hand Mixer"].includes(editingEntry.tphBatch) ||
      isTileAdhesiveProduct ||
      selectedProductCategory === "Grout"),
  );
  const finishedProductOptions =
    editingEntry?.tphBatch === "Manual Hand Mixer"
      ? tileCleanerProducts
      : selectedProductCategory === "Grout"
        ? groutProducts
        : selectedProductCategory === "Epoxy"
          ? epoxyProducts
          : isTileAdhesiveProduct && selectedColor === "White"
            ? tileAdhesiveWhiteProducts
            : isTileAdhesiveProduct && selectedColor === "Grey"
              ? tileAdhesiveGreyProducts
              : [];
  const bagSizeLabel =
    selectedProductCategory === "Epoxy"
      ? "Bucket Size"
      : selectedProductCategory === "Tile Cleaner"
        ? "Can Size"
        : selectedProductCategory === "Grout"
          ? "Pouch Size"
          : "Bag Size";
  const totalProducedLabel =
    editingEntry?.tphBatch === "Manual Blender"
      ? "Total Pouch"
      : editingEntry?.tphBatch === "Sigma Mixer"
        ? "Total Bucket"
        : editingEntry?.tphBatch === "Manual Hand Mixer"
          ? "Total Can"
          : "Total Bags";

  const manufacturingColumns = useMemo<ColumnDef<ManufacturingEntry>[]>(
    () => [
      {
        accessorKey: "productionDate",
        header: "Date",
        cell: ({ row }) =>
          row.original.productionDate
            ? new Date(row.original.productionDate).toLocaleDateString("en-GB").replace(/\//g, "-")
            : "-",
      },
      {
        accessorKey: "batchNo",
        header: "Batch No",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[140px] truncate" content={row.original.batchNo || "N/A"}>
            {row.original.batchNo || "N/A"}
          </TooltipText>
        ),
      },
      {
        accessorKey: "tphBatch",
        header: "Batch Type",
        cell: ({ row }) => row.original.tphBatch || "N/A",
      },
      {
        accessorKey: "productCategory",
        header: "Category",
        cell: ({ row }) =>
          row.original.productCategory ? (
            <DataBadge type="productCategory">{row.original.productCategory}</DataBadge>
          ) : (
            "N/A"
          ),
      },
      {
        accessorKey: "finishedProductName",
        header: "Product",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[220px] truncate" content={row.original.finishedProductName || "N/A"}>
            {row.original.finishedProductName || "N/A"}
          </TooltipText>
        ),
      },
      {
        accessorKey: "token",
        header: "Token",
        cell: ({ row }) =>
          row.original.token ? <DataBadge type="token">{row.original.token}</DataBadge> : "N/A",
      },
      {
        accessorKey: "color",
        header: "Color",
        cell: ({ row }) =>
          row.original.color ? <DataBadge type="color">{row.original.color}</DataBadge> : "N/A",
      },
      {
        accessorKey: "bagSize",
        header: "Bag Size",
        cell: ({ row }) => row.original.bagSize || "N/A",
      },
      {
        accessorKey: "totalBagsProduced",
        header: "Total Quantity",
        cell: ({ row }) => `${row.original.totalBagsProduced} qty` || "N/A",
      },
      {
        id: "rawMaterials",
        accessorFn: (row) => [row.rawMaterialNames, row.rawMaterialQty, row.rawMaterialUnits].filter(Boolean).join(" / "),
        header: "Raw Materials",
        cell: ({ row }) => {
          const value = [row.original.rawMaterialNames, row.original.rawMaterialQty, row.original.rawMaterialUnits]
            .filter(Boolean)
            .join(" / ");
          return (
            <TooltipText as="span" className="block max-w-[220px] truncate" content={value || "N/A"}>
              {value || "N/A"}
            </TooltipText>
          );
        },
      },
      {
        accessorKey: "user",
        header: "Entry By",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[220px] truncate" content={row.original.user || "N/A"}>
            {row.original.user || "N/A"}
          </TooltipText>
        ),
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[220px] truncate" content={row.original.remarks || "N/A"}>
            {row.original.remarks || "N/A"}
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
                <SheetDescription>Update the selected production record and save your changes.</SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-5 py-5">
                <div className="space-y-6">
                  <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-background/60 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Batch details</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Batch identity, production date, and core run information.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <Field htmlFor="edit-productionDate" label="Production Date">
                        <DatePickerInput
                          id="edit-productionDate"
                          name="productionDate"
                          value={editingEntry.productionDate}
                          onChange={(value) => updateEditingEntry({ productionDate: value })}
                        />
                      </Field>
                      <Field htmlFor="edit-tphBatch" label="TPH / Batch">
                        <Select
                          id="edit-tphBatch"
                          disabled
                          value={editingEntry.tphBatch}
                          onChange={(event) => {
                            const tphBatch = event.target.value;
                            const defaults = getBatchDefaults(tphBatch);
                            updateEditingEntry({
                              tphBatch,
                              productCategory: defaults.productCategory,
                              color: defaults.color,
                              finishedProductName: "",
                              bagSize: "",
                              token: defaults.productCategory === "Tile Adhesive" ? "" : "N/A",
                              totalBagsProduced: "",
                              productItems: [emptyProductItem],
                            });
                          }}
                        >
                          <option value="">Select TPH/Batch</option>
                          {batchOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field htmlFor="edit-batchNo" label="Batch No">
                        <Input
                          id="edit-batchNo"
                          value={editingEntry.batchNo}
                          onChange={(event) =>
                            updateEditingEntry({ batchNo: event.target.value })
                          }
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-background/60 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Product details</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Category, finished product, color, token, and packaging size.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <Field htmlFor="edit-productCategory" label="Product Category">
                        <Select
                          id="edit-productCategory"
                          value={editingEntry.productCategory}
                          disabled
                          onChange={(event) => {
                            const productCategory = event.target.value;
                            updateEditingEntry({
                              productCategory,
                              color: editingEntry.tphBatch === "2TPH" ? "Grey" : "",
                              finishedProductName: "",
                              bagSize: "",
                              token: productCategory === "Tile Adhesive" ? "" : "N/A",
                              totalBagsProduced: "",
                              productItems: [emptyProductItem],
                            });
                          }}
                        >
                          <option value="">Select category</option>
                          {productCategoryOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field htmlFor="edit-finishedProductName" label="Finished Product Name">
                        {finishedProductOptions.length > 0 ? (
                          <Select
                            id="edit-finishedProductName"
                            disabled
                            value={editingEntry.finishedProductName}
                            onChange={(event) => {
                              const finishedProductName = event.target.value;
                              const nextColor =
                                selectedProductCategory === "Grout"
                                  ? groutProductColorMap[finishedProductName] || editingEntry.color
                                  : selectedProductCategory === "Epoxy"
                                    ? epoxyProductColorMap[finishedProductName] || editingEntry.color
                                    : editingEntry.color;
                              updateEditingEntry({
                                finishedProductName,
                                color: nextColor,
                              });
                            }}
                          >
                            <option value="">Select finished product</option>
                            {finishedProductOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                            <option value="Other">Other</option>
                          </Select>
                        ) : (
                          <Input
                            id="edit-finishedProductName"
                            value={editingEntry.finishedProductName}
                            onChange={(event) => updateEditingEntry({ finishedProductName: event.target.value })}
                          />
                        )}
                      </Field>
                      <Field htmlFor="edit-color" label="Color">
                        {colorOptions.length > 0 || isColorDisabled ? (
                          <Select
                            id="edit-color"
                            value={selectedColor}
                            disabled={isColorDisabled}
                            onChange={(event) => updateEditingEntry({ color: event.target.value })}
                          >
                            <option value="">Select color</option>
                            {isColorDisabled && selectedColor ? (
                              <option value={selectedColor}>{selectedColor}</option>
                            ) : null}
                            {colorOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                            {!isColorDisabled && <option value="Other">Other</option>}
                          </Select>
                        ) : (
                          <Input
                            id="edit-color"
                            value={selectedColor}
                            onChange={(event) => updateEditingEntry({ color: event.target.value })}
                          />
                        )}
                      </Field>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-background/60 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Finished product items</h3>
                        <p className="mt-1 text-xs text-muted-foreground">Token, bag size, and quantity rows stored in productItems.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {getProductItems(editingEntry).map((item, index) => (
                        <div key={index} className="rounded-xl border border-slate-200/80 bg-background/70 p-4">
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <h4 className="text-sm font-semibold text-foreground">Product Item {index + 1}</h4>
                            {getProductItems(editingEntry).length > 1 && (
                              <Button
                                onClick={() => removeEditingProductItem(index)}
                                size="icon"
                                type="button"
                                variant="outline"
                              >
                                <Trash2 />
                              </Button>
                            )}
                          </div>

                          <div className="grid gap-4 md:grid-cols-3">
                            <Field htmlFor={`edit-token-${index}`} label="Token">
                              <Select
                                id={`edit-token-${index}`}
                                value={item.token}
                                onChange={(event) => updateEditingProductItem(index, "token", event.target.value)}
                              >
                                {isTileAdhesiveProduct ? (
                                  <>
                                    <option value="">Select token</option>
                                    <option value="Coupon">Coupon</option>
                                    <option value="Non-Coupon">Non-Coupon</option>
                                  </>
                                ) : (
                                  <option value="N/A">N/A</option>
                                )}
                              </Select>
                            </Field>

                            <Field htmlFor={`edit-bagSize-${index}`} label={bagSizeLabel}>
                              <Select
                                id={`edit-bagSize-${index}`}
                                value={item.bagSize}
                                disabled
                                onChange={(event) => {
                                  const bagSize = event.target.value;
                                  updateEditingProductItem(index, "bagSize", bagSize);

                                  const defaultTotal = getTotalBagsProduced(editingEntry.tphBatch, bagSize);
                                  if (defaultTotal) {
                                    updateEditingProductItem(index, "totalBagsProduced", defaultTotal);
                                  }
                                }}
                              >
                                <option value="">Select {bagSizeLabel}</option>
                                {selectedProductCategory === "Bondure" && <option value="40kg">40KG</option>}
                                {selectedProductCategory === "Epoxy" && (
                                  <>
                                    <option value="1kg">1KG</option>
                                    <option value="5kg">5KG</option>
                                  </>
                                )}
                                {selectedProductCategory === "Grout" && <option value="Pouch 1KG">1KG</option>}
                                {selectedProductCategory === "Tile Cleaner" && (
                                  <>
                                    <option value="1L">1L</option>
                                    <option value="5L">5L</option>
                                  </>
                                )}
                                {!["Bondure", "Epoxy", "Grout", "Tile Cleaner"].includes(selectedProductCategory) && (
                                  <>
                                    <option value="20kg">20KG</option>
                                    <option value="50kg">50KG</option>
                                  </>
                                )}
                              </Select>
                            </Field>

                            <Field htmlFor={`edit-totalBagsProduced-${index}`} label={totalProducedLabel}>
                              <Input
                                id={`edit-totalBagsProduced-${index}`}
                                disabled
                                min="0"
                                type="number"
                                value={item.totalBagsProduced}
                                onChange={(event) => updateEditingProductItem(index, "totalBagsProduced", event.target.value)}
                              />
                            </Field>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Field htmlFor="edit-wastageQty" label="Wastage">
                      <Input
                        id="edit-wastageQty"
                        disabled
                        min="0"
                        step="0.01"
                        type="number"
                        value={editingEntry.wastageQty}
                        onChange={(event) =>
                          updateEditingEntry({ wastageQty: event.target.value })
                        }
                      />
                    </Field>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-background/60 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Raw material summary</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Materials, quantities, and units used in this production entry.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field htmlFor="edit-rawMaterialNames" label="Raw Material Names">
                        <Textarea
                          id="edit-rawMaterialNames"
                          disabled
                          value={editingEntry.rawMaterialNames}
                          onChange={(event) =>
                            updateEditingEntry({ rawMaterialNames: event.target.value })
                          }
                        />
                      </Field>
                      <Field htmlFor="edit-rawMaterialQty" label="Raw Material Qty">
                        <Textarea
                          id="edit-rawMaterialQty"
                          disabled
                          value={editingEntry.rawMaterialQty}
                          onChange={(event) =>
                            updateEditingEntry({ rawMaterialQty: event.target.value })
                          }
                        />
                      </Field>
                      <Field htmlFor="edit-rawMaterialUnits" label="Raw Material Units">
                        <Textarea
                          id="edit-rawMaterialUnits"
                          disabled
                          value={editingEntry.rawMaterialUnits}
                          onChange={(event) =>
                            updateEditingEntry({ rawMaterialUnits: event.target.value })
                          }
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-background/60 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Remarks</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Notes or observations attached to this batch.</p>
                    </div>
                    <Field htmlFor="edit-remarks" label="Remarks">
                      <Textarea
                        id="edit-remarks"
                        value={editingEntry.remarks}
                        onChange={(event) =>
                          updateEditingEntry({ remarks: event.target.value })
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
                ? "Loading production entries from sheet..."
                : sortedEntries.length === 0
                  ? "No production entries have been saved yet."
                  : `${sortedEntries.length} production entries available.`}
            </CardDescription>
          </div>
           <Button asChild variant="outline">
            <Link to="/manufacturing-entry">
              <ArrowLeft />
              Back to production form
            </Link>
          </Button>
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
              Add a production entry first, then review it here.
            </div>
          ) : (
            <>
              <div className="space-y-4 lg:hidden">
                {paginatedEntries.map((entry) => (
                  <Card key={entry.id} className="rounded-md border shadow-none">
                    <CardContent className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{buildManufacturingLabel(entry) || "Production entry"}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{entry.batchNo || entry.id}</p>
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
                          <p className="mt-1">{entry.productionDate
                            ? new Date(entry.productionDate).toLocaleDateString("en-GB").replace(/\//g, "-")
                            : "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Entry By</p>
                          <p className="mt-1">{entry.user || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Batch Type</p>
                          <p className="mt-1">{entry.tphBatch || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Product Items</p>
                          <p className="mt-1">{formatProductItems(entry) || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Total Quantity</p>
                          <p className="mt-1">{entry.totalBagsProduced || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Wastage</p>
                          <p className="mt-1">{entry.wastageQty || "-"}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase text-muted-foreground">Raw Materials</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {[entry.rawMaterialNames, entry.rawMaterialQty, entry.rawMaterialUnits].filter(Boolean).join(" / ") || "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase text-muted-foreground">Remarks</p>
                        <p className="mt-1 text-sm text-muted-foreground">{entry.remarks || "-"}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="hidden lg:block">
                <DataTable
                  columns={manufacturingColumns}
                  data={paginatedEntries}
                  emptyMessage="No production entries available."
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








