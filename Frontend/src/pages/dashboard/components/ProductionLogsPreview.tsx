import { AlertTriangle, ArrowRight, Package } from "lucide-react";
import { Link } from "react-router-dom";
import type { ProductionMaterialLog } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipText } from "@/components/ui/tooltip-text";
import LoadingLoader from "@/components/ui/LoadingLoader";
import { StockProgress } from "@/pages/dashboard/components/StockProgress";
import {
  getProductionStockMetrics,
  getProductionStockTone,
} from "@/pages/dashboard/utils/dashboardCalculations";
import { formatCount } from "@/pages/dashboard/utils/dashboardFormatters";

type ProductionLogsPreviewProps = {
  isLoading: boolean;
  logs: ProductionMaterialLog[];
};

export function ProductionLogsPreview({ isLoading, logs }: ProductionLogsPreviewProps) {
  return (
    <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <CardTitle className="text-lg sm:text-xl">Production Material Logs</CardTitle>
          <CardDescription className="hidden sm:block">Top 3 recent finished-product logs in compact inventory format.</CardDescription>
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
          <div className="flex justify-center rounded-md border border-dashed p-4 sm:p-6">
            <LoadingLoader />
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground sm:p-4 sm:text-sm">No production logs found yet.</div>
        ) : (
          <div className="grid gap-2 sm:gap-3">
            {logs.slice(0, 3).map((entry) => {
              const { currentStock, dispatchedBags, percentage } = getProductionStockMetrics(entry);
              const stockTone = getProductionStockTone(percentage);

              return (
                <div
                  className="group rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:rounded-xl sm:p-3"
                  key={entry.id}
                >
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
                          {percentage < 20 ? <AlertTriangle className="size-3 sm:size-3.5" /> : <Package className="size-3 sm:size-3.5" />}
                        </span>
                        <TooltipText as="p" className="truncate text-xs font-semibold text-slate-900 sm:text-sm" content={entry.productName || "Production log"}>
                          {entry.productName || "Production log"}
                        </TooltipText>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 sm:gap-2 sm:text-xs">
                        <span>{entry.productColor || "Color N/A"}</span>
                        <span className="text-slate-300">/</span>
                        <span>{entry.token || "Token N/A"}</span>
                        <span className="text-slate-300">/</span>
                        <span>{entry.bagSize || "Bag size N/A"}</span>
                      </div>
                    </div>
                    <Badge className="text-[10px] sm:text-xs" variant={stockTone.badgeVariant}>{stockTone.label}</Badge>
                  </div>

                  <div className="mt-2.5 sm:mt-3">
                    <StockProgress
                      barClassName={stockTone.barClassName}
                      percentage={percentage}
                      quantityLabel={`${formatCount(currentStock)} bags available`}
                      textClassName={stockTone.textClassName}
                      trackClassName={stockTone.trackClassName}
                    />
                  </div>

                  <div className="mt-2.5 grid grid-cols-3 gap-1.5 sm:mt-3 sm:gap-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 sm:px-2.5 sm:py-2">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-[11px]">Total Stock</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900 sm:text-sm">{Number(currentStock) + Number(dispatchedBags)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 sm:px-2.5 sm:py-2">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-[11px]">Current Stock</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900 sm:text-sm">{formatCount(currentStock)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 sm:px-2.5 sm:py-2">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-[11px]">Dispatched</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900 sm:text-sm">{formatCount(dispatchedBags)}</p>
                    </div>
                  </div>

                  {entry.remarks ? <p className="mt-2 truncate text-[11px] text-slate-500 sm:text-xs">{entry.remarks}</p> : null}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
