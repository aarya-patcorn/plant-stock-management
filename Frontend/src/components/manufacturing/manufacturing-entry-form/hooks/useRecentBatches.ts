import { useEffect, useState } from "react";
import { fetchManufacturingEntries, type ManufacturingEntry } from "@/lib/api";
import {
  DESKTOP_RECENT_BATCHES_PAGE_SIZE,
  MOBILE_RECENT_BATCHES_PAGE_SIZE,
} from "../constants";

export function useRecentBatches() {
  const [recentBatches, setRecentBatches] = useState<ManufacturingEntry[]>([]);
  const [recentBatchesPage, setRecentBatchesPage] = useState(1);
  const [recentBatchesPageSize, setRecentBatchesPageSize] = useState(() =>
    typeof window !== "undefined" && window.innerWidth >= 1024
      ? DESKTOP_RECENT_BATCHES_PAGE_SIZE
      : MOBILE_RECENT_BATCHES_PAGE_SIZE,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updatePageSize = () =>
      setRecentBatchesPageSize(
        mediaQuery.matches ? DESKTOP_RECENT_BATCHES_PAGE_SIZE : MOBILE_RECENT_BATCHES_PAGE_SIZE,
      );

    updatePageSize();
    mediaQuery.addEventListener("change", updatePageSize);

    return () => mediaQuery.removeEventListener("change", updatePageSize);
  }, []);

  useEffect(() => {
    let isMounted = true;

    void fetchManufacturingEntries()
      .then((entries) => {
        if (!isMounted) {
          return;
        }

        const sortedEntries = [...entries].sort((left, right) =>
          `${right.productionDate} ${right.batchNo}`.localeCompare(`${left.productionDate} ${left.batchNo}`),
        );
        setRecentBatches(sortedEntries);
      })
      .catch(() => {
        if (isMounted) {
          setRecentBatches([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const totalRecentBatchPages = Math.max(1, Math.ceil(recentBatches.length / recentBatchesPageSize));
  const visibleRecentBatches = recentBatches.slice(
    (recentBatchesPage - 1) * recentBatchesPageSize,
    recentBatchesPage * recentBatchesPageSize,
  );

  useEffect(() => {
    if (recentBatchesPage > totalRecentBatchPages) {
      setRecentBatchesPage(totalRecentBatchPages);
    }
  }, [recentBatchesPage, totalRecentBatchPages]);

  return {
    recentBatches,
    recentBatchesPage,
    recentBatchesPageSize,
    setRecentBatchesPage,
    totalRecentBatchPages,
    visibleRecentBatches,
  };
}
