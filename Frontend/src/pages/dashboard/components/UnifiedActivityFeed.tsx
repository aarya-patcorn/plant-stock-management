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
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <CardTitle>Unified Activity Feed</CardTitle>
          <CardDescription>Latest purchase, production, and dispatch activity in one compact timeline.</CardDescription>
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
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Recent activity will appear here once available.
          </div>
        ) : (
          activities.map((activity, index) => {
            const appearance = activityAppearance[activity.type];
            const Icon = appearance.icon;

            return (
              <div
                className={[
                  "rounded-xl border border-slate-200 px-3 py-3 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm",
                  index % 2 === 0 ? "bg-white" : appearance.rowClassName,
                ].join(" ")}
                key={activity.id}
              >
                <div className="flex items-start gap-3">
                  <div className={["mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border", appearance.iconClassName].join(" ")}>
                    <Icon className="size-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={appearance.accentClassName} variant="outline">
                            <Icon className="mr-1 size-3.5" />
                            {activity.type}
                          </Badge>
                          <p className="truncate text-sm font-semibold text-foreground" title={activity.itemName}>
                            {activity.itemName}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge className="border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-50" variant="outline">
                            {activity.secondaryLabel}
                          </Badge>
                          <Badge className="border-slate-200 bg-white text-slate-700 hover:bg-white" variant="outline">
                            {activity.secondaryBadge}
                          </Badge>
                          {activity.type === "Production" ? (
                            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50" variant="outline">
                              Plant Stock
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Date</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{activity.meta || "-"}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-base font-bold tracking-tight text-slate-950">{activity.quantity}</p>
                      <p className="truncate text-xs text-slate-500" title={activity.secondaryInfo}>
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
