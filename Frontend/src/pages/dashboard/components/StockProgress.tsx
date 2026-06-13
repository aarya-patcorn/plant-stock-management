import { formatCount } from "@/pages/dashboard/utils/dashboardFormatters";

type StockProgressProps = {
  barClassName: string;
  percentage: number;
  quantityLabel: string;
  textClassName: string;
  trackClassName: string;
};

export function StockProgress({
  barClassName,
  percentage,
  quantityLabel,
  textClassName,
  trackClassName,
}: StockProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className={["h-2 flex-1 overflow-hidden rounded-full", trackClassName].join(" ")}>
          <div
            className={["h-full rounded-full transition-all", barClassName].join(" ")}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={["min-w-[3rem] text-right text-xs font-semibold", textClassName].join(" ")}>
          {formatCount(percentage)}%
        </span>
      </div>
      <p className="text-xs font-medium text-slate-600">{quantityLabel}</p>
    </div>
  );
}
