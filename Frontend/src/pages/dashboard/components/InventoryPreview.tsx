import { AlertTriangle, ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import type { PurchaseEntry } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingLoader from "@/components/ui/LoadingLoader";
import { StockProgress } from "@/pages/dashboard/components/StockProgress";
import {
  getInventoryStockMetrics,
  getInventoryStockTone,
} from "@/pages/dashboard/utils/dashboardCalculations";
import {
  buildInventoryCategoryPath,
  buildInventoryLabel,
  formatCount,
} from "@/pages/dashboard/utils/dashboardFormatters";

type InventoryPreviewProps = {
  entries: PurchaseEntry[];
  isLoading: boolean;
};

export function InventoryPreview({ entries, isLoading }: InventoryPreviewProps) {
  return (
    <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <CardTitle>Inventory List</CardTitle>
          <CardDescription>Top 3 recent inventory entries in a compact stock overview.</CardDescription>
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
        ) : entries.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No inventory entries found yet.</div>
        ) : (
          <div className="grid gap-3">
            {entries.slice(0, 3).map((entry) => {
              const { currentStock, percentage, purchaseStock, usedInProduction } = getInventoryStockMetrics(entry);
              const stockTone = getInventoryStockTone(percentage);
              const categoryPath = buildInventoryCategoryPath(entry) || "Category path not available";

              return (
                <div
                  className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  key={entry.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
                          {percentage < 20 ? <AlertTriangle className="size-3.5" /> : <TrendingUp className="size-3.5" />}
                        </span>
                        <p
                          className="truncate text-sm font-semibold text-slate-900"
                          title={buildInventoryLabel(entry) || "Inventory item"}
                        >
                          {entry.rawMaterialName || "Inventory item"}
                        </p>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500" title={categoryPath}>
                        {categoryPath}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={stockTone.badgeVariant}>{stockTone.label}</Badge>
                      <Badge className="bg-slate-50 text-slate-700" variant="outline">
                        {entry.unit || "Unit N/A"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3">
                    <StockProgress
                      barClassName={stockTone.barClassName}
                      percentage={percentage}
                      quantityLabel={`${formatCount(currentStock)} ${entry.unit || ""}`.trim()}
                      textClassName={stockTone.textClassName}
                      trackClassName={stockTone.trackClassName}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Purchase</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatCount(purchaseStock)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Current</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatCount(currentStock)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Used</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatCount(usedInProduction)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
