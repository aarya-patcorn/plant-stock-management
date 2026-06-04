import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchProductionMaterialLogs, type ProductionMaterialLog } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import LoadingLoader from "@/components/ui/LoadingLoader";

function buildProductLabel(entry: ProductionMaterialLog) {
  return [entry.productCategory, entry.productName, entry.productColor].filter(Boolean).join(" / ");
}

function toNumber(value: string) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function formatCount(value: number) {
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}

export function ProductionMaterialLogsPage() {
  const [entries, setEntries] = useState<ProductionMaterialLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedProductCategory, setSelectedProductCategory] = useState("");
  const [selectedProductName, setSelectedProductName] = useState("");

  useEffect(() => {
    let isMounted = true;

    void fetchProductionMaterialLogs()
      .then((logs) => {
        if (!isMounted) {
          return;
        }

        setEntries(logs);
        setLoadError("");
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setEntries([]);
        setLoadError(error instanceof Error ? error.message : "Unable to fetch production material logs.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const productCategoryOptions = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.productCategory).filter(Boolean))),
    [entries],
  );

  const productNameOptions = useMemo(
    () =>
      Array.from(
        new Set(
          entries
            .filter(
              (entry) =>
                !selectedProductCategory || entry.productCategory === selectedProductCategory,
            )
            .map((entry) => entry.productName)
            .filter(Boolean),
        ),
      ),
    [entries, selectedProductCategory],
  );

  useEffect(() => {
    if (selectedProductName && !productNameOptions.includes(selectedProductName)) {
      setSelectedProductName("");
    }
  }, [productNameOptions, selectedProductName]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const categoryMatch =
        !selectedProductCategory || entry.productCategory === selectedProductCategory;
      const productMatch =
        !selectedProductName || entry.productName === selectedProductName;

      return categoryMatch && productMatch;
    });
  }, [entries, selectedProductCategory, selectedProductName]);

  const sortedEntries = useMemo(
    () =>
      [...filteredEntries].sort((left, right) =>
        `${right.token} ${right.bagSize}`.localeCompare(`${left.token} ${left.bagSize}`),
      ),
    [filteredEntries],
  );

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>All production material logs</CardTitle>
            <CardDescription>Review product-wise stock, available bags, and dispatched bags from production logs.</CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link to="/">
              <ArrowLeft />
              Back to dashboard
            </Link>
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Production material log list</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading production material logs from sheet..."
              : sortedEntries.length === 0
                ? "No production material logs found yet."
                : `${sortedEntries.length} production material logs available.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isLoading && !loadError ? (
            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Product Category</p>
                <Select
                  value={selectedProductCategory}
                  onChange={(event) => setSelectedProductCategory(event.target.value)}
                >
                  <option value="">All Categories</option>
                  {productCategoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Product Name</p>
                <Select
                  value={selectedProductName}
                  onChange={(event) => setSelectedProductName(event.target.value)}
                >
                  <option value="">All Products</option>
                  {productNameOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          ) : null}
          {loadError ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-destructive">{loadError}</div>
          ) : isLoading ? (
            <div className="flex justify-center rounded-md border border-dashed p-6">
              <LoadingLoader />
            </div>
          ) : sortedEntries.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">Production material logs will appear here once available.</div>
          ) : (
            <div className="space-y-3">
              {sortedEntries.map((entry) => (
                <div className="rounded-xl border bg-background/70 p-4" key={entry.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{buildProductLabel(entry) || "Production log"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{entry.token || "Token N/A"}</Badge>
                      <Badge variant="outline">{entry.bagSize || "Bag size N/A"}</Badge>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Current Stock</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {formatCount(toNumber(entry.currentQuantity))}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Available Bags</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {formatCount(toNumber(entry.currentQuantity))}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Dispatched Bags</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {formatCount(toNumber(entry.shippedQuantity))}
                      </p>
                    </div>
                  </div>

                  {entry.remarks ? (
                    <p className="mt-3 text-sm text-muted-foreground">{entry.remarks}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
