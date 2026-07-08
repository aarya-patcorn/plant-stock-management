import LoadingLoader from "@/components/ui/LoadingLoader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OperationSnapshotItem } from "@/pages/dashboard/types";
import { formatCount } from "@/pages/dashboard/utils/dashboardFormatters";

type OperationsSnapshotProps = {
  dispatchCount: number;
  isLoading: boolean;
  items: OperationSnapshotItem[];
  productionLogCount: number;
};

function SnapshotWidget({
  caption,
  description,
  icon: Icon,
  title,
  trendLabel,
  value,
}: OperationSnapshotItem) {
  return (
    <Card className="border border-slate-200/80 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-700 sm:rounded-xl sm:p-2.5">
            <Icon className="size-4 sm:size-4.5" />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            {trendLabel ? (
              <Badge className="hidden border-slate-200 bg-slate-50 text-[10px] text-slate-700 hover:bg-slate-50 sm:inline-flex" variant="outline">
                {trendLabel}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="mt-3 space-y-1 sm:mt-4 sm:space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-[11px] sm:tracking-[0.16em]">{caption}</p>
          <p className="text-lg font-bold tracking-tight text-slate-950 sm:text-2xl">{value}</p>
          <p className="text-xs font-medium text-slate-800 sm:text-sm">{title}</p>
          <p className="hidden text-xs leading-5 text-slate-500 sm:block">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function OperationsSnapshot({
  dispatchCount,
  isLoading,
  items,
  productionLogCount,
}: OperationsSnapshotProps) {
  return (
    <Card className="border border-slate-200/80 bg-white/92 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <CardHeader className="gap-2 border-b border-slate-200/80 pb-3 sm:gap-3 sm:pb-4">
        <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Operations Snapshot</p>
            <CardTitle className="mt-1 text-lg text-slate-950 sm:text-2xl">Inventory control at a glance</CardTitle>
            <CardDescription className="mt-1 hidden max-w-3xl text-sm text-slate-600 sm:block">
              Compact operational KPIs for stock, production, dispatch, and shortage monitoring.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Badge className="border-slate-200 bg-slate-50 text-[10px] text-slate-700 hover:bg-slate-50 sm:text-xs" variant="outline">
              {isLoading ? "Refreshing..." : `${formatCount(dispatchCount)} dispatch records`}
            </Badge>
            <Badge className="border-slate-200 bg-slate-50 text-[10px] text-slate-700 hover:bg-slate-50 sm:text-xs" variant="outline">
              {isLoading ? "Refreshing..." : `${formatCount(productionLogCount)} production logs`}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-5">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
          {items.map((item) => (
            <SnapshotWidget
              {...item}
              key={item.title}
              value={isLoading ? <LoadingLoader /> : item.value}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
