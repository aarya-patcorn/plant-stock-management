import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ManufacturingEntry } from "@/lib/api";

interface RecentBatchesPanelProps {
  recentBatches: ManufacturingEntry[];
  recentBatchesPage: number;
  setRecentBatchesPage: React.Dispatch<React.SetStateAction<number>>;
  totalRecentBatchPages: number;
  visibleRecentBatches: ManufacturingEntry[];
}

export function RecentBatchesPanel({
  recentBatches,
  recentBatchesPage,
  setRecentBatchesPage,
  totalRecentBatchPages,
  visibleRecentBatches,
}: RecentBatchesPanelProps) {
  return (
    <div className="space-y-5 xl:sticky xl:top-5 xl:h-[calc(90vh-1rem)]">
      <Card className="overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/85 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur xl:flex xl:h-full xl:flex-col">
        <CardHeader className="border-b border-slate-200/80 pb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Workspace
          </p>
          <CardTitle className="mt-2">Recent batches</CardTitle>
          <CardDescription>Latest production entries for this register.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-4 xl:flex-1 xl:overflow-y-auto">
          {visibleRecentBatches.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No production entries available yet.
            </div>
          ) : (
            visibleRecentBatches.map((batch) => (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm" key={batch.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium">{batch.finishedProductName || "Production entry"}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">{batch.batchNo || batch.id}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[batch.totalBagsProduced, "bags"].filter(Boolean).join(" ")} produced in {batch.productCategory || "-"}
                </p>
              </div>
            ))
          )}
          {recentBatches.length > 0 && recentBatches.length > visibleRecentBatches.length ? (
            <div className="flex items-center justify-between gap-2 border-t border-slate-200/80 pt-4">
              <Button
                className="rounded-xl bg-white"
                type="button"
                variant="outline"
                onClick={() => setRecentBatchesPage((page) => Math.max(1, page - 1))}
                disabled={recentBatchesPage === 1}
              >
                Prev
              </Button>
              <span className="text-xs text-muted-foreground">
                {recentBatchesPage} / {totalRecentBatchPages}
              </span>
              <Button
                className="rounded-xl bg-white"
                type="button"
                variant="outline"
                onClick={() => setRecentBatchesPage((page) => Math.min(totalRecentBatchPages, page + 1))}
                disabled={recentBatchesPage === totalRecentBatchPages}
              >
                Next
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
