import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Boxes, Package, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import {
  fetchDispatchEntries,
  fetchInventory,
  fetchManufacturingEntries,
  fetchProductionMaterialLogs,
  fetchPurchaseEntries,
  type DispatchEntry,
  type ManufacturingEntry,
  type ProductionMaterialLog,
  type PurchaseEntry,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingLoader from "@/components/ui/LoadingLoader";

type DashboardData = {
  dispatchEntries: DispatchEntry[];
  inventoryEntries: PurchaseEntry[];
  manufacturingEntries: ManufacturingEntry[];
  productionMaterialLogs: ProductionMaterialLog[];
  purchaseEntries: PurchaseEntry[];
};

function toNumber(value: string) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function formatCount(value: number) {
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}

function buildInventoryLabel(entry: PurchaseEntry) {
  return [entry.rawMaterialName, entry.packagingType, entry.level2, entry.level3, entry.level4]
    .filter(Boolean)
    .join(" / ");
}

function buildProductLabel(entry: ProductionMaterialLog) {
  return [entry.productCategory, entry.productName, entry.productColor].filter(Boolean).join(" / ");
}

function normalizeLabel(value: string) {
  return value.trim().toLowerCase();
}

function buildInventoryAlertLabel(entry: PurchaseEntry) {
  return [
    entry.rawMaterialName,
    entry.packagingType,
    entry.level2,
    entry.packagingBag,
    entry.level3,
    entry.bucketSize,
  ]
    .filter(Boolean)
    .join(" / ");
}

function getInventoryAlertThreshold(entry: PurchaseEntry) {
  const rawMaterialName = normalizeLabel(entry.rawMaterialName);
  const packagingType = normalizeLabel(entry.packagingType);
  const level2 = normalizeLabel(entry.level2);
  const level3 = normalizeLabel(entry.level3);
  const packagingBag = normalizeLabel(entry.packagingBag);
  const unit = normalizeLabel(entry.unit);

  if (rawMaterialName === "cement") {
    if ((packagingType === "ppc" || packagingType === "opc") && level2 === "silo") {
      return { threshold: 5, thresholdLabel: "5 mt" };
    }

    if (packagingType === "white cement" && level2 === "bag") {
      return { threshold: 5, thresholdLabel: "5 mt" };
    }
  }

  if (rawMaterialName === "sand") {
    if (packagingType === "grey" && level2.includes("600 micron")) {
      return { threshold: 5, thresholdLabel: "5 mt" };
    }

    if (packagingType === "grey" && level2.includes("1200 micron")) {
      return { threshold: 5, thresholdLabel: "5 mt" };
    }

    if (packagingType === "white") {
      return { threshold: 5, thresholdLabel: "5 mt" };
    }
  }

  if (rawMaterialName === "chemical") {
    return { threshold: 1000, thresholdLabel: "1000 kg" };
  }

  if (rawMaterialName === "packaging") {
    if (unit === "bags") {
      return { threshold: 200, thresholdLabel: "200 bags" };
    }

    if (level3 === "coupon") {
      return { threshold: 200, thresholdLabel: "200 pcs" };
    }

    if (level2 === "tile grout" && level3.includes("pouch")) {
      return { threshold: 100, thresholdLabel: "100 nos" };
    }

    if (level2 === "epoxy" && level3.includes("bucket")) {
      return { threshold: 100, thresholdLabel: "100 bucket" };
    }
  }

  if (packagingBag && packagingBag.includes("coupon")) {
    return { threshold: 200, thresholdLabel: "200 pcs" };
  }

  return null;
}

function getTodayKey() {
  return new Date().toLocaleDateString("en-CA");
}

function StatCard({
  description,
  icon: Icon,
  title,
  value,
}: {
  description: string;
  icon: typeof Boxes;
  title: string;
  value: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-0 bg-white/85 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur">
      <CardContent className="relative p-5">
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#0f766e_0%,#14b8a6_55%,#f59e0b_100%)]" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
            <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="rounded-2xl bg-teal-50 p-3 text-teal-700">
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentList({
  emptyText,
  entries,
  href,
  title,
}: {
  emptyText: string;
  entries: Array<{ id: string; primary: string; secondary: string; meta: string }>;
  href: string;
  title: string;
}) {
  return (
    <Card className="border-white/70 bg-white/85 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Latest saved activity from this register.</CardDescription>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to={href}>
            View all
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">{emptyText}</div>
        ) : (
          entries.map((entry) => (
            <div className="rounded-xl border bg-background/70 p-3" key={entry.id}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">{entry.primary}</p>
                <Badge variant="outline">{entry.meta || "-"}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{entry.secondary}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    dispatchEntries: [],
    inventoryEntries: [],
    manufacturingEntries: [],
    productionMaterialLogs: [],
    purchaseEntries: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      fetchInventory(),
      fetchProductionMaterialLogs(),
      fetchPurchaseEntries(),
      fetchManufacturingEntries(),
      fetchDispatchEntries(),
    ])
      .then(([inventoryEntries, productionMaterialLogs, purchaseEntries, manufacturingEntries, dispatchEntries]) => {
        if (!isMounted) {
          return;
        }

        setData({
          dispatchEntries,
          inventoryEntries,
          manufacturingEntries,
          productionMaterialLogs,
          purchaseEntries,
        });
        setLoadError("");
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : "Unable to load dashboard data.");
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

  const dashboardStats = useMemo(() => {
    const todayKey = getTodayKey();
    const todaysPurchaseItems = data.purchaseEntries.filter((entry) => entry.date === todayKey).length;
    const todaysManufacturedItems = data.manufacturingEntries.filter(
      (entry) => entry.productionDate === todayKey,
    ).length;
    const todaysDispatchBags = data.dispatchEntries
      .filter((entry) => entry.date === todayKey)
      .reduce((sum, entry) => sum + toNumber(entry.totalBags), 0);

    return {
      todaysDispatchBags,
      todaysManufacturedItems,
      todaysPurchaseItems,
    };
  }, [data.dispatchEntries, data.manufacturingEntries, data.purchaseEntries]);

  const sortedInventoryEntries = useMemo(
    () =>
      [...data.inventoryEntries].sort((left, right) =>
        `${right.date} ${right.time}`.localeCompare(`${left.date} ${left.time}`),
      ),
    [data.inventoryEntries],
  );
  const sortedProductionLogs = useMemo(
    () =>
      [...data.productionMaterialLogs].sort((left, right) =>
        `${right.token} ${right.bagSize}`.localeCompare(`${left.token} ${left.bagSize}`),
      ),
    [data.productionMaterialLogs],
  );

  const recentPurchases = useMemo(
    () =>
      [...data.purchaseEntries]
        .sort((left, right) => `${right.date} ${right.time}`.localeCompare(`${left.date} ${left.time}`))
        .slice(0, 4)
        .map((entry) => ({
          id: entry.id,
          meta: entry.invoiceNo || entry.id,
          primary: buildInventoryLabel(entry) || "Purchase entry",
          secondary: [entry.quantityPurchased, entry.unit, entry.supplierName].filter(Boolean).join(" • "),
        })),
    [data.purchaseEntries],
  );

  const recentManufacturing = useMemo(
    () =>
      [...data.manufacturingEntries]
        .sort((left, right) =>
          `${right.productionDate} ${right.batchNo}`.localeCompare(`${left.productionDate} ${left.batchNo}`),
        )
        .slice(0, 4)
        .map((entry) => ({
          id: entry.id,
          meta: entry.batchNo || entry.id,
          primary:
            [entry.productCategory, entry.finishedProductName, entry.color].filter(Boolean).join(" / ") ||
            "Production entry",
          secondary: [entry.totalBagsProduced, "bags", entry.bagSize].filter(Boolean).join(" • "),
        })),
    [data.manufacturingEntries],
  );

  const recentDispatch = useMemo(
    () =>
      [...data.dispatchEntries]
        .sort((left, right) => `${right.date} ${right.time}`.localeCompare(`${left.date} ${left.time}`))
        .slice(0, 4)
        .map((entry) => ({
          id: entry.id,
          meta: entry.dispatchSite || entry.id,
          primary:
            [entry.productCategory, entry.productName, entry.productColor].filter(Boolean).join(" / ") ||
            "Dispatch entry",
          secondary: [entry.totalBags, "bags"].filter(Boolean).join(" • "),
        })),
    [data.dispatchEntries],
  );

  const lowStockAlerts = useMemo(
    () =>
      sortedInventoryEntries
        .filter((entry) => {
          const thresholdRule = getInventoryAlertThreshold(entry);

          if (!thresholdRule) {
            return false;
          }

          return toNumber(entry.currentStock) < thresholdRule.threshold;
        })
        .map((entry) => {
          const thresholdRule = getInventoryAlertThreshold(entry);
          const currentStock = toNumber(entry.currentStock);

          return {
            id: entry.id,
            label: buildInventoryAlertLabel(entry) || "Inventory item",
            thresholdLabel: thresholdRule?.thresholdLabel || "",
            unitLabel: entry.unit || "unit",
            value: currentStock,
          };
        }),
    [sortedInventoryEntries],
  );

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,rgba(15,118,110,0.96)_0%,rgba(20,184,166,0.9)_52%,rgba(245,158,11,0.82)_100%)] text-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
        <CardContent className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">Operations snapshot</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Inventory, production, and dispatch in one panel.
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-white/85">
              Track raw-material stock, finished-product availability, dispatched bags, and the latest movement across purchase, production, and dispatch registers.
            </p>
          </div>
          <div className="grid gap-3 rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
              <span className="text-sm text-white/80">Inventory records</span>
              <span className="text-xl font-bold">{formatCount(data.inventoryEntries.length)}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
              <span className="text-sm text-white/80">Production logs</span>
              <span className="text-xl font-bold">{formatCount(data.productionMaterialLogs.length)}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
              <span className="text-sm text-white/80">Dispatch records</span>
              <span className="text-xl font-bold">{formatCount(data.dispatchEntries.length)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {loadError ? (
        <div className="rounded-lg border border-dashed border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          description="Purchase entries created today."
          icon={ShoppingBag}
          title="Today's Purchase Items"
          value={isLoading ? <LoadingLoader /> : formatCount(dashboardStats.todaysPurchaseItems)}
        />
        <StatCard
          description="Manufacturing entries created today."
          icon={Package}
          title="Today's Manufactured Items"
          value={isLoading ? <LoadingLoader /> : formatCount(dashboardStats.todaysManufacturedItems)}
        />
        <StatCard
          description="Total dispatch bags recorded today."
          icon={Boxes}
          title="Today's Dispatch Bags"
          value={isLoading ? <LoadingLoader /> : formatCount(dashboardStats.todaysDispatchBags)}
        />
      </div>

      <Card className="border-white/70 bg-white/85 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle>Inventory Alerts</CardTitle>
            <CardDescription>
              Low-stock inventory items based on operational minimum stock thresholds.
            </CardDescription>
          </div>
          <Badge variant="outline">{isLoading ? "Loading..." : `${lowStockAlerts.length} alerts`}</Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center rounded-md border border-dashed p-6">
              <LoadingLoader />
            </div>
          ) : lowStockAlerts.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No low-stock inventory alerts right now.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {lowStockAlerts.map((alert) => (
                <Card className="overflow-hidden border-0 bg-white/90 shadow-[0_16px_34px_rgba(15,23,42,0.08)]" key={alert.id}>
                  <CardContent className="relative p-5">
                    <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#b91c1c_0%,#ef4444_60%,#fca5a5_100%)]" />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground" title={alert.label}>
                          {alert.label}
                        </p>
                        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Current Stock
                        </p>
                        <p className="mt-1 text-2xl font-bold text-destructive">
                          {formatCount(alert.value)}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Alert threshold: {alert.thresholdLabel}
                        </p>
                      </div>
                      <Badge variant="destructive">{alert.unitLabel}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.15fr)]">
        <Card className="border-white/70 bg-white/85 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle>Inventory List</CardTitle>
              <CardDescription>Top 3 recent inventory entries with stock labels and quantity details.</CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/inventory-entries">
                View entries
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center rounded-md border border-dashed p-6">
                <LoadingLoader />
              </div>
            ) : sortedInventoryEntries.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No inventory entries found yet.</div>
            ) : (
              <div className="space-y-3">
                {sortedInventoryEntries.slice(0, 3).map((entry) => (
                  <div className="min-w-0 rounded-xl border bg-background/70 p-4" key={entry.id}>
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate whitespace-nowrap text-sm font-semibold text-foreground"
                          title={buildInventoryLabel(entry) || "Inventory item"}
                        >
                          {buildInventoryLabel(entry) || "Inventory item"}
                        </p>
                      </div>
                      <div className="flex min-w-0 flex-wrap gap-2 sm:max-w-[45%] sm:justify-end">
                        <Badge
                          className="max-w-full truncate whitespace-nowrap"
                          title={entry.purchaseStock || entry.quantityPurchased || "0"}
                          variant="secondary"
                        >
                          {entry.purchaseStock || entry.quantityPurchased || "0"}
                        </Badge>
                        <Badge
                          className="max-w-full truncate whitespace-nowrap"
                          title={entry.unit || "Unit N/A"}
                          variant="outline"
                        >
                          {entry.unit || "Unit N/A"}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="min-w-0 rounded-lg bg-muted/50 p-3">
                        <p className="text-xs font-medium uppercase text-muted-foreground">Purchase Stock</p>
                        <p
                          className="mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-foreground"
                          title={entry.purchaseStock || entry.quantityPurchased || "0"}
                        >
                          {entry.purchaseStock || entry.quantityPurchased || "0"}
                        </p>
                      </div>
                      <div className="min-w-0 rounded-lg bg-muted/50 p-3">
                        <p className="text-xs font-medium uppercase text-muted-foreground">Current Stock</p>
                        <p
                          className="mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-foreground"
                          title={entry.currentStock || "0"}
                        >
                          {entry.currentStock || "0"}
                        </p>
                      </div>
                      <div className="min-w-0 rounded-lg bg-muted/50 p-3">
                        <p className="text-xs font-medium uppercase text-muted-foreground">Used In Production</p>
                        <p
                          className="mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-foreground"
                          title={entry.usedInProduction || "0"}
                        >
                          {entry.usedInProduction || "0"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/85 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle>Production Material Logs</CardTitle>
              <CardDescription>Top 3 recent finished-product logs with stock and dispatch details.</CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/production-material-logs">
                View logs
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center rounded-md border border-dashed p-6">
                <LoadingLoader />
              </div>
            ) : sortedProductionLogs.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No production logs found yet.</div>
            ) : (
              <div className="space-y-3">
                {sortedProductionLogs.slice(0, 3).map((entry) => (
                  <div className="min-w-0 rounded-xl border bg-background/70 p-4" key={entry.id}>
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate whitespace-nowrap text-sm font-semibold text-foreground"
                          title={buildProductLabel(entry) || "Production log"}
                        >
                          {buildProductLabel(entry) || "Production log"}
                        </p>
                      </div>
                      <div className="flex min-w-0 flex-wrap gap-2 sm:max-w-[45%] sm:justify-end">
                        <Badge
                          className="max-w-full truncate whitespace-nowrap"
                          title={entry.token || "Token N/A"}
                          variant="secondary"
                        >
                          {entry.token || "Token N/A"}
                        </Badge>
                        <Badge
                          className="max-w-full truncate whitespace-nowrap"
                          title={entry.bagSize || "Bag size N/A"}
                          variant="outline"
                        >
                          {entry.bagSize || "Bag size N/A"}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="min-w-0 rounded-lg bg-muted/50 p-3">
                        <p className="text-xs font-medium uppercase text-muted-foreground">Current Stock</p>
                        <p
                          className="mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-base font-semibold text-foreground"
                          title={formatCount(toNumber(entry.currentQuantity))}
                        >
                          {formatCount(toNumber(entry.currentQuantity))}
                        </p>
                      </div>
                      <div className="min-w-0 rounded-lg bg-muted/50 p-3">
                        <p className="text-xs font-medium uppercase text-muted-foreground">Available Bags</p>
                        <p
                          className="mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-base font-semibold text-foreground"
                          title={formatCount(toNumber(entry.currentQuantity))}
                        >
                          {formatCount(toNumber(entry.currentQuantity))}
                        </p>
                      </div>
                      <div className="min-w-0 rounded-lg bg-muted/50 p-3">
                        <p className="text-xs font-medium uppercase text-muted-foreground">Dispatched Bags</p>
                        <p
                          className="mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-base font-semibold text-foreground"
                          title={formatCount(toNumber(entry.shippedQuantity))}
                        >
                          {formatCount(toNumber(entry.shippedQuantity))}
                        </p>
                      </div>
                    </div>

                    {entry.remarks ? (
                      <p className="mt-3 text-sm text-muted-foreground">{entry.remarks}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <RecentList
          emptyText="Recent purchase entries will appear here."
          entries={recentPurchases}
          href="/purchase-entries"
          title="Recent Purchases"
        />
        <RecentList
          emptyText="Recent production entries will appear here."
          entries={recentManufacturing}
          href="/manufacturing-entries"
          title="Recent Production"
        />
        <RecentList
          emptyText="Recent dispatch entries will appear here."
          entries={recentDispatch}
          href="/dispatch-entries"
          title="Recent Dispatch"
        />
      </div>
    </div>
  );
}
