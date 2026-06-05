import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Pencil, Save } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchDispatchEntries,
  fetchProductionMaterialLogs,
  type DispatchEntry,
  type ProductionMaterialLog,
  updateDispatchEntry,
} from "@/lib/api";
import LoadingLoader from "@/components/ui/LoadingLoader";

const ENTRIES_PER_PAGE = 10;

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
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [productionEntries, setProductionEntries] = useState<ProductionMaterialLog[]>([]);

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

  const startEditing = (entry: DispatchEntry) => {
    setEditingEntry({
      ...entry,
      time: normalizeTimeForInput(entry.time),
      dispatchTime: normalizeTimeForInput(entry.dispatchTime),
    });
  };

  const updateEditingEntry = (updates: Partial<DispatchEntry>) => {
    setEditingEntry((current) => (current ? { ...current, ...updates } : current));
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
      setEditingEntry(null);
      toast.success("Dispatch entry updated successfully.");

      void fetchDispatchEntries()
        .then((dispatchEntries) => {
          setEntries(dispatchEntries);
          setLoadError("");
        })
        .catch(() => {});
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

      {editingEntry && (
        <Card className="overflow-hidden border-white/70 bg-white/88 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <CardHeader className="border-b border-slate-200/80 pb-5">
            <CardTitle>Edit dispatch entry</CardTitle>
            <CardDescription>Update the selected record and save your changes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-5">
            <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-background/60 p-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Dispatch details</h3>
                <p className="mt-1 text-xs text-muted-foreground">Core dispatch identity, date, time, and token information.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field htmlFor="edit-date" label="Date">
                <Input
                  id="edit-date"
                  type="date"
                  value={editingEntry.date}
                  onChange={(event) =>
                    setEditingEntry((current) => current ? { ...current, date: event.target.value } : current)
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

              <Field htmlFor="edit-notes" label="Notes">
                <Textarea
                  id="edit-notes"
                  value=""
                  readOnly
                  placeholder="Dispatch records do not include an attachment field."
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
              ? "Loading dispatch entries from sheet..."
              : sortedEntries.length === 0
                ? "No dispatch entries have been saved yet."
                : `${sortedEntries.length} dispatch entries available.`}
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
                          <p className="mt-1">{entry.date || "-"}</p>
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

              <div className="hidden overflow-x-auto lg:block">
                <Table className="min-w-max">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap text-center" title="Date">Date</TableHead>
                      <TableHead className="whitespace-nowrap text-center" title="Time">Time</TableHead>
                      <TableHead className="whitespace-nowrap text-center" title="Challan">Challan</TableHead>
                      <TableHead className="whitespace-nowrap text-center" title="Product">Product</TableHead>
                      <TableHead className="whitespace-nowrap text-center" title="Token">Token</TableHead>
                      <TableHead className="whitespace-nowrap text-center" title="Bag Size">Bag Size</TableHead>
                      <TableHead className="whitespace-nowrap text-center" title="Departed Bags">Departed Bags</TableHead>
                      <TableHead className="whitespace-nowrap text-center" title="Vehicle">Vehicle</TableHead>
                      <TableHead className="whitespace-nowrap text-center" title="Driver">Driver</TableHead>
                      <TableHead className="whitespace-nowrap text-center" title="Dispatch Site">Dispatch Site</TableHead>
                      <TableHead className="whitespace-nowrap text-center" title="Entry By">Entry By</TableHead>
                      <TableHead className="w-[120px] whitespace-nowrap text-center" title="Actions">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap" title={entry.date || "-"}>{entry.date || "-"}</TableCell>
                        <TableCell className="whitespace-nowrap" title={entry.time || "-"}>{entry.time || "-"}</TableCell>
                        <TableCell className="max-w-[160px] truncate whitespace-nowrap" title={entry.challanNo || entry.challanName || "-"}>{entry.challanNo || entry.challanName || "-"}</TableCell>
                        <TableCell className="min-w-[220px] max-w-[220px] truncate whitespace-nowrap" title={buildDispatchLabel(entry) || "-"}>{buildDispatchLabel(entry) || "-"}</TableCell>
                        <TableCell className="max-w-[140px] truncate whitespace-nowrap" title={entry.token || "-"}>{entry.token || "-"}</TableCell>
                        <TableCell className="whitespace-nowrap" title={entry.bagSize || "-"}>{entry.bagSize || "-"}</TableCell>
                        <TableCell className="whitespace-nowrap" title={entry.totalBags || "-"}>{entry.totalBags || "-"}</TableCell>
                        <TableCell className="max-w-[140px] truncate whitespace-nowrap" title={entry.vehicleNo || "-"}>{entry.vehicleNo || "-"}</TableCell>
                        <TableCell className="max-w-[140px] truncate whitespace-nowrap" title={entry.driverName || "-"}>{entry.driverName || "-"}</TableCell>
                        <TableCell className="max-w-[160px] truncate whitespace-nowrap" title={entry.user || "-"}>{entry.user || "-"}</TableCell>
                        <TableCell className="max-w-[160px] truncate whitespace-nowrap" title={entry.dispatchSite || "-"}>{entry.dispatchSite || "-"}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              size="icon"
                              type="button"
                              variant="outline"
                              onClick={() => startEditing(entry)}
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
