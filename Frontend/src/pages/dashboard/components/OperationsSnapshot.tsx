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
  statusClassName,
  statusLabel,
  title,
  trendLabel,
  value,
}: OperationSnapshotItem) {
  return (
    <Card className="border border-slate-200/80 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-700">
            <Icon className="size-4.5" />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {trendLabel ? (
              <Badge className="border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-50" variant="outline">
                {trendLabel}
              </Badge>
            ) : null}
            <Badge className={statusClassName} variant="outline">
              {statusLabel}
            </Badge>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{caption}</p>
          <p className="text-2xl font-bold tracking-tight text-slate-950">{value}</p>
          <p className="text-sm font-medium text-slate-800">{title}</p>
          <p className="text-xs leading-5 text-slate-500">{description}</p>
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
      <CardHeader className="gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Operations Snapshot</p>
            <CardTitle className="mt-1 text-2xl text-slate-950">Inventory control at a glance</CardTitle>
            <CardDescription className="mt-1 max-w-3xl text-sm text-slate-600">
              Compact operational KPIs for stock, production, dispatch, and shortage monitoring.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-50" variant="outline">
              {isLoading ? "Refreshing..." : `${formatCount(dispatchCount)} dispatch records`}
            </Badge>
            <Badge className="border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-50" variant="outline">
              {isLoading ? "Refreshing..." : `${formatCount(productionLogCount)} production logs`}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
