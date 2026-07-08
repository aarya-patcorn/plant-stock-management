import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BarChart3, FileSpreadsheet, FileText } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  fetchDashboardReports,
  fetchDispatchEntries,
  fetchManufacturingEntries,
  fetchProductionMaterialLogs,
  type DashboardReportCategory,
  type DispatchEntry,
  type ManufacturingEntry,
  type ProductionMaterialLog,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataBadge, DataTable } from "@/components/ui/DataTable";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import { Select } from "@/components/ui/select";
import { TooltipText } from "@/components/ui/tooltip-text";
import LoadingLoader from "@/components/ui/LoadingLoader";
import {
  TableFiltersBar,
  type Filter,
  type FilterFieldConfig,
  createDateFilterField,
  createNumberFilterField,
  createSelectFilterField,
  createSelectOptions,
  createTextFilterField,
} from "@/components/ui/table-filters";
import { applyTableFilters } from "@/lib/tableFilters";

type ReportType = "production" | "dispatch";

type ReportsData = {
  dispatchEntries: DispatchEntry[];
  manufacturingEntries: ManufacturingEntry[];
  productionMaterialLogs: ProductionMaterialLog[];
};

const PIE_COLORS = ["#0f766e", "#f59e0b"];
const BAR_COLOR_PRODUCTION = "#14b8a6";
const BAR_COLOR_DISPATCH = "#fb923c";
const ENTRIES_PER_PAGE = 10;
const EMPTY_PRODUCT_ITEM = {
  token: "",
  bagSize: "",
  totalBagsProduced: "",
};

function parseNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatCount(value: number) {
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}

function formatKgToMt(value: number) {
  return `${formatCount(value / 1000)} mt`;
}

function formatTooltipValue(value: unknown) {
  return formatCount(parseNumber(value));
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB").replace(/\//g, "-");
}

function getCurrentMonthDateRange() {
  const today = new Date();
  return {
    fromDate: formatDateInput(new Date(today.getFullYear(), today.getMonth(), 1)),
    toDate: formatDateInput(today),
  };
}

function normalizeDateValue(value: string) {
  const trimmed = String(value || "").trim();

  if (!trimmed) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-CA", { timeZone: "UTC" });
}

function isWithinDateRange(value: string, fromDate: string, toDate: string) {
  const normalized = normalizeDateValue(value);

  if (!normalized) {
    return false;
  }

  return normalized >= fromDate && normalized <= toDate;
}

function parseBagSizeKg(value: unknown) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return 0;
  }

  const match = normalized.match(/(\d+(?:\.\d+)?)/i);
  return match ? parseNumber(match[1]) : 0;
}

function buildProductLabel(productCategory: string, productName: string, color: string) {
  return [productCategory, productName, color].filter(Boolean).join(" / ");
}

function buildManufacturingLabel(entry: ManufacturingEntry) {
  return [entry.productCategory, entry.finishedProductName, entry.color].filter(Boolean).join(" / ");
}

function buildDispatchLabel(entry: DispatchEntry) {
  return [entry.productCategory, entry.productName, entry.productColor].filter(Boolean).join(" / ");
}

function buildProductDetails(parts: Array<string | number>) {
  return parts.filter((value) => String(value || "").trim()).join(" | ");
}

function getProductItems(entry: ManufacturingEntry) {
  return entry.productItems.length > 0 ? entry.productItems : [EMPTY_PRODUCT_ITEM];
}

function formatProductItems(entry: ManufacturingEntry) {
  return getProductItems(entry)
    .map((item) =>
      [
        item.token,
        item.bagSize,
        item.totalBagsProduced ? `${item.totalBagsProduced} qty` : "",
      ].filter(Boolean).join(" / "),
    )
    .join(", ");
}

