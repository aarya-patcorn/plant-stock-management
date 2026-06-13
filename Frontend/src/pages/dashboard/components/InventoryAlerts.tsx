import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingLoader from "@/components/ui/LoadingLoader";
import type { InventoryAlert } from "@/pages/dashboard/types";
import { clampPercentage } from "@/pages/dashboard/utils/dashboardCalculations";
import { formatCount } from "@/pages/dashboard/utils/dashboardFormatters";

type InventoryAlertsProps = {
  alerts: InventoryAlert[];
  currentPage: number;
  isLoading: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  paginatedAlerts: InventoryAlert[];
  totalPages: number;
};

function InventoryAlertGaugeCard({
  label,
  threshold,
  thresholdLabel,
  unitLabel,
  value,
}: InventoryAlert) {
  const percentage = threshold > 0 ? clampPercentage((value / threshold) * 100) : 0;
  const tone =
    percentage <= 20
      ? {
          badgeClassName: "border-red-200 bg-red-50 text-red-700 hover:bg-red-50",
          progressClassName: "stroke-red-500",
          trackClassName: "stroke-red-100",
        }
      : percentage <= 50
        ? {
            badgeClassName: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50",
            progressClassName: "stroke-amber-500",
            trackClassName: "stroke-amber-100",
          }
        : {
            badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
            progressClassName: "stroke-emerald-500",
            trackClassName: "stroke-emerald-100",
          };
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="overflow-hidden border border-slate-200 bg-white/95 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950" title={label}>
              {label}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">Threshold alert</p>
          </div>
          <Badge className={tone.badgeClassName} variant="outline">
            {unitLabel}
          </Badge>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
            <svg className="-rotate-90" height="96" width="96" viewBox="0 0 96 96">
              <circle
                className={tone.trackClassName}
                cx="48"
                cy="48"
                fill="none"
                r={radius}
                strokeWidth="8"
              />
              <circle
                className={[tone.progressClassName, "transition-all duration-300 ease-out"].join(" ")}
                cx="48"
                cy="48"
                fill="none"
                r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                strokeWidth="8"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-slate-950">{formatCount(percentage)}%</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Stock</span>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Current / Threshold</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                {formatCount(value)} / {thresholdLabel}
              </p>
            </div>
            <p className="text-xs text-slate-500">
              Current stock is at {formatCount(percentage)}% of the configured threshold.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function InventoryAlerts({
  alerts,
  currentPage,
  isLoading,
  onNextPage,
  onPreviousPage,
  paginatedAlerts,
  totalPages,
}: InventoryAlertsProps) {
  return (
    <Card className="border-white/70 bg-white/85 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <CardTitle>Inventory Alerts</CardTitle>
          <CardDescription>
            Low-stock inventory items based on operational minimum stock thresholds.
          </CardDescription>
        </div>
        <Badge variant="outline">{isLoading ? "Loading..." : `${alerts.length} alerts`}</Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center rounded-md border border-dashed p-6">
            <LoadingLoader />
          </div>
        ) : alerts.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            No low-stock inventory alerts right now.
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {paginatedAlerts.map((alert) => (
                <InventoryAlertGaugeCard {...alert} key={alert.id} />
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-center gap-3">
                <Button type="button" disabled={currentPage === 1} onClick={onPreviousPage}>
                  Previous
                </Button>

                <span>
                  Page {currentPage} of {totalPages || 1}
                </span>

                <Button type="button" disabled={currentPage >= totalPages} onClick={onNextPage}>
                  Next
                </Button>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
