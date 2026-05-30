import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Pencil, Save } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const handleUpdate = async () => {
    if (!editingEntry) {
      return;
    }

    setIsUpdating(true);

    try {
      await updateManufacturingEntry(editingEntry);
      setEntries((current) =>
        current.map((entry) => (entry.id === editingEntry.id ? editingEntry : entry)),
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
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field htmlFor="edit-id" label="ID">
                <Input disabled id="edit-id" value={editingEntry.id} />
              </Field>
              <Field htmlFor="edit-productionDate" label="Production Date">
                <Input
                  id="edit-productionDate"
                  type="date"
                  value={editingEntry.productionDate}
                  onChange={(event) =>
                    setEditingEntry((current) => current ? { ...current, productionDate: event.target.value } : current)
                  }
                />
              </Field>
              <Field htmlFor="edit-tphBatch" label="Batch Type">
                <Input
                  id="edit-tphBatch"
                  value={editingEntry.tphBatch}
                  onChange={(event) =>
                    setEditingEntry((current) => current ? { ...current, tphBatch: event.target.value } : current)
                  }
                />
              </Field>
              <Field htmlFor="edit-batchNo" label="Batch No">
                <Input
                  id="edit-batchNo"
                  value={editingEntry.batchNo}
                  onChange={(event) =>
                    setEditingEntry((current) => current ? { ...current, batchNo: event.target.value } : current)
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
                <Input
                  id="edit-productCategory"
                  value={editingEntry.productCategory}
                  onChange={(event) =>
                    setEditingEntry((current) => current ? { ...current, productCategory: event.target.value } : current)
                  }
                />
              </Field>
              <Field htmlFor="edit-finishedProductName" label="Finished Product Name">
                <Input
                  id="edit-finishedProductName"
                  value={editingEntry.finishedProductName}
                  onChange={(event) =>
                    setEditingEntry((current) => current ? { ...current, finishedProductName: event.target.value } : current)
                  }
                />
              </Field>
              <Field htmlFor="edit-color" label="Color">
                <Input
                  id="edit-color"
                  value={editingEntry.color}
                  onChange={(event) =>
                    setEditingEntry((current) => current ? { ...current, color: event.target.value } : current)
                  }
                />
              </Field>
              <Field htmlFor="edit-token" label="Token">
                <Input
                  id="edit-token"
                  value={editingEntry.token}
                  onChange={(event) =>
                    setEditingEntry((current) => current ? { ...current, token: event.target.value } : current)
                  }
                />
              </Field>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-background/60 p-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Output details</h3>
                <p className="mt-1 text-xs text-muted-foreground">Produced quantity, wastage, and downstream stock-impact values.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field htmlFor="edit-bagSize" label="Bag Size">
                <Input
                  id="edit-bagSize"
                  value={editingEntry.bagSize}
                  onChange={(event) =>
                    setEditingEntry((current) => current ? { ...current, bagSize: event.target.value } : current)
                  }
                />
              </Field>
              <Field htmlFor="edit-totalBagsProduced" label="Total Bags">
                <Input
                  id="edit-totalBagsProduced"
                  value={editingEntry.totalBagsProduced}
                  onChange={(event) =>
                    setEditingEntry((current) => current ? { ...current, totalBagsProduced: event.target.value } : current)
                  }
                />
              </Field>
              <Field htmlFor="edit-wastageQty" label="Wastage">
                <Input
                  id="edit-wastageQty"
                  value={editingEntry.wastageQty}
                  onChange={(event) =>
                    setEditingEntry((current) => current ? { ...current, wastageQty: event.target.value } : current)
                  }
                />
              </Field>
              </div>
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
                  value={editingEntry.rawMaterialNames}
                  onChange={(event) =>
                    setEditingEntry((current) => current ? { ...current, rawMaterialNames: event.target.value } : current)
                  }
                />
              </Field>
              <Field htmlFor="edit-rawMaterialQty" label="Raw Material Qty">
                <Textarea
                  id="edit-rawMaterialQty"
                  value={editingEntry.rawMaterialQty}
                  onChange={(event) =>
                    setEditingEntry((current) => current ? { ...current, rawMaterialQty: event.target.value } : current)
                  }
                />
              </Field>
              <Field htmlFor="edit-rawMaterialUnits" label="Raw Material Units">
                <Textarea
                  id="edit-rawMaterialUnits"
                  value={editingEntry.rawMaterialUnits}
                  onChange={(event) =>
                    setEditingEntry((current) => current ? { ...current, rawMaterialUnits: event.target.value } : current)
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
                    setEditingEntry((current) => current ? { ...current, remarks: event.target.value } : current)
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
                          <p className="text-xs font-medium uppercase text-muted-foreground">Token</p>
                          <p className="mt-1">{entry.token || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Bag Size</p>
                          <p className="mt-1">{entry.bagSize || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Total Bags</p>
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
                      <TableHead className="whitespace-nowrap text-center" title="Token">Token</TableHead>
                      <TableHead className="whitespace-nowrap text-center" title="Bag Size">Bag Size</TableHead>
                      <TableHead className="whitespace-nowrap text-center" title="Total Bags">Total Bags</TableHead>
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
                        <TableCell className="max-w-[140px] truncate whitespace-nowrap" title={entry.token || "-"}>{entry.token || "-"}</TableCell>
                        <TableCell className="whitespace-nowrap" title={entry.bagSize || "-"}>{entry.bagSize || "-"}</TableCell>
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