function downloadFile(filename: string, content: BlobPart, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

function StatCard({
  description,
  title,
  value,
}: {
  description: string;
  title: string;
  value: string;
}) {
  return (
    <Card className="overflow-hidden border-white/70 bg-white/88 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <CardContent className="relative p-5">
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#0f766e_0%,#14b8a6_55%,#f59e0b_100%)]" />
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function ReportsPage() {
  const initialRange = useMemo(() => getCurrentMonthDateRange(), []);
  const [data, setData] = useState<ReportsData>({
    dispatchEntries: [],
    manufacturingEntries: [],
    productionMaterialLogs: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [productionSummaryByCategory, setProductionSummaryByCategory] = useState<DashboardReportCategory[]>([]);
  const [isProductionSummaryLoading, setIsProductionSummaryLoading] = useState(true);
  const [reportType, setReportType] = useState<ReportType>("production");
  const [fromDate, setFromDate] = useState(initialRange.fromDate);
  const [toDate, setToDate] = useState(initialRange.toDate);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [tableFilters, setTableFilters] = useState<Filter[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      fetchManufacturingEntries(),
      fetchProductionMaterialLogs(),
      fetchDispatchEntries(),
    ])
      .then(([manufacturingEntries, productionMaterialLogs, dispatchEntries]) => {
        if (!isMounted) {
          return;
        }

        setData({
          dispatchEntries,
          manufacturingEntries,
          productionMaterialLogs,
        });
        setLoadError("");
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setData({
          dispatchEntries: [],
          manufacturingEntries: [],
          productionMaterialLogs: [],
        });
        setLoadError(error instanceof Error ? error.message : "Unable to load reports data.");
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

  useEffect(() => {
    let isMounted = true;

    if (!fromDate || !toDate || fromDate > toDate) {
      setProductionSummaryByCategory([]);
      setIsProductionSummaryLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setIsProductionSummaryLoading(true);

    void fetchDashboardReports(fromDate, toDate)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setProductionSummaryByCategory(response.productionByCategory);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setProductionSummaryByCategory([]);
      })
      .finally(() => {
        if (isMounted) {
          setIsProductionSummaryLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fromDate, toDate]);

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...data.manufacturingEntries.map((entry) => entry.productCategory),
            ...data.dispatchEntries.map((entry) => entry.productCategory),
          ].filter(Boolean),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [data.dispatchEntries, data.manufacturingEntries],
  );

  const filteredManufacturingEntries = useMemo(
    () =>
      data.manufacturingEntries.filter((entry) => {
        const categoryMatch = !selectedCategory || entry.productCategory === selectedCategory;
        const dateMatch = isWithinDateRange(entry.productionDate, fromDate, toDate);
        return categoryMatch && dateMatch;
      }),
    [data.manufacturingEntries, fromDate, selectedCategory, toDate],
  );

  const filteredProductionLogs = useMemo(
    () =>
      data.productionMaterialLogs.filter((entry) => {
        const categoryMatch = !selectedCategory || entry.productCategory === selectedCategory;
        const dateMatch =
          isWithinDateRange(entry.updatedAt, fromDate, toDate) ||
          isWithinDateRange(entry.createdAt, fromDate, toDate);
        return categoryMatch && dateMatch;
      }),
    [data.productionMaterialLogs, fromDate, selectedCategory, toDate],
  );

  const filteredDispatchEntries = useMemo(
    () =>
      data.dispatchEntries.filter((entry) => {
        const categoryMatch = !selectedCategory || entry.productCategory === selectedCategory;
        const dateMatch = isWithinDateRange(entry.date, fromDate, toDate);
        return categoryMatch && dateMatch;
      }),
    [data.dispatchEntries, fromDate, selectedCategory, toDate],
  );

  const summary = useMemo(() => {
    const totalBagsProduced = filteredManufacturingEntries.reduce(
      (sum, entry) => sum + parseNumber(entry.totalBagsProduced),
      0,
    );
    const totalDispatchBags = filteredDispatchEntries.reduce(
      (sum, entry) => sum + parseNumber(entry.totalBags),
      0,
    );
    const currentStock = filteredProductionLogs.reduce(
      (sum, entry) => sum + parseNumber(entry.currentQuantity),
      0,
    );
    const dispatchStock = filteredProductionLogs.reduce(
      (sum, entry) => sum + parseNumber(entry.shippedQuantity),
      0,
    );
    const totalDispatch = filteredDispatchEntries.reduce(
      (sum, entry) => sum + parseBagSizeKg(entry.bagSize) * parseNumber(entry.totalBags),
      0,
    );

    return {
      currentStock,
      dispatchStock,
      totalBagsProduced,
      totalDispatchBags,
      totalDispatch,
    };
  }, [filteredDispatchEntries, filteredManufacturingEntries, filteredProductionLogs]);

  const totalProductionKg = useMemo(() => {
    if (selectedCategory) {
      return productionSummaryByCategory.find((entry) => entry.productCategory === selectedCategory)?.totalProductionKg || 0;
    }

    return productionSummaryByCategory.reduce((sum, entry) => sum + entry.totalProductionKg, 0);
  }, [productionSummaryByCategory, selectedCategory]);

  const productionBarData = useMemo(() => {
    const grouped = new Map<string, { label: string; value: number }>();

    filteredManufacturingEntries.forEach((entry) => {
      const key = buildProductLabel(entry.productCategory, entry.finishedProductName, entry.color);
      const current = grouped.get(key) || { label: key || "Production item", value: 0 };
      current.value += parseNumber(entry.totalBagsProduced);
      grouped.set(key, current);
    });

    return Array.from(grouped.values())
      .sort((left, right) => right.value - left.value)
      .slice(0, 5);
  }, [filteredManufacturingEntries]);

  const dispatchBarData = useMemo(() => {
    const grouped = new Map<string, { label: string; value: number }>();

    filteredDispatchEntries.forEach((entry) => {
      const key = buildProductLabel(entry.productCategory, entry.productName, entry.productColor);
      const current = grouped.get(key) || { label: key || "Dispatch item", value: 0 };
      current.value += parseNumber(entry.totalBags);
      grouped.set(key, current);
    });

    return Array.from(grouped.values())
      .sort((left, right) => right.value - left.value)
      .slice(0, 5);
  }, [filteredDispatchEntries]);

  const donutData = useMemo(
    () => [
      { name: "Production Stock", value: summary.currentStock },
      { name: "Dispatch Stock", value: summary.dispatchStock },
    ],
    [summary.currentStock, summary.dispatchStock],
  );

  const sortedManufacturingEntries = useMemo(
    () =>
      [...filteredManufacturingEntries].sort((left, right) =>
        `${right.productionDate} ${right.batchNo}`.localeCompare(`${left.productionDate} ${left.batchNo}`),
      ),
    [filteredManufacturingEntries],
  );

  const sortedDispatchEntries = useMemo(
    () => [...filteredDispatchEntries].sort((left, right) => `${right.date} ${right.time}`.localeCompare(`${left.date} ${left.time}`)),
    [filteredDispatchEntries],
  );

  const manufacturingFilterFields = useMemo<FilterFieldConfig[]>(
    () => [
      createDateFilterField("productionDate", "Date"),
      createTextFilterField("batchNo", "Batch No"),
      createSelectFilterField("tphBatch", "Batch Type", createSelectOptions(sortedManufacturingEntries.map((entry) => entry.tphBatch))),
      createSelectFilterField("productCategory", "Category", createSelectOptions(sortedManufacturingEntries.map((entry) => entry.productCategory))),
      createTextFilterField("finishedProductName", "Product"),
      createSelectFilterField("color", "Color", createSelectOptions(sortedManufacturingEntries.map((entry) => entry.color))),
      createNumberFilterField("totalBagsProduced", "Total Quantity"),
      createNumberFilterField("wastageQty", "Wastage"),
      createSelectFilterField("user", "Entry By", createSelectOptions(sortedManufacturingEntries.map((entry) => entry.user))),
    ],
    [sortedManufacturingEntries],
  );

  const dispatchFilterFields = useMemo<FilterFieldConfig[]>(
    () => [
      createDateFilterField("date", "Date"),
      createTextFilterField("challan", "Challan"),
      createSelectFilterField("productCategory", "Category", createSelectOptions(sortedDispatchEntries.map((entry) => entry.productCategory))),
      createTextFilterField("productName", "Product"),
      createSelectFilterField("token", "Token", createSelectOptions(sortedDispatchEntries.map((entry) => entry.token))),
      createSelectFilterField("bagSize", "Bag Size", createSelectOptions(sortedDispatchEntries.map((entry) => entry.bagSize))),
      createNumberFilterField("totalBags", "Departed Bags"),
      createTextFilterField("dispatchSite", "Dispatch Site"),
      createTextFilterField("vehicleNo", "Vehicle No"),
      createSelectFilterField("user", "Entry By", createSelectOptions(sortedDispatchEntries.map((entry) => entry.user))),
    ],
    [sortedDispatchEntries],
  );

  const filteredManufacturingTableEntries = useMemo(
    () =>
      applyTableFilters(
        sortedManufacturingEntries,
        tableFilters,
        {
          productionDate: (entry) => entry.productionDate,
          batchNo: (entry) => entry.batchNo,
          tphBatch: (entry) => entry.tphBatch,
          productCategory: (entry) => entry.productCategory,
          finishedProductName: (entry) => entry.finishedProductName,
          color: (entry) => entry.color,
          totalBagsProduced: (entry) => entry.totalBagsProduced,
          wastageQty: (entry) => entry.wastageQty,
          user: (entry) => entry.user,
        },
        {
          productionDate: "date",
          totalBagsProduced: "number",
          wastageQty: "number",
        },
      ),
    [sortedManufacturingEntries, tableFilters],
  );

  const filteredDispatchTableEntries = useMemo(
    () =>
      applyTableFilters(
        sortedDispatchEntries,
        tableFilters,
        {
          date: (entry) => entry.date,
          challan: (entry) => entry.challanNo || entry.challanName,
          productCategory: (entry) => entry.productCategory,
          productName: (entry) => entry.productName,
          token: (entry) => entry.token,
          bagSize: (entry) => entry.bagSize,
          totalBags: (entry) => entry.totalBags,
          dispatchSite: (entry) => entry.dispatchSite,
          vehicleNo: (entry) => entry.vehicleNo,
          user: (entry) => entry.user,
        },
        {
          date: "date",
          totalBags: "number",
        },
      ),
    [sortedDispatchEntries, tableFilters],
  );

  const activeTableCount = reportType === "production"
    ? filteredManufacturingTableEntries.length
    : filteredDispatchTableEntries.length;
  const totalPages = Math.max(1, Math.ceil(activeTableCount / ENTRIES_PER_PAGE));

  const paginatedManufacturingEntries = useMemo(
    () => filteredManufacturingTableEntries.slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE),
    [currentPage, filteredManufacturingTableEntries],
  );

  const paginatedDispatchEntries = useMemo(
    () => filteredDispatchTableEntries.slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE),
    [currentPage, filteredDispatchTableEntries],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [fromDate, toDate, selectedCategory, reportType, tableFilters]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setTableFilters([]);
  }, [reportType]);

  const manufacturingColumns = useMemo<ColumnDef<ManufacturingEntry>[]>(
    () => [
      {
        accessorKey: "productionDate",
        header: "Date",
        cell: ({ row }) => formatDisplayDate(row.original.productionDate),
      },
      {
        accessorKey: "batchNo",
        header: "Batch No",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[140px] truncate" content={row.original.batchNo || "-"}>
            {row.original.batchNo || "-"}
          </TooltipText>
        ),
      },
      {
        accessorKey: "tphBatch",
        header: "Batch Type",
        cell: ({ row }) => row.original.tphBatch || "-",
      },
      {
        accessorKey: "productCategory",
        header: "Category",
        cell: ({ row }) =>
          row.original.productCategory ? (
            <DataBadge type="productCategory">{row.original.productCategory}</DataBadge>
          ) : (
            "-"
          ),
      },
      {
        accessorKey: "finishedProductName",
        header: "Product",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[220px] truncate" content={row.original.finishedProductName || "-"}>
            {row.original.finishedProductName || "-"}
          </TooltipText>
        ),
      },
      {
        accessorKey: "color",
        header: "Color",
        cell: ({ row }) =>
          row.original.color ? <DataBadge type="color">{row.original.color}</DataBadge> : "-",
      },
      {
        id: "productItems",
        accessorFn: (row) => formatProductItems(row),
        header: "Product Items",
        cell: ({ row }) => (
          <TooltipText as="span" className="block min-w-[260px] max-w-[320px] truncate" content={formatProductItems(row.original) || "-"}>
            {formatProductItems(row.original) || "-"}
          </TooltipText>
        ),
      },
      {
        accessorKey: "totalBagsProduced",
        header: "Total Quantity",
        cell: ({ row }) => row.original.totalBagsProduced || "-",
      },
      {
        accessorKey: "wastageQty",
        header: "Wastage",
        cell: ({ row }) => row.original.wastageQty || "-",
      },
      {
        id: "rawMaterials",
        accessorFn: (row) => [row.rawMaterialNames, row.rawMaterialQty, row.rawMaterialUnits].filter(Boolean).join(" / "),
        header: "Raw Materials",
        cell: ({ row }) => {
          const value = [row.original.rawMaterialNames, row.original.rawMaterialQty, row.original.rawMaterialUnits]
            .filter(Boolean)
            .join(" / ");
          return (
            <TooltipText as="span" className="block max-w-[220px] truncate" content={value || "-"}>
              {value || "-"}
            </TooltipText>
          );
        },
      },
      {
        accessorKey: "user",
        header: "Entry By",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[220px] truncate" content={row.original.user || "-"}>
            {row.original.user || "-"}
          </TooltipText>
        ),
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[220px] truncate" content={row.original.remarks || "-"}>
            {row.original.remarks || "-"}
          </TooltipText>
        ),
      },
    ],
    [],
  );

  const dispatchColumns = useMemo<ColumnDef<DispatchEntry>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => formatDisplayDate(row.original.date),
      },
      {
        accessorKey: "time",
        header: "Time",
        cell: ({ row }) => row.original.time || "-",
      },
      {
        id: "challan",
        accessorFn: (row) => row.challanNo || row.challanName || "",
        header: "Challan",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[160px] truncate" content={row.original.challanNo || row.original.challanName || "-"}>
            {row.original.challanNo || row.original.challanName || "-"}
          </TooltipText>
        ),
      },
      {
        id: "product",
        accessorFn: (row) => buildDispatchLabel(row),
        header: "Product",
        cell: ({ row }) => (
          <div className="min-w-[220px] max-w-[260px] space-y-1">
            <TooltipText as="p" className="truncate font-medium text-slate-900" content={buildDispatchLabel(row.original) || "-"}>
              {buildDispatchLabel(row.original) || "-"}
            </TooltipText>
            {row.original.productCategory ? (
              <DataBadge type="productCategory">{row.original.productCategory}</DataBadge>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "token",
        header: "Token",
        cell: ({ row }) =>
          row.original.token ? <DataBadge type="token">{row.original.token}</DataBadge> : "-",
      },
      {
        accessorKey: "bagSize",
        header: "Bag Size",
        cell: ({ row }) => row.original.bagSize || "-",
      },
      {
        accessorKey: "totalBags",
        header: "Departed Bags",
        cell: ({ row }) => row.original.totalBags || "-",
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) => {
          const bagSize = parseBagSizeKg(row.original.bagSize);
          return `${bagSize * parseNumber(row.original.totalBags)} KG`;
        },
      },
      {
        accessorKey: "vehicleNo",
        header: "Vehicle",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[140px] truncate" content={row.original.vehicleNo || "-"}>
            {row.original.vehicleNo || "-"}
          </TooltipText>
        ),
      },
      {
        accessorKey: "driverName",
        header: "Driver",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[140px] truncate" content={row.original.driverName || "-"}>
            {row.original.driverName || "-"}
          </TooltipText>
        ),
      },
      {
        accessorKey: "dispatchSite",
        header: "Dispatch Site",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[160px] truncate" content={row.original.dispatchSite || "-"}>
            {row.original.dispatchSite || "-"}
          </TooltipText>
        ),
      },
      {
        accessorKey: "user",
        header: "Entry By",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[160px] truncate" content={row.original.user || "-"}>
            {row.original.user || "-"}
          </TooltipText>
        ),
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[180px] truncate" content={row.original.remarks || "-"}>
            {row.original.remarks || "-"}
          </TooltipText>
        ),
      },
    ],
    [],
  );

  const exportCsv = () => {
    if (reportType === "production") {
      if (filteredManufacturingTableEntries.length === 0) {
        return;
      }

      const headers = [
        "Date",
        "Batch No",
        "Batch Type",
        "Category",
        "Product",
        "Color",
        "Product Items",
        "Total Quantity",
        "Wastage",
        "Raw Materials",
        "Entry By",
        "Remarks",
      ];

      const rows = filteredManufacturingTableEntries.map((row) => [
        row.productionDate,
        row.batchNo,
        row.tphBatch,
        row.productCategory,
        row.finishedProductName,
        row.color,
        formatProductItems(row),
        row.totalBagsProduced,
        row.wastageQty,
        [row.rawMaterialNames, row.rawMaterialQty, row.rawMaterialUnits].filter(Boolean).join(" / "),
        row.user,
        row.remarks,
      ]);

      const csvText = [headers, ...rows]
        .map((line) => line.map((value) => `"${String(value ?? "").replace(/"/g, "\"\"")}"`).join(","))
        .join("\n");

      downloadFile(`reports-${reportType}-${fromDate}-to-${toDate}.csv`, csvText, "text/csv;charset=utf-8;");
      return;
    }

    if (filteredDispatchTableEntries.length === 0) {
      return;
    }

    const headers = [
      "Date",
      "Time",
      "Challan",
      "Product",
      "Token",
      "Bag Size",
      "Departed Bags",
      "Quantity",
      "Vehicle",
      "Driver",
      "Dispatch Site",
      "Entry By",
      "Remarks",
    ];

    const rows = filteredDispatchTableEntries.map((row) => [
      row.date,
      row.time,
      row.challanNo || row.challanName,
      buildDispatchLabel(row),
      row.token,
      row.bagSize,
      row.totalBags,
      row.wastageQty,
      row.vehicleNo,
      row.driverName,
      row.dispatchSite,
      row.user,
      row.remarks,
    ]);

    const csvText = [headers, ...rows]
      .map((line) => line.map((value) => `"${String(value ?? "").replace(/"/g, "\"\"")}"`).join(","))
      .join("\n");

    downloadFile(`reports-${reportType}-${fromDate}-to-${toDate}.csv`, csvText, "text/csv;charset=utf-8;");
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    const today = formatDateInput(new Date());
    const categoryLabel = selectedCategory || "All Categories";

    doc.setFontSize(16);
    doc.text(reportType === "production" ? "Plant production details" : "Plant dispatch details", 14, 18);
    doc.setFontSize(11);
    doc.text(`From date ${fromDate} -> ${toDate}`, 14, 27);
    doc.text(`Date: ${today}`, 14, 35);
    doc.text(`Product Category: ${categoryLabel}`, 14, 43);

    if (reportType === "production") {
      if (filteredManufacturingTableEntries.length === 0) {
        return;
      }

      const body = filteredManufacturingTableEntries.map((row, index) => [
        index + 1,
        row.finishedProductName || "-",
        buildProductDetails([
          row.productCategory,
          row.color,
          row.batchNo,
          row.tphBatch,
          formatProductItems(row),
          [row.rawMaterialNames, row.rawMaterialQty, row.rawMaterialUnits].filter(Boolean).join(" / "),
          row.productionDate,
        ]),
        row.totalBagsProduced || "-",
      ]);

      autoTable(doc, {
        body,
        head: [["S. No.", "Product Name", "Product further details", "Total Quantity"]],
        margin: { left: 14, right: 14, top: 50 },
        styles: {
          fontSize: 10,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [15, 118, 110],
        },
      });
    } else {
      if (filteredDispatchTableEntries.length === 0) {
        return;
      }

      const body = filteredDispatchTableEntries.map((row, index) => [
        index + 1,
        row.productName || "-",
        buildProductDetails([
          row.productCategory,
          row.productColor,
          row.token,
          row.bagSize,
          row.dispatchSite,
          row.vehicleNo,
          row.date,
        ]),
        formatCount(parseNumber(row.totalBags)),
      ]);

      autoTable(doc, {
        body,
        head: [["S. No.", "Product Name", "Product further details", "Departed Quantity"]],
        margin: { left: 14, right: 14, top: 50 },
        styles: {
          fontSize: 10,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [15, 118, 110],
        },
      });
    }

    doc.text("Sincerely,", 14, doc.internal.pageSize.getHeight() - 26);
    doc.text("Guma Plant", 14, doc.internal.pageSize.getHeight() - 20);
    doc.text("Kamdhenu Adhesives Plant, Guma, Raipur, (C.G.)", 14, doc.internal.pageSize.getHeight() - 14);

    doc.save(`reports-${reportType}-${fromDate}-to-${toDate}.pdf`);
  };

  return (
    <div className="space-y-6">
      {loadError ? (
        <div className="rounded-lg border border-dashed border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description="Production quantity in MT for the selected filter."
          title="Total Production MT"
          value={isLoading || isProductionSummaryLoading ? "..." : formatKgToMt(totalProductionKg)}
        />
        <StatCard
          description="Total bags produced in the selected date range."
          title="Total Bags Produced"
          value={isLoading ? "..." : formatCount(summary.totalBagsProduced)}
        />
        <StatCard
          description="Total departed bags from dispatch records."
          title="Total Departures MT"
          value={isLoading ? "..." : formatKgToMt(summary.totalDispatch)}
        />
        <StatCard
          description="Total departed bags from dispatch records."
          title="Total Bags Dispatched"
          value={isLoading ? "..." : formatCount(summary.totalDispatchBags)}
        />
      </div>

      <Card className="border-white/70 bg-white/88 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select filter criteria, then analyze or export the report.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">From Date</p>
              <DatePickerInput name="fromDate" id="fromDate" value={fromDate} onChange={(value) => setFromDate(value)} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">To Date</p>
              <DatePickerInput name="toDate" id="toDate" value={toDate} onChange={(value) => setToDate(value)} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Product Category</p>
              <Select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                <option value="">All Categories</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Report Type</p>
              <Select value={reportType} onChange={(event) => setReportType(event.target.value as ReportType)}>
                <option value="production">Production</option>
                <option value="dispatch">Dispatch</option>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              disabled={reportType === "production" ? filteredManufacturingTableEntries.length === 0 : filteredDispatchTableEntries.length === 0}
              onClick={exportCsv}
              type="button"
              variant="outline"
            >
              <FileSpreadsheet className="size-4" />
              Export CSV
            </Button>
            <Button
              disabled={reportType === "production" ? filteredManufacturingTableEntries.length === 0 : filteredDispatchTableEntries.length === 0}
              onClick={exportPdf}
              type="button"
              variant="outline"
            >
              <FileText className="size-4" />
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">

        <Card className="border-white/70 bg-white/88 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <CardHeader>
            <CardTitle>Most Produced Items</CardTitle>
            <CardDescription>Top produced items by total bags in the filtered period.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <LoadingLoader />
              </div>
            ) : productionBarData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                No production data available for this filter.
              </div>
            ) : (
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={productionBarData} layout="vertical" margin={{ left: 8, right: 18, top: 10, bottom: 10 }}>
                  <XAxis type="number" />
                  <YAxis dataKey="label" type="category" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatTooltipValue(value)} />
                  <Bar dataKey="value" fill={BAR_COLOR_PRODUCTION} radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/88 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Most Dispatched Items</CardTitle>
                <CardDescription>Top dispatched items by departed bags in the filtered period.</CardDescription>
              </div>
              <Badge variant="outline">
                <BarChart3 className="mr-2 size-4" />
                {reportType === "production" ? "Production details table below" : "Dispatch details table below"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[320px]">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <LoadingLoader />
              </div>
            ) : dispatchBarData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                No dispatch data available for this filter.
              </div>
            ) : (
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={dispatchBarData} margin={{ left: 8, right: 18, top: 10, bottom: 10 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} angle={-12} textAnchor="end" height={72} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatTooltipValue(value)} />
                  <Bar dataKey="value" fill={BAR_COLOR_DISPATCH} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/70 bg-white/88 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle>{reportType === "production" ? "Production Details" : "Dispatch Details"}</CardTitle>
            <CardDescription>
              {activeTableCount === 0
                ? "No rows available for the selected filter."
                : `${activeTableCount} rows available for the selected filter.`}
            </CardDescription>
          </div>
          <Badge variant="outline">{selectedCategory || "All Categories"}</Badge>
        </CardHeader>
        <CardContent>
          {!isLoading && !loadError && (reportType === "production" ? sortedManufacturingEntries.length > 0 : sortedDispatchEntries.length > 0) ? (
            <div className="mb-5">
              <TableFiltersBar
                fields={reportType === "production" ? manufacturingFilterFields : dispatchFilterFields}
                filters={tableFilters}
                onChange={setTableFilters}
              />
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex justify-center rounded-md border border-dashed p-6">
              <LoadingLoader />
            </div>
          ) : activeTableCount === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No report rows found for the selected filter.
            </div>
          ) : reportType === "production" ? (
            <>
              <div className="space-y-4 lg:hidden">
                {paginatedManufacturingEntries.map((entry) => (
                  <Card key={entry.id} className="rounded-md border shadow-none">
                    <CardContent className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{buildManufacturingLabel(entry) || "Production entry"}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{entry.batchNo || entry.id}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Date</p>
                          <p className="mt-1">{formatDisplayDate(entry.productionDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Entry By</p>
                          <p className="mt-1">{entry.user || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Batch Type</p>
                          <p className="mt-1">{entry.tphBatch || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Product Items</p>
                          <p className="mt-1">{formatProductItems(entry) || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Total Quantity</p>
                          <p className="mt-1">{entry.totalBagsProduced || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Wastage</p>
                          <p className="mt-1">{entry.wastageQty || "-"}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase text-muted-foreground">Raw Materials</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {[entry.rawMaterialNames, entry.rawMaterialQty, entry.rawMaterialUnits].filter(Boolean).join(" / ") || "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase text-muted-foreground">Remarks</p>
                        <p className="mt-1 text-sm text-muted-foreground">{entry.remarks || "-"}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="hidden lg:block">
                <DataTable
                  columns={manufacturingColumns}
                  data={paginatedManufacturingEntries}
                  emptyMessage="No production entries available."
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4 lg:hidden">
                {paginatedDispatchEntries.map((entry) => (
                  <Card key={entry.id} className="rounded-md border shadow-none">
                    <CardContent className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{buildDispatchLabel(entry) || "Dispatch entry"}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{entry.challanNo || entry.id}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Date</p>
                          <p className="mt-1">{formatDisplayDate(entry.date)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Time</p>
                          <p className="mt-1">{entry.time || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Token</p>
                          <p className="mt-1">{entry.token || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Bag Size</p>
                          <p className="mt-1">{entry.bagSize || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Stock</p>
                          <p className="mt-1">{entry.quantity || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Departed Bags</p>
                          <p className="mt-1">{entry.totalBags || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Wastage Qty</p>
                          <p className="mt-1">{entry.wastageQty || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Remarks</p>
                          <p className="mt-1">{entry.remarks || "-"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Vehicle</p>
                          <p className="mt-1">{entry.vehicleNo || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Site</p>
                          <p className="mt-1">{entry.dispatchSite || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Entry By</p>
                          <p className="mt-1">{entry.user || "-"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="hidden lg:block">
                <DataTable
                  columns={dispatchColumns}
                  data={paginatedDispatchEntries}
                  emptyMessage="No dispatch entries available."
                />
              </div>
            </>
          )}

          {!isLoading && activeTableCount > 0 ? (
            <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ENTRIES_PER_PAGE + 1}-{Math.min(currentPage * ENTRIES_PER_PAGE, activeTableCount)} of {activeTableCount}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}


