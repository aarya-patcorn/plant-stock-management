import { AlertTriangle, ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import type { InventoryEntry } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipText } from "@/components/ui/tooltip-text";
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
  entries: InventoryEntry[];
  isLoading: boolean;
};

export function InventoryPreview({ entries, isLoading }: InventoryPreviewProps) {
  return (
    <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <CardTitle className="text-lg sm:text-xl">Inventory List (Raw Materials)</CardTitle>
          <CardDescription className="hidden sm:block">Top 3 recent inventory entries in a compact stock overview.</CardDescription>
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
          <div className="flex justify-center rounded-md border border-dashed p-4 sm:p-6">
            <LoadingLoader />
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground sm:p-4 sm:text-sm">No inventory entries found yet.</div>
        ) : (
          <div className="grid gap-2 sm:gap-3">
            {entries.slice(0, 3).map((entry) => {
              const { currentStock, percentage, purchaseStock, usedInProduction } = getInventoryStockMetrics(entry);
              const stockTone = getInventoryStockTone(percentage);
              const categoryPath = buildInventoryCategoryPath(entry) || "Category path not available";

              return (
                <div
                  className="group rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:rounded-xl sm:p-3"
                  key={entry.id}
                >
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
                          {percentage < 20 ? <AlertTriangle className="size-3 sm:size-3.5" /> : <TrendingUp className="size-3 sm:size-3.5" />}
                        </span>
                        <TooltipText
                          as="p"
                          className="truncate text-xs font-semibold text-slate-900 sm:text-sm"
                          content={buildInventoryLabel(entry) || "Inventory item"}
                        >
                          {entry.rawMaterialName || "Inventory item"}
                        </TooltipText>
                      </div>
                      <TooltipText as="p" className="mt-1 truncate text-[11px] text-slate-500 sm:text-xs" content={categoryPath}>
                        {categoryPath}
                      </TooltipText>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                      <Badge className="text-[10px] sm:text-xs" variant={stockTone.badgeVariant}>{stockTone.label}</Badge>
                      <Badge className="bg-slate-50 text-[10px] text-slate-700 sm:text-xs" variant="outline">
                        {entry.unit || "Unit N/A"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-2.5 sm:mt-3">
                    <StockProgress
                      barClassName={stockTone.barClassName}
                      percentage={percentage}
                      quantityLabel={`${formatCount(currentStock)} ${entry.unit || ""}`.trim()}
                      textClassName={stockTone.textClassName}
                      trackClassName={stockTone.trackClassName}
                    />
                  </div>

                  <div className="mt-2.5 grid grid-cols-3 gap-1.5 sm:mt-3 sm:gap-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 sm:px-2.5 sm:py-2">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-[11px]">Purchase</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900 sm:text-sm">{formatCount(purchaseStock)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 sm:px-2.5 sm:py-2">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-[11px]">Current</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900 sm:text-sm">{formatCount(currentStock)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 sm:px-2.5 sm:py-2">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-[11px]">Used</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900 sm:text-sm">{formatCount(usedInProduction)}</p>
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
