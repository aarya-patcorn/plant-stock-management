import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Pencil, Save } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DataBadge, DataTable } from "@/components/ui/DataTable";
import { Textarea } from "@/components/ui/textarea";
import { TooltipText } from "@/components/ui/tooltip-text";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  fetchPurchaseEntries,
  type PurchaseEntry,
  updatePurchaseEntry,
} from "@/lib/api";
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
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "../ui/pagination";


const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const rawMaterialOptions = ["Cement", "Sand", "Chemical", "Packaging", "Other"];
const unitOptions = ["kg", "ltr", "pcs", "bags", "ml", "nos", "others"];
const packagingBagColorOptions = ["White", "Grey"];
const packagingBagOptions = ["K50", "K60", "K70", "K80", "K90", "Kamdhenu X"];
const bucketSizeOptions = ["1L", "5L"];
const unloadByOptions = ["Sujeet", "Thailesh", "Vashu"];
const EDIT_SHEET_ANIMATION_MS = 300;

type MaterialConfig = {
  label: string;
  options: string[];
  children?: Record<string, MaterialConfig>;
};

type RawMaterialName = "Cement" | "Sand" | "Chemical" | "Packaging";
type RawMaterialOption = RawMaterialName | "Other" | "";

const rawMaterialConfig: Record<RawMaterialName, MaterialConfig> = {
  Cement: {
    label: "Cement Type",
    options: ["PPC", "OPC", "White Cement"],
    children: {
      PPC: { label: "Packaging Type", options: ["Silo"] },
      OPC: { label: "Packaging Type", options: ["Silo"] },
      "White Cement": { label: "Packaging Type", options: ["Bag"] },
    },
  },
  Sand: {
    label: "Sand Type",
    options: ["Grey", "White"],
    children: {
      Grey: { label: "Sand Size", options: ["Small (600 micron)", "Big (1200 micron)"] },
    },
  },
  Chemical: {
    label: "Select Chemical Type",
    options: ["Tile Adhesive", "Tile Grout", "Epoxy", "Tile Cleaner"],
    children: {
      Epoxy: {
        label: "Select Chemical",
        options: [
          "Resin",
          "Byk",
          "Benton",
          "White Colour Sand",
          "Black Colour Sand",
          "Ivory Colour Sand",
          "Blue Colour Sand",
          "Slate Grey Colour Sand",
          "Light Grey Colour Sand",
          "Dark Grey Colour Sand",
          "Coffee Brown Colour Sand",
          "Jaisalmer Colour Sand",
          "Sabal Colour Sand",
          "Savetrane Colour Sand",
          "Terracotta Colour Sand",
        ],
      },
      "Tile Cleaner": {
        label: "Select Chemical",
        options: [
          "Urea (Technical Grade)",
          "Sulphamic Acid",
          "Hydrochloric Acid (32%)",
          "Citric Acid",
          "2-Butoxyethanol",
          "Cocamidopropyl Betaine",
          "Alphox-200",
          "Xanthan Gum",
          "Fragrance & Dye",
          "Isopropyl Alcohol (IPA 99%)",
          "Sodium Gluconate",
          "Benzalkonium Chloride (BKC)",
          "Premium Fragrance & Dye",
          "Alcohol Ethoxylate",
        ],
      },
      "Tile Adhesive": { label: "Select Chemical", options: ["K50", "K60", "K80", "K90", "KX"] },
      "Tile Grout": {
        label: "Select Chemical",
        options: ["Calcium Carbonate", "Yellow Pigment", "Black Pigment", "Red Pigment", "Blue Pigment"],
      },
    },
  },
  Packaging: {
    label: "Packaging Type",
    options: ["Bulk", "FG"],
    children: {
      FG: {
        label: "FG Product",
        options: ["Tile Adhesive", "Tile Grout", "Epoxy", "Tile Cleaner", "Bondure"],
        children: {
          "Tile Adhesive": { label: "Packaging Size", options: ["20kg", "50kg", "Coupon"] },
          Bondure: { label: "Packaging Size", options: ["40 KG"] },
          "Tile Grout": { label: "Packaging", options: ["Pouch 1KG"] },
          Epoxy: {
            label: "Packaging Material",
            options: [
              "Bucket 1KG",
              "Bucket 5KG",
              "Sticker",
              "Sponge",
              "Resin",
              "Hardner",
              "Pigments",
              "Coloured Sand",
              "Carton 1x4",
              "Carton 1x8",
            ],
          },
          "Tile Cleaner": { label: "Packaging Material", options: ["Bucket", "Sticker", "Seal"] },
        },
      },
    },
  },
};

