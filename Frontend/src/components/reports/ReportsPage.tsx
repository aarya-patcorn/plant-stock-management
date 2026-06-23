import { useEffect, useMemo, useState } from "react";
import {
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
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
import { BarChart3, Download, FileSpreadsheet, FileText, PackageSearch } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import LoadingLoader from "@/components/ui/LoadingLoader";
import { formatDateDDMMYYYY } from "@/pages/dashboard/utils/formatDateDDMMYYYY";
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

type ProductionTableRow = {
  id: string;
  reportMode: "production";
  productCategory: string;
  productName: string;
  totalBagsProduced: number;
  color: string;
  token: string;
  bagSize: string;
  currentQuantity: number;
  availableBags: number;
  dispatchedBags: number;
  stockDate: string;
};

type DispatchTableRow = {
  id: string;
  reportMode: "dispatch";
  date: string;
  productCategory: string;
  productName: string;
  color: string;
  token: string;
  bagSize: string;
  dispatchSite: string;
  vehicleNo: string;
  totalBags: number;
};

type ReportTableRow = ProductionTableRow | DispatchTableRow;

const PIE_COLORS = ["#0f766e", "#f59e0b"];
const BAR_COLOR_PRODUCTION = "#14b8a6";
const BAR_COLOR_DISPATCH = "#fb923c";

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

function buildProductLabel(productCategory: string, productName: string, color: string) {
  return [productCategory, productName, color].filter(Boolean).join(" / ");
}

function buildProductDetails(parts: Array<string | number>) {
  return parts.filter((value) => String(value || "").trim()).join(" | ");
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

function getDefaultSorting(reportType: ReportType): SortingState {
  return reportType === "production"
    ? [{ desc: true, id: "stockDate" }]
    : [{ desc: true, id: "date" }];
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
  const [sorting, setSorting] = useState<SortingState>(() => getDefaultSorting("production"));
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 8,
  });

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
            ...data.productionMaterialLogs.map((entry) => entry.productCategory),
            ...data.dispatchEntries.map((entry) => entry.productCategory),
          ].filter(Boolean),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [data.dispatchEntries, data.manufacturingEntries, data.productionMaterialLogs],
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
        const dateSource = entry.updatedAt || entry.createdAt;
        const dateMatch = isWithinDateRange(dateSource, fromDate, toDate);
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

    return {
      currentStock,
      dispatchStock,
      totalBagsProduced,
      totalDispatchBags,
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

  const productionTableRows = useMemo<ProductionTableRow[]>(
    () =>
      filteredProductionLogs.map((entry) => ({
        id: entry.id,
        reportMode: "production",
        productCategory: entry.productCategory,
        productName: entry.productName,
        totalBagsProduced: parseNumber(entry.currentQuantity) + parseNumber(entry.shippedQuantity),
        color: entry.productColor,
        token: entry.token,
        bagSize: entry.bagSize,
        currentQuantity: parseNumber(entry.currentQuantity),
        availableBags: parseNumber(entry.currentQuantity),
        dispatchedBags: parseNumber(entry.shippedQuantity),
        stockDate: normalizeDateValue(entry.updatedAt || entry.createdAt),
      })),
    [filteredProductionLogs],
  );

  const dispatchTableRows = useMemo<DispatchTableRow[]>(
    () =>
      filteredDispatchEntries.map((entry) => ({
        id: entry.id,
        reportMode: "dispatch",
        date: entry.date,
        productCategory: entry.productCategory,
        productName: entry.productName,
        color: entry.productColor,
        token: entry.token,
        bagSize: entry.bagSize,
        dispatchSite: entry.dispatchSite,
        vehicleNo: entry.vehicleNo,
        totalBags: parseNumber(entry.totalBags),
      })),
    [filteredDispatchEntries],
  );

  const tableData = useMemo<ReportTableRow[]>(
    () => (reportType === "production" ? productionTableRows : dispatchTableRows),
    [dispatchTableRows, productionTableRows, reportType],
  );

  const tableFilterFields = useMemo<FilterFieldConfig[]>(
    () =>
      reportType === "production"
        ? [
          createSelectFilterField("productCategory", "Product Category", createSelectOptions(productionTableRows.map((row) => row.productCategory))),
          createTextFilterField("productName", "Product Name"),
          createSelectFilterField("color", "Color", createSelectOptions(productionTableRows.map((row) => row.color))),
          createSelectFilterField("token", "Token", createSelectOptions(productionTableRows.map((row) => row.token))),
          createSelectFilterField("bagSize", "Bag Size", createSelectOptions(productionTableRows.map((row) => row.bagSize))),
          createNumberFilterField("totalBagsProduced", "Total Stock"),
          createNumberFilterField("currentQuantity", "Current Stock"),
          createNumberFilterField("dispatchedBags", "Dispatched Bags"),
          createDateFilterField("stockDate", "Updated On"),
        ]
        : [
          createDateFilterField("date", "Date"),
          createSelectFilterField("productCategory", "Product Category", createSelectOptions(dispatchTableRows.map((row) => row.productCategory))),
          createTextFilterField("productName", "Product Name"),
          createSelectFilterField("color", "Color", createSelectOptions(dispatchTableRows.map((row) => row.color))),
          createSelectFilterField("token", "Token", createSelectOptions(dispatchTableRows.map((row) => row.token))),
          createSelectFilterField("bagSize", "Bag Size", createSelectOptions(dispatchTableRows.map((row) => row.bagSize))),
          createTextFilterField("dispatchSite", "Dispatch Site"),
          createTextFilterField("vehicleNo", "Vehicle No"),
          createNumberFilterField("totalBags", "Departed Bags"),
        ],
    [dispatchTableRows, productionTableRows, reportType],
  );

  const filteredTableData = useMemo(
    () =>
      applyTableFilters(
        tableData,
        tableFilters,
        reportType === "production"
          ? {
            productCategory: (row) => row.reportMode === "production" ? row.productCategory : "",
            productName: (row) => row.reportMode === "production" ? row.productName : "",
            color: (row) => row.reportMode === "production" ? row.color : "",
            token: (row) => row.reportMode === "production" ? row.token : "",
            bagSize: (row) => row.reportMode === "production" ? row.bagSize : "",
            totalBagsProduced: (row) => row.reportMode === "production" ? row.totalBagsProduced : "",
            currentQuantity: (row) => row.reportMode === "production" ? row.currentQuantity : "",
            dispatchedBags: (row) => row.reportMode === "production" ? row.dispatchedBags : "",
            stockDate: (row) => row.reportMode === "production" ? row.stockDate : "",
          }
          : {
            date: (row) => row.reportMode === "dispatch" ? row.date : "",
            productCategory: (row) => row.reportMode === "dispatch" ? row.productCategory : "",
            productName: (row) => row.reportMode === "dispatch" ? row.productName : "",
            color: (row) => row.reportMode === "dispatch" ? row.color : "",
            token: (row) => row.reportMode === "dispatch" ? row.token : "",
            bagSize: (row) => row.reportMode === "dispatch" ? row.bagSize : "",
            dispatchSite: (row) => row.reportMode === "dispatch" ? row.dispatchSite : "",
            vehicleNo: (row) => row.reportMode === "dispatch" ? row.vehicleNo : "",
            totalBags: (row) => row.reportMode === "dispatch" ? row.totalBags : "",
          },
        reportType === "production"
          ? {
            totalBagsProduced: "number",
            currentQuantity: "number",
            dispatchedBags: "number",
            stockDate: "date",
          }
          : {
            date: "date",
            totalBags: "number",
          },
      ),
    [reportType, tableData, tableFilters],
  );

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [fromDate, toDate, selectedCategory, reportType, tableData.length, tableFilters]);

  const columns = useMemo<ColumnDef<ReportTableRow>[]>(
    () =>
      reportType === "production"
        ? [
          {
            id: "productCategory",
            header: "Product Category",
            accessorFn: (row) => row.reportMode === "production" ? row.productCategory : "",
            cell: ({ row }) =>
              row.original.reportMode === "production" && row.original.productCategory
                ? <DataBadge type="productCategory">{row.original.productCategory}</DataBadge>
                : "-",
          },
          {
            id: "productName",
            header: "Product Name",
            accessorFn: (row) => row.reportMode === "production" ? row.productName : "",
            cell: ({ row }) => (
              <span className="block max-w-[220px] truncate" title={row.original.reportMode === "production" ? row.original.productName || "-" : "-"}>
                {row.original.reportMode === "production" ? row.original.productName || "-" : "-"}
              </span>
            ),
          },
          {
            id: "color",
            header: "Color",
            accessorFn: (row) => row.reportMode === "production" ? row.color : "",
            cell: ({ row }) =>
              row.original.reportMode === "production" && row.original.color
                ? <DataBadge type="color">{row.original.color}</DataBadge>
                : "-",
          },
          {
            id: "token",
            header: "Token",
            accessorFn: (row) => row.reportMode === "production" ? row.token : "",
            cell: ({ row }) =>
              row.original.reportMode === "production" && row.original.token
                ? <DataBadge type="token">{row.original.token}</DataBadge>
                : "-",
          },
          {
            id: "bagSize",
            header: "Bag Size",
            accessorFn: (row) => row.reportMode === "production" ? row.bagSize : "",
            cell: ({ row }) => row.original.reportMode === "production" ? row.original.bagSize || "-" : "-",
          },
          {
            id: "totalBagsProduced",
            header: "Total Stock",
            accessorFn: (row) => row.reportMode === "production" ? row.totalBagsProduced : 0,
            cell: ({ row }) =>
              row.original.reportMode === "production" ? (
                <span className="block text-right">{formatCount(row.original.totalBagsProduced)}</span>
              ) : "-",
          },
          {
            id: "currentQuantity",
            header: "Current Stock",
            accessorFn: (row) => row.reportMode === "production" ? row.currentQuantity : 0,
            cell: ({ row }) =>
              row.original.reportMode === "production" ? (
                <span className="block text-right">{formatCount(row.original.currentQuantity)}</span>
              ) : "-",
          },
          {
            id: "dispatchedBags",
            header: "Dispatched Bags",
            accessorFn: (row) => row.reportMode === "production" ? row.dispatchedBags : 0,
            cell: ({ row }) =>
              row.original.reportMode === "production" ? (
                <span className="block text-right">{formatCount(row.original.dispatchedBags)}</span>
              ) : "-",
          },
          {
            id: "stockDate",
            header: "Updated On",
            accessorFn: (row) => row.reportMode === "production" ? row.stockDate : "",
            cell: ({ row }) => row.original.reportMode === "production" ? formatDateDDMMYYYY(row.original.stockDate) || "-" : "-",
          },
        ]
        : [
          {
            id: "date",
            header: "Date",
            accessorFn: (row) => row.reportMode === "dispatch" ? row.date : "",
            cell: ({ row }) => row.original.reportMode === "dispatch" ? row.original.date || "-" : "-",
          },
          {
            id: "productCategory",
            header: "Product Category",
            accessorFn: (row) => row.reportMode === "dispatch" ? row.productCategory : "",
            cell: ({ row }) =>
              row.original.reportMode === "dispatch" && row.original.productCategory
                ? <DataBadge type="productCategory">{row.original.productCategory}</DataBadge>
                : "-",
          },
          {
            id: "productName",
            header: "Product Name",
            accessorFn: (row) => row.reportMode === "dispatch" ? row.productName : "",
            cell: ({ row }) => (
              <span className="block max-w-[220px] truncate" title={row.original.reportMode === "dispatch" ? row.original.productName || "-" : "-"}>
                {row.original.reportMode === "dispatch" ? row.original.productName || "-" : "-"}
              </span>
            ),
          },
          {
            id: "color",
            header: "Color",
            accessorFn: (row) => row.reportMode === "dispatch" ? row.color : "",
            cell: ({ row }) =>
              row.original.reportMode === "dispatch" && row.original.color
                ? <DataBadge type="color">{row.original.color}</DataBadge>
                : "-",
          },
          {
            id: "token",
            header: "Token",
            accessorFn: (row) => row.reportMode === "dispatch" ? row.token : "",
            cell: ({ row }) =>
              row.original.reportMode === "dispatch" && row.original.token
                ? <DataBadge type="token">{row.original.token}</DataBadge>
                : "-",
          },
          {
            id: "bagSize",
            header: "Bag Size",
            accessorFn: (row) => row.reportMode === "dispatch" ? row.bagSize : "",
            cell: ({ row }) => row.original.reportMode === "dispatch" ? row.original.bagSize || "-" : "-",
          },
          {
            id: "dispatchSite",
            header: "Dispatch Site",
            accessorFn: (row) => row.reportMode === "dispatch" ? row.dispatchSite : "",
            cell: ({ row }) => (
              <span className="block max-w-[180px] truncate" title={row.original.reportMode === "dispatch" ? row.original.dispatchSite || "-" : "-"}>
                {row.original.reportMode === "dispatch" ? row.original.dispatchSite || "-" : "-"}
              </span>
            ),
          },
          {
            id: "vehicleNo",
            header: "Vehicle No",
            accessorFn: (row) => row.reportMode === "dispatch" ? row.vehicleNo : "",
            cell: ({ row }) => (
              <span className="block max-w-[160px] truncate" title={row.original.reportMode === "dispatch" ? row.original.vehicleNo || "-" : "-"}>
                {row.original.reportMode === "dispatch" ? row.original.vehicleNo || "-" : "-"}
              </span>
            ),
          },
          {
            id: "totalBags",
            header: "Departed Bags",
            accessorFn: (row) => row.reportMode === "dispatch" ? row.totalBags : 0,
            cell: ({ row }) =>
              row.original.reportMode === "dispatch" ? (
                <span className="block text-right">{formatCount(row.original.totalBags)}</span>
              ) : "-",
          },
        ],
    [reportType],
  );

  useEffect(() => {
    setTableFilters([]);
    setSorting(getDefaultSorting(reportType));
  }, [reportType]);

  const sortingTable = useReactTable({
    columns,
    data: filteredTableData,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  const sortedExportRows = useMemo(
    () => sortingTable.getSortedRowModel().rows.map((row) => row.original),
    [columns, filteredTableData, sorting, sortingTable],
  );

  const totalPages = Math.max(1, Math.ceil(sortedExportRows.length / pagination.pageSize));

  const paginatedRows = useMemo(
    () =>
      sortedExportRows.slice(
        pagination.pageIndex * pagination.pageSize,
        (pagination.pageIndex + 1) * pagination.pageSize,
      ),
    [pagination.pageIndex, pagination.pageSize, sortedExportRows],
  );

  useEffect(() => {
    if (pagination.pageIndex >= totalPages) {
      setPagination((current) => ({
        ...current,
        pageIndex: Math.max(0, totalPages - 1),
      }));
    }
  }, [pagination.pageIndex, totalPages]);

  const exportCsv = () => {
    if (sortedExportRows.length === 0) {
      return;
    }

    const headers = reportType === "production"
      ? ["Product Category", "Product Name", "Color", "Token", "Bag Size", "Current Stock", "Available Bags", "Dispatched Bags", "Updated On"]
      : ["Date", "Product Category", "Product Name", "Color", "Token", "Bag Size", "Dispatch Site", "Vehicle No", "Departed Bags"];

    const rows = sortedExportRows.map((row) =>
      reportType === "production" && row.reportMode === "production"
        ? [
          row.productCategory,
          row.productName,
          row.color,
          row.token,
          row.bagSize,
          row.currentQuantity,
          row.availableBags,
          row.dispatchedBags,
          row.stockDate,
        ]
        : row.reportMode === "dispatch"
          ? [
            row.date,
            row.productCategory,
            row.productName,
            row.color,
            row.token,
            row.bagSize,
            row.dispatchSite,
            row.vehicleNo,
            row.totalBags,
          ]
          : [],
    );

    const csvText = [headers, ...rows]
      .map((line) => line.map((value) => `"${String(value ?? "").replace(/"/g, "\"\"")}"`).join(","))
      .join("\n");

    downloadFile(
      `reports-${reportType}-${fromDate}-to-${toDate}.csv`,
      csvText,
      "text/csv;charset=utf-8;",
    );
  };

  const exportPdf = () => {
    if (sortedExportRows.length === 0) {
      return;
    }

    const doc = new jsPDF();
    const today = formatDateInput(new Date());
    const categoryLabel = selectedCategory || "All Categories";
    const heading = reportType === "production" ? "Plant stock details" : "Plant dispatch details";

    doc.setFontSize(16);
    doc.text(heading, 14, 18);
    doc.setFontSize(11);
    doc.text(`From date ${fromDate} -> ${toDate}`, 14, 27);
    doc.text(`Date: ${today}`, 14, 35);
    doc.text(`Product Category: ${categoryLabel}`, 14, 43);

    const head = reportType === "production"
      ? [["S. No.", "Product Name", "Product further details", "Stock Quantity"]]
      : [["S. No.", "Product Name", "Product further details", "Departed Quantity"]];

    const body = sortedExportRows.map((row, index) =>
      reportType === "production" && row.reportMode === "production"
        ? [
          index + 1,
          row.productName || "-",
          buildProductDetails([
            row.productCategory,
            row.color,
            row.token,
            row.bagSize,
            `Available: ${row.availableBags}`,
            `Dispatched: ${row.dispatchedBags}`,
          ]),
          formatCount(row.currentQuantity),
        ]
        : row.reportMode === "dispatch"
          ? [
            index + 1,
            row.productName || "-",
            buildProductDetails([
              row.productCategory,
              row.color,
              row.token,
              row.bagSize,
              row.dispatchSite,
              row.vehicleNo,
              row.date,
            ]),
            formatCount(row.totalBags),
          ]
          : [],
    );

    autoTable(doc, {
      body,
      head,
      margin: { left: 14, right: 14, top: 50 },
      styles: {
        fontSize: 10,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [15, 118, 110],
      },
    });

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
          title="Total Production KG"
          value={isLoading || isProductionSummaryLoading ? "..." : formatKgToMt(totalProductionKg)}
        />
        <StatCard
          description="Total bags produced in the selected date range."
          title="Total Bags Produced"
          value={isLoading ? "..." : formatCount(summary.totalBagsProduced)}
        />
        <StatCard
          description="Total departed bags from dispatch records."
          title="Total Departures"
          value={isLoading ? "..." : formatCount(summary.totalDispatchBags)}
        />
        <StatCard
          description="Current product stock from production material logs."
          title="Current Stock"
          value={isLoading ? "..." : formatCount(summary.currentStock)}
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
            <Button disabled={sortedExportRows.length === 0} onClick={exportCsv} type="button" variant="outline">
              <FileSpreadsheet className="size-4" />
              Export CSV
            </Button>
            <Button disabled={sortedExportRows.length === 0} onClick={exportPdf} type="button" variant="outline">
              <FileText className="size-4" />
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-white/70 bg-white/88 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <CardHeader>
            <CardTitle>Production vs Dispatch Stock</CardTitle>
            <CardDescription>Donut chart based on the selected date range and category.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <LoadingLoader />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    innerRadius={78}
                    outerRadius={112}
                    paddingAngle={4}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatTooltipValue(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

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
              <ResponsiveContainer width="100%" height="100%">
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
      </div>

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
            <ResponsiveContainer width="100%" height="100%">
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

      <Card className="border-white/70 bg-white/88 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle>{reportType === "production" ? "Production Details" : "Dispatch Details"}</CardTitle>
            <CardDescription>
              {tableData.length === 0
                ? "No rows available for the selected filter."
                : `${filteredTableData.length} rows available for the selected filter.`}
            </CardDescription>
          </div>
          <Badge variant="outline">{selectedCategory || "All Categories"}</Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center rounded-md border border-dashed p-6">
              <LoadingLoader />
            </div>
          ) : filteredTableData.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No report rows found for the selected filter.
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                data={paginatedRows}
                emptyMessage="No report rows found for the selected filter."
                manualSorting
                onSortingChange={setSorting}
                sorting={sorting}
              />

              <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {pagination.pageIndex * pagination.pageSize + 1}-
                  {Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredTableData.length)} of {filteredTableData.length}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.pageIndex + 1} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      disabled={pagination.pageIndex === 0}
                      onClick={() =>
                        setPagination((current) => ({
                          ...current,
                          pageIndex: Math.max(0, current.pageIndex - 1),
                        }))
                      }
                      type="button"
                      variant="outline"
                    >
                      Previous
                    </Button>
                    <Button
                      disabled={pagination.pageIndex + 1 >= totalPages}
                      onClick={() =>
                        setPagination((current) => ({
                          ...current,
                          pageIndex: Math.min(totalPages - 1, current.pageIndex + 1),
                        }))
                      }
                      type="button"
                      variant="outline"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}











