import { ArrowRight, Package, ShoppingCart, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UnifiedActivity } from "@/pages/dashboard/types";

type UnifiedActivityFeedProps = {
  activities: UnifiedActivity[];
  href: string;
};

export function UnifiedActivityFeed({ activities, href }: UnifiedActivityFeedProps) {
  const activityAppearance = {
    Dispatch: {
      accentClassName: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50",
      icon: Truck,
      iconClassName: "border-amber-200 bg-amber-100 text-amber-700",
      rowClassName: "bg-amber-50/35",
    },
    Production: {
      accentClassName: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
      icon: Package,
      iconClassName: "border-emerald-200 bg-emerald-100 text-emerald-700",
      rowClassName: "bg-emerald-50/35",
    },
    Purchase: {
      accentClassName: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50",
      icon: ShoppingCart,
      iconClassName: "border-sky-200 bg-sky-100 text-sky-700",
      rowClassName: "bg-sky-50/35",
    },
  } as const;

  return (
    <Card className="border-white/70 bg-white/85 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <CardTitle className="text-lg sm:text-xl">Unified Activity Feed</CardTitle>
          <CardDescription className="hidden sm:block">Latest purchase, production, and dispatch activity in one compact timeline.</CardDescription>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to={href}>
            View All
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {activities.length === 0 ? (
          <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground sm:p-4 sm:text-sm">
            Recent activity will appear here once available.
          </div>
        ) : (
          activities.map((activity, index) => {
            const appearance = activityAppearance[activity.type];
            const Icon = appearance.icon;

            return (
              <div
                className={[
                  "rounded-lg border border-slate-200 px-2.5 py-2.5 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm sm:rounded-xl sm:px-3 sm:py-3",
                  index % 2 === 0 ? "bg-white" : appearance.rowClassName,
                ].join(" ")}
                key={activity.id}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className={["mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border sm:size-10 sm:rounded-xl", appearance.iconClassName].join(" ")}>
                    <Icon className="size-3.5 sm:size-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <Badge className={`${appearance.accentClassName} px-2 py-0.5 text-[10px] sm:text-xs`} variant="outline">
                            <Icon className="mr-1 size-3 sm:size-3.5" />
                            {activity.type}
                          </Badge>
                          <p className="truncate text-xs font-semibold text-foreground sm:text-sm" title={activity.itemName}>
                            {activity.itemName}
                          </p>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:mt-2 sm:gap-2">
                          <Badge className="border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-50 sm:text-xs" variant="outline">
                            {activity.secondaryLabel}
                          </Badge>
                          <Badge className="border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-700 hover:bg-white sm:text-xs" variant="outline">
                            {activity.secondaryBadge}
                          </Badge>
                          {activity.type === "Production" ? (
                            <Badge className="border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700 hover:bg-emerald-50 sm:text-xs" variant="outline">
                              Plant Stock
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500 sm:text-xs sm:tracking-[0.14em]">Date</p>
                        <p className="mt-1 text-xs font-semibold text-slate-800 sm:text-sm">{activity.meta || "-"}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 sm:mt-3 sm:gap-3">
                      <p className="text-sm font-bold tracking-tight text-slate-950 sm:text-base">{activity.quantity}</p>
                      <p className="hidden truncate text-xs text-slate-500 sm:block" title={activity.secondaryInfo}>
                        {activity.secondaryInfo}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
