import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingLoader from "@/components/ui/LoadingLoader";
import { TooltipText } from "@/components/ui/tooltip-text";
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
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="overflow-hidden border border-slate-200 bg-white/95 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0">
            <TooltipText as="p" className="truncate text-xs font-semibold text-slate-950 sm:text-sm" content={label}>
              {label}
            </TooltipText>
            <p className="mt-1 hidden text-xs uppercase tracking-[0.16em] text-slate-500 sm:block">Threshold alert</p>
          </div>
          <Badge className={`${tone.badgeClassName} shrink-0 self-start text-[10px] sm:text-xs`} variant="outline">
            {unitLabel}
          </Badge>
        </div>

        <div className="mt-3 flex min-w-0 items-center gap-3 sm:mt-4 sm:gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center sm:h-24 sm:w-24">
            <svg className="-rotate-90" height="56" width="56" viewBox="0 0 96 96">
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
              <span className="text-xs font-bold text-slate-950 sm:text-md">{formatCount(percentage)}%</span>
              <span className="text-[8px] font-medium uppercase tracking-[0.12em] text-slate-500 sm:text-[8px] sm:tracking-[0.16em]">Stock</span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-950 sm:text-sm">
              {formatCount(value)} / {thresholdLabel}
            </p>
            <p className="mt-1 truncate text-[11px] text-slate-500 sm:hidden">
              Current vs threshold
            </p>
            <p className="mt-1 hidden text-xs text-slate-500 sm:block">
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
      <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <CardTitle className="text-lg sm:text-xl">Inventory Alerts</CardTitle>
          <CardDescription className="hidden sm:block">
            Low-stock inventory items based on operational minimum stock thresholds.
          </CardDescription>
        </div>
        <Badge className="text-[10px] sm:text-xs" variant="outline">{isLoading ? "Loading..." : `${alerts.length} alerts`}</Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center rounded-md border border-dashed p-4 sm:p-6">
            <LoadingLoader />
          </div>
        ) : alerts.length === 0 ? (
          <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground sm:p-4 sm:text-sm">
            No low-stock inventory alerts right now.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
              {paginatedAlerts.map((alert) => (
                <InventoryAlertGaugeCard {...alert} key={alert.id} />
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-between gap-2 sm:justify-center sm:gap-3">
                <Button className="h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm" type="button" disabled={currentPage === 1} onClick={onPreviousPage}>
                  Previous
                </Button>

                <span className="text-xs sm:text-sm">
                  Page {currentPage} of {totalPages || 1}
                </span>

                <Button className="h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm" type="button" disabled={currentPage >= totalPages} onClick={onNextPage}>
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
