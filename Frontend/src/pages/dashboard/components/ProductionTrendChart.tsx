import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProductionTrendPoint, TrendView } from "@/pages/dashboard/types";
import { formatKgToMt, formatTrendAxis } from "@/pages/dashboard/utils/dashboardFormatters";

type ProductionTrendChartProps = {
  activeReportCategory: string;
  peakProductionPoint: ProductionTrendPoint | null;
  productionTrendData: ProductionTrendPoint[];
  trendView: TrendView;
  onTrendViewChange: (view: TrendView) => void;
};

export function ProductionTrendChart({
  activeReportCategory,
  peakProductionPoint,
  productionTrendData,
  trendView,
  onTrendViewChange,
}: ProductionTrendChartProps) {
  return (
    <Card className="min-w-0 border-white/70 bg-white/90 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <CardHeader className="gap-3 sm:gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div>
            <CardTitle className="text-lg sm:text-xl">Production Trend</CardTitle>
            <CardDescription className="hidden sm:block">
              {activeReportCategory
                ? `${activeReportCategory} production trend for the selected date range.`
                : "Production trend for the selected date range."}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center rounded-lg border border-slate-200 bg-slate-50 p-1 sm:w-auto sm:rounded-xl">
            {(["day", "month", "year"] as TrendView[]).map((view) => (
              <button
                className={[
                  "flex-1 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition sm:flex-none sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs",
                  trendView === view ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900",
                ].join(" ")}
                key={view}
                onClick={() => onTrendViewChange(view)}
                type="button"
              >
                {view}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:rounded-xl sm:px-4 sm:py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-[11px] sm:tracking-[0.18em]">Peak {trendView}</p>
            <p className="mt-1 text-sm font-semibold text-slate-950 sm:text-base">
              {peakProductionPoint ? peakProductionPoint.label : "No data"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:rounded-xl sm:px-4 sm:py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-[11px] sm:tracking-[0.18em]">Peak Production</p>
            <p className="mt-1 text-sm font-semibold text-slate-950 sm:text-base">
              {peakProductionPoint ? formatKgToMt(peakProductionPoint.totalProductionKg) : "0 mt"}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {productionTrendData.length === 0 ? (
          <div className="flex min-h-[160px] sm:min-h-[260px] lg:min-h-[320px] items-center justify-center rounded-xl border border-dashed p-3 text-xs text-muted-foreground sm:p-6 sm:text-sm">
            No production trend available for the selected date range.
          </div>
        ) : (
          <div className="h-[160px] w-full sm:h-[260px] lg:h-[320px]">
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={productionTrendData} margin={{ top: 8, right: 8, bottom: 4, left: -18 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="label"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickLine={false}
                  minTickGap={16}
                />
                <YAxis
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickFormatter={formatTrendAxis}
                  tickLine={false}
                  width={74}
                />
                <Tooltip
                  contentStyle={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 12px 28px rgba(15,23,42,0.08)",
                  }}
                  formatter={(value) => [formatKgToMt(Number(value) || 0), "Production"]}
                  labelFormatter={(label) => `${trendView.charAt(0).toUpperCase() + trendView.slice(1)}: ${label}`}
                />
                <Line
                  activeDot={{ r: 6, stroke: "#0f766e", strokeWidth: 2 }}
                  dataKey="totalProductionKg"
                  dot={(props) => {
                    const { cx, cy, payload } = props;

                    if (typeof cx !== "number" || typeof cy !== "number") {
                      return null;
                    }

                    const isPeak = payload.key === peakProductionPoint?.key;

                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        fill={isPeak ? "#f59e0b" : "#14b8a6"}
                        r={isPeak ? 5 : 3}
                        stroke={isPeak ? "#b45309" : "#0f766e"}
                        strokeWidth={isPeak ? 2 : 1.5}
                      />
                    );
                  }}
                  name="Production"
                  stroke="#0f766e"
                  strokeWidth={3}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
