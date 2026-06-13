import { AlertTriangle, ArrowRight, Package } from "lucide-react";
import { Link } from "react-router-dom";
import type { ProductionMaterialLog } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <CardTitle>Production Material Logs</CardTitle>
          <CardDescription>Top 3 recent finished-product logs in compact inventory format.</CardDescription>
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
        ) : logs.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No production logs found yet.</div>
        ) : (
          <div className="grid gap-3">
            {logs.slice(0, 3).map((entry) => {
              const { currentStock, dispatchedBags, percentage } = getProductionStockMetrics(entry);
              const stockTone = getProductionStockTone(percentage);

              return (
                <div
                  className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  key={entry.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
                          {percentage < 20 ? <AlertTriangle className="size-3.5" /> : <Package className="size-3.5" />}
                        </span>
                        <p className="truncate text-sm font-semibold text-slate-900" title={entry.productName || "Production log"}>
                          {entry.productName || "Production log"}
                        </p>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{entry.productColor || "Color N/A"}</span>
                        <span className="text-slate-300">â€¢</span>
                        <span>{entry.token || "Token N/A"}</span>
                        <span className="text-slate-300">â€¢</span>
                        <span>{entry.bagSize || "Bag size N/A"}</span>
                      </div>
                    </div>
                    <Badge variant={stockTone.badgeVariant}>{stockTone.label}</Badge>
                  </div>

                  <div className="mt-3">
                    <StockProgress
                      barClassName={stockTone.barClassName}
                      percentage={percentage}
                      quantityLabel={`${formatCount(currentStock)} bags available`}
                      textClassName={stockTone.textClassName}
                      trackClassName={stockTone.trackClassName}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Current Stock</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatCount(currentStock)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Available Bags</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatCount(currentStock)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Dispatched</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatCount(dispatchedBags)}</p>
                    </div>
                  </div>

                  {entry.remarks ? <p className="mt-2 truncate text-xs text-slate-500">{entry.remarks}</p> : null}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