const hasRawMaterialConfig = (value: RawMaterialOption): value is RawMaterialName =>
  value !== "" && value !== "Other" && value in rawMaterialConfig;

function buildPurchaseUpdatePayload(entry: PurchaseEntry, file: File | null) {
  if (!file) {
    return entry;
  }

  const formData = new FormData();

  Object.entries(entry).forEach(([key, value]) => {
    if (value == null) {
      return;
    }

    formData.append(key, String(value));
  });

  formData.append("attachFile", file);
  return formData;
}

function Field({
  children,
  className,
  htmlFor,
  label,
}: {
  children: ReactNode;
  className?: string;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function buildMaterialLabel(entry: PurchaseEntry) {
  return [entry.packagingType, entry.level2, entry.level3, entry.level4]
    .filter(Boolean)
    .join(" / ");
}

function normalizeTimeForInput(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(trimmedValue)) {
    return trimmedValue;
  }

  const match = trimmedValue.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return trimmedValue;
  }

  const hours = Number(match[1]) % 12 + (match[3].toUpperCase() === "PM" ? 12 : 0);
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

function normalizeUnitForEdit(value: string) {
  return value.trim().toLowerCase() === "mt" ? "kg" : value;
}

function renderAttachmentActions(
  attachFile?: string,
  attachFileId?: string,
  attachFileName?: string,
  className = "",
) {
  const url = attachFile?.trim() || "";
  const fileName = attachFileName?.trim() || "purchase-attachment";
  const downloadUrl = attachFileId?.trim()
    ? `https://drive.google.com/uc?export=download&id=${attachFileId.trim()}`
    : url;

  if (!url) {
    return <span className="text-gray-400">No file</span>;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`.trim()}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        View
      </a>
      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        download={fileName}
        className="text-green-600 hover:underline"
      >
        Download
      </a>
    </div>
  );
}

export function PurchaseEntriesPage() {
  const [entries, setEntries] = useState<PurchaseEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<PurchaseEntry | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filters, setFilters] = useState<Filter[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedEditFile, setSelectedEditFile] = useState<File | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  const editSheetCloseTimeoutRef = useRef<number | null>(null);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const clearEditSheetCloseTimeout = () => {
    if (editSheetCloseTimeoutRef.current !== null) {
      window.clearTimeout(editSheetCloseTimeoutRef.current);
      editSheetCloseTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearEditSheetCloseTimeout();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    void fetchPurchaseEntries()
      .then((purchaseEntries) => {
        if (!isMounted) {
          return;
        }

        setEntries(purchaseEntries);
        setLoadError("");
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setEntries([]);
        setLoadError(error instanceof Error ? error.message : "Unable to fetch purchase entries.");
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

  const sortedEntries = useMemo(
    () =>
      [...entries].sort((left, right) =>
        `${right.date} ${right.time}`.localeCompare(`${left.date} ${left.time}`),
      ),
    [entries],
  );

  const filterFields = useMemo<FilterFieldConfig[]>(
    () => [
      createDateFilterField("date", "Date"),
      createTextFilterField("material", "Material"),
      createSelectFilterField("rawMaterialName", "Raw Material", createSelectOptions(entries.map((entry) => entry.rawMaterialName))),
      createSelectFilterField("unit", "Unit", createSelectOptions(entries.map((entry) => entry.unit))),
      createNumberFilterField("quantityPurchased", "Quantity"),
      createTextFilterField("supplierName", "Supplier"),
      createTextFilterField("invoiceNo", "Invoice"),
      createSelectFilterField("unloadBy", "Unload By", createSelectOptions(entries.map((entry) => entry.unloadBy))),
      createSelectFilterField("user", "Entry By", createSelectOptions(entries.map((entry) => entry.user))),
    ],
    [entries],
  );

  const filteredEntries = useMemo(
    () =>
      applyTableFilters(
        sortedEntries,
        filters,
        {
          date: (entry) => entry.date,
          material: (entry) => buildMaterialLabel(entry),
          rawMaterialName: (entry) => entry.rawMaterialName,
          unit: (entry) => entry.unit,
          quantityPurchased: (entry) => entry.quantityPurchased,
          supplierName: (entry) => entry.supplierName,
          invoiceNo: (entry) => entry.invoiceNo,
          unloadBy: (entry) => entry.unloadBy,
          user: (entry) => entry.user,
        },
        {
          date: "date",
          quantityPurchased: "number",
        },
      ),
    [filters, sortedEntries],
  );

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const paginatedEntries = useMemo(
    () => filteredEntries.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, filteredEntries, pageSize],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startEditing = (entry: PurchaseEntry) => {
    clearEditSheetCloseTimeout();
    setSelectedEditFile(null);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
    setEditingEntry({
      ...entry,
      time: normalizeTimeForInput(entry.time),
      unit: normalizeUnitForEdit(entry.unit),
    });
    setIsEditSheetOpen(true);
  };

  const updateEditingEntry = (updates: Partial<PurchaseEntry>) => {
    setEditingEntry((current) => (current ? { ...current, ...updates } : current));
  };

  const closeEditSheet = () => {
    setIsEditSheetOpen(false);
    clearEditSheetCloseTimeout();
    editSheetCloseTimeoutRef.current = window.setTimeout(() => {
      setEditingEntry(null);
      setSelectedEditFile(null);
      if (editFileInputRef.current) {
        editFileInputRef.current.value = "";
      }
      editSheetCloseTimeoutRef.current = null;
    }, EDIT_SHEET_ANIMATION_MS);
  };

  const handleUpdate = async () => {
    if (!editingEntry) {
      return;
    }

    setIsUpdating(true);

    try {
      const updatedEntry = selectedEditFile
        ? {
          ...editingEntry,
          attachFileName: selectedEditFile.name,
        }
        : editingEntry;
      const requestPayload = buildPurchaseUpdatePayload(editingEntry, selectedEditFile);

      await updatePurchaseEntry(requestPayload);
      setEntries((current) =>
        current.map((entry) => (entry.id === editingEntry.id ? updatedEntry : entry)),
      );
      closeEditSheet();
      toast.success("Purchase entry updated successfully.");

      void fetchPurchaseEntries()
        .then((purchaseEntries) => {
          setEntries(purchaseEntries);
          setLoadError("");
        })
        .catch(() => { });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update purchase entry.");
    } finally {
      setIsUpdating(false);
    }
  };

  const editConfig = useMemo(() => {
    return editingEntry && hasRawMaterialConfig(editingEntry.rawMaterialName as RawMaterialOption)
      ? rawMaterialConfig[editingEntry.rawMaterialName as RawMaterialName]
      : undefined;
  }, [editingEntry]);

  const editLevel2Config = useMemo(() => {
    return editConfig && editingEntry
      ? editConfig.children?.[editingEntry.packagingType]
      : undefined;
  }, [editConfig, editingEntry]);

  const editSelectedLevel2Config = useMemo(() => {
    return editLevel2Config && editingEntry
      ? editLevel2Config.children?.[editingEntry.level2]
      : undefined;
  }, [editLevel2Config, editingEntry]);

  const shouldShowEditPackagingBagField =
    editingEntry?.rawMaterialName === "Packaging" &&
    editingEntry.packagingType === "FG" &&
    (editingEntry.level2 === "Tile Adhesive" || editingEntry.level2 === "Bondure");

  const shouldShowEditPackagingBagColorField =
    editingEntry?.rawMaterialName === "Packaging" &&
    editingEntry.packagingType === "FG" &&
    editingEntry.level2 === "Tile Adhesive";

  const shouldShowEditCouponField =
    editingEntry?.rawMaterialName === "Packaging" &&
    editingEntry.packagingType === "FG" &&
    editingEntry.level2 === "Tile Adhesive";

  const editLevel3Config = useMemo(() => {
    if (!editSelectedLevel2Config || !editingEntry) {
      return undefined;
    }

    if (shouldShowEditPackagingBagField) {
      return editSelectedLevel2Config.children?.[editingEntry.packagingBag] ?? editSelectedLevel2Config;
    }

    return editSelectedLevel2Config;
  }, [editSelectedLevel2Config, editingEntry, shouldShowEditPackagingBagField]);

  const shouldShowEditBucketSizeField =
    editingEntry?.rawMaterialName === "Packaging" &&
    editingEntry.packagingType === "FG" &&
    editingEntry.level2 === "Tile Cleaner" &&
    editingEntry.level3 === "Bucket";

  useEffect(() => {
    if (!editingEntry || shouldShowEditCouponField || !editingEntry.coupon) {
      return;
    }

    setEditingEntry((current) => (current ? { ...current, coupon: "" } : current));
  }, [editingEntry, shouldShowEditCouponField]);

  const purchaseColumns = useMemo<ColumnDef<PurchaseEntry>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) =>
          row.original.date
            ? new Date(row.original.date).toLocaleDateString("en-GB").replace(/\//g, "-")
            : "-",
      },
      {
        accessorKey: "time",
        header: "Time",
        cell: ({ row }) => row.original.time || "-",
      },
      {
        accessorKey: "rawMaterialName",
        header: "Raw Material",
        cell: ({ row }) => (
          row.original.rawMaterialName ? (
            <DataBadge type="rawMaterialName">{row.original.rawMaterialName}</DataBadge>
          ) : null
        ),
      },
      {
        id: "material",
        accessorFn: (row) => buildMaterialLabel(row),
        header: "Material",
        cell: ({ row }) => (
          <div className="min-w-[220px] max-w-[260px] space-y-1">
            <TooltipText as="p" className="truncate font-medium text-slate-900" content={buildMaterialLabel(row.original) || "-"}>
              {buildMaterialLabel(row.original) || "-"}
            </TooltipText>
          </div>
        ),
      },
      {
        id: "quantity",
        accessorFn: (row) => [row.quantityPurchased, row.unit].filter(Boolean).join(" "),
        header: "Quantity",
        cell: ({ row }) => {
          const { quantityPurchased, unit } = row.original;

          const displayQuantity =
            unit?.toLowerCase() === "kg"
              ? `${(Number(quantityPurchased) / 1000).toFixed(2)} mt`
              : `${quantityPurchased} ${unit ?? ""}`;

          return (
            <div className="flex items-center gap-2">
              <span>{displayQuantity || "-"}</span>
              {unit ? <DataBadge type="unit">{unit.toLowerCase() === "kg" ? "mt" : unit}</DataBadge> : null}
            </div>
          );
        },
      },
      {
        accessorKey: "supplierName",
        header: "Supplier",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[180px] truncate" content={row.original.supplierName || "-"}>
            {row.original.supplierName || "-"}
          </TooltipText>
        ),
      },
      {
        accessorKey: "invoiceNo",
        header: "Invoice",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[140px] truncate" content={row.original.invoiceNo || "-"}>
            {row.original.invoiceNo || "-"}
          </TooltipText>
        ),
      },
      {
        accessorKey: "unloadBy",
        header: "Unload By",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[140px] truncate" content={row.original.unloadBy || "-"}>
            {row.original.unloadBy || "-"}
          </TooltipText>
        ),
      },
      {
        accessorFn: (row) => row.attachFileName || row.attachFile || "",
        id: "attachment",
        header: "Attachment",
        cell: ({ row }) => renderAttachmentActions(row.original.attachFile, row.original.attachFileId, row.original.attachFileName),
      },
      {
        accessorKey: "user",
        header: "Entry By",
        cell: ({ row }) => (
          <TooltipText as="span" className="block max-w-[180px] truncate" content={row.original.user || "-"}>
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
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-center gap-2">
            <Button size="icon" type="button" variant="outline" onClick={() => startEditing(row.original)}>
              <Pencil />
            </Button>
          </div>
        ),
      },
    ],
    [startEditing],
  );

  return (
    <div className="space-y-6">
      <Sheet open={isEditSheetOpen} onOpenChange={(open) => {
        if (open) {
          setIsEditSheetOpen(true);
          return;
        }
        closeEditSheet();
      }}>
        <SheetContent
          side="right"
          className="h-full w-full max-w-full overflow-hidden border-l border-slate-200 bg-white p-0 sm:w-[760px] sm:max-w-[760px] lg:w-[860px] lg:max-w-[860px]"
        >
          {editingEntry ? (
            <div className="flex h-full flex-col">
              <SheetHeader className="shrink-0 border-b border-slate-200/80 px-5 py-4 pr-12">
                <SheetTitle>Update Entry</SheetTitle>
                <SheetDescription>Update the selected purchase record and save your changes.</SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-5 py-5">
                <div className="space-y-6">
                  <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-background/60 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Record details</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Basic identifiers, date, time, and unit information.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <Field htmlFor="edit-date" label="Date">
                        <DatePickerInput
                          id="edit-date"
                          name="date"
                          value={editingEntry.date}
                          onChange={(value) =>
                            setEditingEntry((current) => current ? { ...current, date: value } : current)
                          }
                        />
                      </Field>
                      <Field htmlFor="edit-time" label="Time">
                        <Input
                          id="edit-time"
                          type="time"
                          value={editingEntry.time}
                          onChange={(event) =>
                            setEditingEntry((current) => current ? { ...current, time: event.target.value } : current)
                          }
                        />
                      </Field>
                      <Field htmlFor="edit-unit" label="Unit">
                        <Select
                          id="edit-unit"
                          disabled
                          value={editingEntry.unit}
                          onChange={(event) =>
                            setEditingEntry((current) => current ? { ...current, unit: event.target.value } : current)
                          }
                        >
                          <option value="">Select unit</option>
                          {unitOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-background/60 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Material details</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Material type, packaging path, and item hierarchy.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <Field htmlFor="edit-rawMaterialName" label="Raw Material Name">
                        <Select
                          id="edit-rawMaterialName"
                          disabled
                          value={editingEntry.rawMaterialName}
                          onChange={(event) =>
                            updateEditingEntry({
                              rawMaterialName: event.target.value,
                              packagingType: "",
                              level2: "",
                              level3: "",
                              level4: "",
                              packagingBag: "",
                              packagingBagColor: "",
                              coupon: "",
                              bucketSize: "",
                            })
                          }
                        >
                          <option value="">Select raw material</option>
                          {rawMaterialOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      </Field>

                      <Field htmlFor="edit-packagingType" label={editConfig?.label ?? "Packaging Type"}>
                        {editConfig ? (
                          <Select
                            id="edit-packagingType"
                            disabled
                            value={editingEntry.packagingType}
                            onChange={(event) =>
                              updateEditingEntry({
                                packagingType: event.target.value,
                                level2: "",
                                level3: "",
                                level4: "",
                                packagingBag: "",
                                packagingBagColor: "",
                                coupon: "",
                                bucketSize: "",
                              })
                            }
                          >
                            <option value="">Select {editConfig.label.toLowerCase()}</option>
                            {editConfig.options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <Input
                            id="edit-packagingType"
                            value={editingEntry.packagingType}
                            onChange={(event) => updateEditingEntry({ packagingType: event.target.value })}
                          />
                        )}
                      </Field>

                      <Field htmlFor="edit-level2" label={editLevel2Config?.label ?? "Level 2"}>
                        {editLevel2Config ? (
                          <Select
                            id="edit-level2"
                            disabled
                            value={editingEntry.level2}
                            onChange={(event) =>
                              updateEditingEntry({
                                level2: event.target.value,
                                level3: "",
                                level4: "",
                                packagingBag: event.target.value === "Bondure" ? "Bondure" : "",
                                packagingBagColor: "",
                                coupon: "",
                                bucketSize: "",
                              })
                            }
                          >
                            <option value="">Select {editLevel2Config.label.toLowerCase()}</option>
                            {editLevel2Config.options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <Input
                            id="edit-level2"
                            value={editingEntry.level2}
                            onChange={(event) => updateEditingEntry({ level2: event.target.value })}
                          />
                        )}
                      </Field>

                      {shouldShowEditPackagingBagField && (
                        <Field htmlFor="edit-packagingBag" label="Packaging Bag">
                          <Select
                            id="edit-packagingBag"
                            disabled
                            value={editingEntry.packagingBag || editingEntry.level4}
                            onChange={(event) =>
                              updateEditingEntry({
                                packagingBag: event.target.value,
                                level4: event.target.value,
                                level3: editingEntry.level2 === "Bondure" ? "40 KG" : "",
                              })
                            }
                          >
                            <option value="">Select packaging bag</option>
                            {(editingEntry.level2 === "Bondure" ? ["Bondure"] : packagingBagOptions).map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </Select>
                        </Field>
                      )}

                      {shouldShowEditCouponField && (
                        <Field htmlFor="edit-coupon" label="Coupon">
                          <Input
                            id="edit-coupon"
                            disabled
                            value={editingEntry.coupon ?? ""}
                            onChange={(event) => updateEditingEntry({ coupon: event.target.value })}
                          />
                        </Field>
                      )}

                      {shouldShowEditPackagingBagColorField && (
                        <Field htmlFor="edit-packagingBagColor" label="Bag Color">
                          <Select
                            id="edit-packagingBagColor"
                            disabled
                            value={editingEntry.packagingBagColor}
                            onChange={(event) => updateEditingEntry({ packagingBagColor: event.target.value })}
                          >
                            <option value="">Select bag color</option>
                            {packagingBagColorOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </Select>
                        </Field>
                      )}

                      <Field htmlFor="edit-level3" label={editLevel3Config?.label ?? "Level 3"}>
                        {editLevel3Config ? (
                          <Select
                            id="edit-level3"
                            disabled
                            value={editingEntry.level3}
                            onChange={(event) =>
                              updateEditingEntry({
                                level3: event.target.value,
                                bucketSize: event.target.value === "Bucket" ? editingEntry.bucketSize : "",
                              })
                            }
                          >
                            <option value="">Select {editLevel3Config.label.toLowerCase()}</option>
                            {editLevel3Config.options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <Input
                            id="edit-level3"
                            value={editingEntry.level3}
                            onChange={(event) => updateEditingEntry({ level3: event.target.value })}
                          />
                        )}
                      </Field>

                      {shouldShowEditBucketSizeField && (
                        <Field htmlFor="edit-bucketSize" label="Bucket Size">
                          <Select
                            id="edit-bucketSize"
                            disabled
                            value={editingEntry.bucketSize || editingEntry.level4}
                            onChange={(event) =>
                              updateEditingEntry({
                                bucketSize: event.target.value,
                                level4: event.target.value,
                              })
                            }
                          >
                            <option value="">Select bucket size</option>
                            {bucketSizeOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </Select>
                        </Field>
                      )}

                      {!shouldShowEditPackagingBagField && !shouldShowEditBucketSizeField && (
                        <Field htmlFor="edit-level4" label="Level 4">
                          <Input
                            id="edit-level4"
                            disabled
                            value={editingEntry.level4}
                            onChange={(event) => updateEditingEntry({ level4: event.target.value })}
                          />
                        </Field>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-background/60 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Purchase details</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Quantity, supplier, invoice, and unloading information.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <Field htmlFor="edit-quantityPurchased" label="Quantity Purchased">
                        <Input
                          id="edit-quantityPurchased"
                          disabled
                          type="number"
                          value={editingEntry.quantityPurchased}
                          onChange={(event) =>
                            setEditingEntry((current) =>
                              current ? { ...current, quantityPurchased: event.target.value } : current,
                            )
                          }
                        />
                      </Field>
                      <Field htmlFor="edit-supplierName" label="Supplier Name">
                        <Input
                          id="edit-supplierName"
                          value={editingEntry.supplierName}
                          onChange={(event) =>
                            setEditingEntry((current) =>
                              current ? { ...current, supplierName: event.target.value } : current,
                            )
                          }
                        />
                      </Field>
                      <Field htmlFor="edit-invoiceNo" label="Invoice No">
                        <Input
                          id="edit-invoiceNo"
                          value={editingEntry.invoiceNo}
                          onChange={(event) =>
                            setEditingEntry((current) => current ? { ...current, invoiceNo: event.target.value } : current)
                          }
                        />
                      </Field>
                      <Field htmlFor="edit-unloadBy" label="Unload By">
                        {editingEntry.rawMaterialName === "Cement" || editingEntry.rawMaterialName === "Sand" ? (
                          <Select
                            id="edit-unloadBy"
                            value={editingEntry.unloadBy}
                            onChange={(event) => updateEditingEntry({ unloadBy: event.target.value })}
                          >
                            <option value="">Select person</option>
                            {unloadByOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <Input
                            id="edit-unloadBy"
                            value={editingEntry.unloadBy}
                            onChange={(event) => updateEditingEntry({ unloadBy: event.target.value })}
                          />
                        )}
                      </Field>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-background/60 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Additional notes</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Attachment and remarks for this purchase record.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field htmlFor="edit-attachFile" label="Attach File">
                        <div className="space-y-2">
                          <Input
                            ref={editFileInputRef}
                            id="edit-attachFile"
                            accept=".jpg,.jpeg,.png,.webp,.pdf"
                            type="file"
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null;
                              setSelectedEditFile(file);
                              updateEditingEntry({
                                attachFileName: file?.name || editingEntry.attachFileName,
                              });
                            }}
                          />
                          {editingEntry.attachFileName ? (
                            <p className="break-all text-xs text-muted-foreground">
                              Current file: {editingEntry.attachFileName}
                            </p>
                          ) : null}
                        </div>
                      </Field>
                      <Field htmlFor="edit-remarks" label="Remarks">
                        <Textarea
                          id="edit-remarks"
                          value={editingEntry.remarks}
                          onChange={(event) =>
                            setEditingEntry((current) => current ? { ...current, remarks: event.target.value } : current)
                          }
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>

              <SheetFooter className="shrink-0 border-t border-slate-200/80 bg-white px-5 py-4">
                <Button onClick={closeEditSheet} type="button" variant="outline">
                  Cancel
                </Button>
                <Button disabled={isUpdating} onClick={handleUpdate} type="button">
                  <Save />
                  {isUpdating ? "Saving Changes..." : "Save Changes"}
                </Button>
              </SheetFooter>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Card className="overflow-hidden border-white/70 bg-white/88 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <CardHeader className="gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end sm:justify-between sm:space-y-0">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Records
            </p>
            <CardTitle className="mt-2">Saved entries</CardTitle>
            <CardDescription>
              {isLoading
                ? "Loading purchase entries from sheet..."
                : sortedEntries.length === 0
                  ? "No purchase entries have been saved yet."
                  : `${sortedEntries.length} purchase entries available.`}
            </CardDescription>
          </div>

          <Button asChild variant="outline">
            <Link to="/purchase-entry">
              <ArrowLeft />
              Back to purchase form
            </Link>
          </Button>

        </CardHeader>
        <CardContent className="p-5">
          {!isLoading && !loadError && sortedEntries.length > 0 ? (
            <div className="mb-5">
              <TableFiltersBar fields={filterFields} filters={filters} onChange={setFilters} />
            </div>
          ) : null}

          {loadError ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-destructive">
              {loadError}
            </div>
          ) : isLoading ? (
            <div className="flex justify-center rounded-md border border-dashed p-6">
              <LoadingLoader />
            </div>
          ) : sortedEntries.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Add a purchase entry first, then manage it here.
            </div>
          ) : (
            <>
              <div className="space-y-4 lg:hidden">
                {paginatedEntries.map((entry) => (
                  <Card key={entry.id} className="rounded-md border shadow-none">
                    <CardContent className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{buildMaterialLabel(entry) || "Purchase entry"}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{entry.invoiceNo || "-"}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            type="button"
                            variant="outline"
                            onClick={() => startEditing(entry)}
                          >
                            <Pencil />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Date</p>
                          <p className="mt-1">{entry.date
                            ? new Date(entry.date).toLocaleDateString("en-GB").replace(/\//g, "-")
                            : "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Time</p>
                          <p className="mt-1">{entry.time || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Entry By</p>
                          <p className="mt-1">{entry.user || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Quantity</p>
                          <p className="mt-1">
                            {[entry.quantityPurchased, entry.unit].filter(Boolean).join(" ") || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Supplier</p>
                          <p className="mt-1">{entry.supplierName || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Unload By</p>
                          <p className="mt-1">{entry.unloadBy || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Attachment</p>
                          <div className="mt-2">{renderAttachmentActions(entry.attachFile, entry.attachFileId, entry.attachFileName)}</div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Remarks</p>
                          <p className="mt-1 text-muted-foreground">{entry.remarks || "-"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="hidden lg:block">
                <DataTable
                  columns={purchaseColumns}
                  data={paginatedEntries}
                  emptyMessage="No purchase entries available."
                />
              </div>
            </>
          )}

          {!isLoading && !loadError && sortedEntries.length > 0 ? (
            <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">Rows per page</span>
                <Select
                  value={String(pageSize)}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-[88px]"
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </div>

              <Pagination className="w-auto justify-start sm:justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}








