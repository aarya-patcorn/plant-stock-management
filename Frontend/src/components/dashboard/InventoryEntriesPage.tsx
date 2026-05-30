import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchInventory, type PurchaseEntry } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingLoader from "@/components/ui/LoadingLoader";
import { Select } from "@/components/ui/select";

function buildInventoryLabel(entry: PurchaseEntry) {
  return [entry.rawMaterialName, entry.packagingType, entry.level2, entry.level3, entry.level4]
    .filter(Boolean)
    .join(" / ");
}

export function InventoryEntriesPage() {
  const [entries, setEntries] = useState<PurchaseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [rawMaterialFilter, setRawMaterialFilter] = useState("");
  const [packagingTypeFilter, setPackagingTypeFilter] = useState("");

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
    () => Array.from(new Set(entries.map((entry) => entry.packagingType).filter(Boolean))),
    [entries],
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
                    <option value="">All raw materials</option>
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
                    <option value="">All packaging types</option>
                    {packagingTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {filteredEntries.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  No inventory entries match the selected filters.
                </div>
              ) : filteredEntries.map((entry) => (
                <div className="rounded-xl border bg-background/70 p-4" key={entry.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{buildInventoryLabel(entry) || "Inventory item"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[entry.purchaseStock || entry.quantityPurchased, entry.unit].filter(Boolean).join(" ") || "Quantity not available"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{entry.serialNo || "Serial N/A"}</Badge>
                      <Badge variant="outline">{entry.invoiceNo || entry.id}</Badge>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Purchase Stock</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {entry.purchaseStock || entry.quantityPurchased || "0"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Used In Production</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{entry.usedInProduction || "0"}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Current Stock</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{entry.currentStock || "0"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
