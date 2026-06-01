import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const ENTRIES_PER_PAGE = 10;
const batchOptions = ["1TPH", "2TPH", "Manual Blender", "Sigma Mixer", "Manual Hand Mixer", "Other"];
const productCategories = ["Tile Adhesive", "Bondure", "Epoxy", "Grout", "Tile Cleaner", "Other"];
const groutColors = ["Black", "White", "Ivory", "Coffee Brown", "Grey", "Light Grey", "Green", "Blue", "Red", "Yellow"];
const tileAdhesiveWhiteProducts = ["K60", "K80", "K90", "Kamdhenu X"];
const tileAdhesiveGreyProducts = ["K50", "K60", "K80", "K90", "Kamdhenu X"];
const tileCleanerProducts = ["Crystal X 1L", "Shine X 1L", "Crystal X 5L", "Shine X 5L"];

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
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);

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

  const totalPages = Math.max(1, Math.ceil(sortedEntries.length / ENTRIES_PER_PAGE));
  const paginatedEntries = useMemo(
    () => sortedEntries.slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE),
    [currentPage, sortedEntries],
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const updateEditingEntry = (updates: Partial<ManufacturingEntry>) => {
    setEditingEntry((current) => (current ? { ...current, ...updates } : current));
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
      setEditingEntry(null);
      toast.success("Production entry updated successfully.");

      void fetchManufacturingEntries()
        .then((manufacturingEntries) => {
          setEntries(manufacturingEntries);
          setLoadError("");
        })
        .catch(() => {});
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

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-white/70 bg-white/88 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <CardHeader className="gap-5 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Production Register
            </p>
            <CardTitle className="text-3xl tracking-[-0.03em]">All production entries</CardTitle>
            <CardDescription className="max-w-2xl">Review saved manufacturing batches, refine batch details, and manage production records from one place.</CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link to="/manufacturing-entry">
              <ArrowLeft />
              Back to production form
            </Link>
          </Button>
        </CardHeader>
      </Card>

      {editingEntry && (
        <Card className="overflow-hidden border-white/70 bg-white/88 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <CardHeader className="border-b border-slate-200/80 pb-5">
            <CardTitle>Edit production entry</CardTitle>
            <CardDescription>Update the selected record and save your changes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-5">
            <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-background/60 p-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Batch details</h3>
                <p className="mt-1 text-xs text-muted-foreground">Batch identity, production date, and core run information.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field htmlFor="edit-productionDate" label="Production Date">
                <Input
                  id="edit-productionDate"
                  type="date"
                  value={editingEntry.productionDate}
                  onChange={(event) =>
                    updateEditingEntry({ productionDate: event.target.value })
                  }
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
                  disabled={isProductCategoryLocked}
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
                      const nextBagSize =
                        finishedProductName === "Crystal X 1L" || finishedProductName === "Shine X 1L"
                          ? "1L"
                          : finishedProductName === "Crystal X 5L" || finishedProductName === "Shine X 5L"
                            ? "5L"
                            : editingEntry.bagSize;

                      updateEditingEntry({
                        finishedProductName,
                        color: nextColor,
                        bagSize: nextBagSize,
                        productItems: nextBagSize
                          ? [{ ...getProductItems(editingEntry)[0], bagSize: nextBagSize }]
                          : editingEntry.productItems,
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
                          disabled={!isTileAdhesiveProduct}
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

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200/80 pt-5 sm:flex-row sm:justify-end">
              <Button onClick={() => setEditingEntry(null)} type="button" variant="outline">
                Cancel
              </Button>
              <Button disabled={isUpdating} onClick={handleUpdate} type="button">
                <Save />
                {isUpdating ? "Updating..." : "Update entry"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
          <div className="rounded-xl border border-slate-200 bg-background/70 px-3 py-2 text-sm font-medium text-muted-foreground">
            {isLoading ? "Loading..." : `${sortedEntries.length} total`}
          </div>
        </CardHeader>
        <CardContent className="p-5">
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
                            onClick={() => setEditingEntry(entry)}
                          >
                            <Pencil />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Date</p>
                          <p className="mt-1">{entry.productionDate || "-"}</p>
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

              <div className="hidden overflow-x-auto lg:block">
                <Table className="min-w-max">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap text-center" title="Date">Date</TableHead>
                      <TableHead className="whitespace-nowrap text-center" title="Batch No">Batch No</TableHead>
                      <TableHead className="whitespace-nowrap text-center" title="Batch Type">Batch Type</TableHead>
                      <TableHead className="whitespace-nowrap text-center" title="Category">Category</TableHead>
                      <TableHead className="whitespace-nowrap text-center" title="Product">Product</TableHead>
                      <TableHead className="whitespace-nowrap text-center" title="Color">Color</TableHead>
                      <TableHead className="whitespace-nowrap text-center" title="Product Items">Product Items</TableHead>
                      <TableHead className="whitespace-nowrap text-center" title="Total Quantity">Total Quantity</TableHead>
                      <TableHead className="whitespace-nowrap text-center" title="Wastage">Wastage</TableHead>
                      <TableHead className="whitespace-nowrap text-center" title="Raw Materials">Raw Materials</TableHead>
                      <TableHead className="whitespace-nowrap text-center" title="Remarks">Remarks</TableHead>
                      <TableHead className="w-[120px] whitespace-nowrap text-center" title="Actions">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap" title={entry.productionDate || "-"}>{entry.productionDate || "-"}</TableCell>
                        <TableCell className="max-w-[140px] truncate whitespace-nowrap" title={entry.batchNo || "-"}>{entry.batchNo || "-"}</TableCell>
                        <TableCell className="max-w-[140px] truncate whitespace-nowrap" title={entry.tphBatch || "-"}>{entry.tphBatch || "-"}</TableCell>
                        <TableCell className="max-w-[160px] truncate whitespace-nowrap" title={entry.productCategory || "-"}>{entry.productCategory || "-"}</TableCell>
                        <TableCell className="max-w-[220px] truncate whitespace-nowrap" title={entry.finishedProductName || "-"}>{entry.finishedProductName || "-"}</TableCell>
                        <TableCell className="max-w-[140px] truncate whitespace-nowrap" title={entry.color || "-"}>{entry.color || "-"}</TableCell>
                        <TableCell className="min-w-[260px] max-w-[320px] truncate whitespace-nowrap" title={formatProductItems(entry) || "-"}>{formatProductItems(entry) || "-"}</TableCell>
                        <TableCell className="whitespace-nowrap" title={entry.totalBagsProduced || "-"}>{entry.totalBagsProduced || "-"}</TableCell>
                        <TableCell className="whitespace-nowrap" title={entry.wastageQty || "-"}>{entry.wastageQty || "-"}</TableCell>
                        <TableCell className="max-w-[220px] truncate whitespace-nowrap" title={[entry.rawMaterialNames, entry.rawMaterialQty, entry.rawMaterialUnits].filter(Boolean).join(" / ") || "-"}>
                          {[entry.rawMaterialNames, entry.rawMaterialQty, entry.rawMaterialUnits].filter(Boolean).join(" / ") || "-"}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate whitespace-nowrap" title={entry.remarks || "-"}>{entry.remarks || "-"}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              size="icon"
                              type="button"
                              variant="outline"
                              onClick={() => setEditingEntry(entry)}
                            >
                              <Pencil />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {!isLoading && !loadError && sortedEntries.length > 0 ? (
            <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ENTRIES_PER_PAGE + 1}-{Math.min(currentPage * ENTRIES_PER_PAGE, sortedEntries.length)} of {sortedEntries.length}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
