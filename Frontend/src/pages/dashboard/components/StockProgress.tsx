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
    <div className="space-y-1.5 sm:space-y-2">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className={["h-1.5 flex-1 overflow-hidden rounded-full sm:h-2", trackClassName].join(" ")}>
          <div
            className={["h-full rounded-full transition-all", barClassName].join(" ")}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={["min-w-[2.5rem] text-right text-[11px] font-semibold sm:min-w-[3rem] sm:text-xs", textClassName].join(" ")}>
          {formatCount(percentage)}%
        </span>
      </div>
      <p className="text-[11px] font-medium text-slate-600 sm:text-xs">{quantityLabel}</p>
    </div>
  );
}
