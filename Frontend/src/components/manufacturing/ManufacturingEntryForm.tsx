import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ClipboardCheck, Eye, Factory, RotateCcw, Save } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fetchManufacturingEntries, fetchWastageQty, reduceWastageQty, submitEntry, type ManufacturingEntry } from "@/lib/api";
import { sanitizeNumberOnly, sanitizeTextOnly } from "@/lib/inputValidation";
import {
  bondureRecipes,
  epoxyColors,
  epoxyProductColorMap,
  epoxyProducts,
  epoxyRecipes,
  groutProductColorMap,
  groutProducts,
  groutRecipes,
  tileAdhesiveRecipes,
  tileCleanerRecipes,
} from "@/components/manufacturing/manufacturingData";
import SubmitLoader from "../ui/SubmitLoader";

const productCategories = ["Tile Adhesive", "Bondure", "Epoxy", "Grout", "Tile Cleaner", "Other"];
const unitOptions = ["kg", "g", "ltr", "ml", "pcs", "bags"];
const groutColors = ["Black", "White", "Ivory", "Coffee Brown", "Grey", "Light Grey", "Green", "Blue", "Red", "Yellow"];

const tileAdhesiveWhiteProducts = ["K60", "K80", "K90", "Kamdhenu X"];
const tileAdhesiveGreyProducts = ["K50", "K60", "K80", "K90", "Kamdhenu X"];
const tileCleanerProducts = ["Crystal X 1L", "Shine X 1L", "Crystal X 5L", "Shine X 5L"];
const MOBILE_RECENT_BATCHES_PAGE_SIZE = 3;
const DESKTOP_RECENT_BATCHES_PAGE_SIZE = 8;
const OTHER_OPTION = "__other__";
const manufacturingOtherFields = [
  "tphBatch",
  "productCategory",
  "finishedProductName",
  "token",
  "color",
  "bagSize",
] as const;
type ManufacturingOtherField = (typeof manufacturingOtherFields)[number];

const initialFormData = {
  productionDate: "",
  tphBatch: "",
  batchNo: "",
  productCategory: "",
  materialQuantity: "",
  materialUnit: "",
  token: "",
  color: "",
  finishedProductName: "",
  bagSize: "",
  totalBagsProduced: "",
  sticker: "",
  sponge: "",
  wastageQty: "",
  remarks: "",
};

const initialRawMaterials = [
  {
    rawMaterialName: "",
    packagingType: "",
    materialQuantity: "",
    materialUnit: "",
  },
];

const getTotalBagsProduced = (tphBatch: string, bagSize: string) => {
  if (tphBatch === "2TPH" && bagSize === "20kg") return "50";
  if (tphBatch === "2TPH" && bagSize === "50kg") return "20";

  if (tphBatch === "1TPH" && bagSize === "20kg") return "25";
  if (tphBatch === "1TPH" && bagSize === "50kg") return "10";

  return "";
};

const getBatchDefaults = (tphBatch: string) => {
  switch (tphBatch) {
    case "1TPH":
      return {
        productCategory: "Tile Adhesive",
        color: "White",
      };
    case "2TPH":
      return {
        productCategory: "",
        color: "Grey",
      };
    case "Manual Blender":
      return {
        productCategory: "Grout",
        color: "",
      };
    case "Sigma Mixer":
      return {
        productCategory: "Epoxy",
        color: "",
      };
    case "Manual Hand Mixer":
      return {
        productCategory: "Tile Cleaner",
        color: "",
      };
    default:
      return {
        productCategory: "",
        color: "",
      };
  }
};

function isPositiveNumber(value: string) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0;
}

function isNonNegativeNumber(value: string) {
  if (!value.trim()) {
    return true;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue >= 0;
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

const initialManufacturingOtherState = Object.fromEntries(
  manufacturingOtherFields.map((field) => [field, false]),
) as Record<ManufacturingOtherField, boolean>;

function getOptionsWithOther(options: string[]) {
  const normalizedOptions = options.filter((option) => option.toLowerCase() !== "other" && option.toLowerCase() !== "others");
  return [...normalizedOptions, "Other"];
}

export function ManufacturingEntryForm() {

  const [formData, setFormData] = useState(initialFormData)
  const [otherSelections, setOtherSelections] = useState(initialManufacturingOtherState);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentBatches, setRecentBatches] = useState<ManufacturingEntry[]>([]);
  const [recentBatchesPage, setRecentBatchesPage] = useState(1);
  const [recentBatchesPageSize, setRecentBatchesPageSize] = useState(() =>
    typeof window !== "undefined" && window.innerWidth >= 1024
      ? DESKTOP_RECENT_BATCHES_PAGE_SIZE
      : MOBILE_RECENT_BATCHES_PAGE_SIZE,
  );

  const [rawMaterials, setRawMaterials] = useState(initialRawMaterials);

  const emptyProductItem = {
    token: "",
    bagSize: "",
    totalBagsProduced: "",
  };

  const [productItems, setProductItems] = useState([emptyProductItem]);
  const [availableWastageQty, setAvailableWastageQty] = useState(0);
  const [wastageBagSize, setWastageBagSize] = useState("");
  const [wastageTotalBags, setWastageTotalBags] = useState("");
  const [isWastageLoading, setIsWastageLoading] = useState(false);
  const [isReducingWastage, setIsReducingWastage] = useState(false);

  const getBatchKg = (tphBatch: string) => {
    if (tphBatch === "1TPH") return 500;
    if (tphBatch === "2TPH") return 1000;
    if (tphBatch === "Manual Blender") return 300;
    if (tphBatch === "Sigma Mixer") return 62;
    return 0;
  };

  const getBagSizeKg = (bagSize: string) => {
    const match = bagSize.match(/\d+/);
    return match ? Number(match[0]) : 0;
  };

  const getTotalPackedKg = (items: typeof productItems) => {
    return items.reduce((total, item) => {
      const bagKg = getBagSizeKg(item.bagSize);
      const bags = Number(item.totalBagsProduced) || 0;
      return total + bagKg * bags;
    }, 0);
  };

  const batchKg = getBatchKg(formData.tphBatch);
  const totalPackedKg = useMemo(() => getTotalPackedKg(productItems), [productItems]);
  const remainingKg = Math.max(0, batchKg - totalPackedKg);

  const totalAvailableWastage = Number(availableWastageQty || 0);

  const wastageBagSizeKg = Number(
    String(wastageBagSize || "").replace(/kg/i, "")
  );

  const packedWastageQty =
    wastageBagSizeKg * Number(wastageTotalBags || 0);

  const remainingWastageQty = Math.max(
    0,
    totalAvailableWastage - packedWastageQty
  );

  const isWastageExceeded =
    packedWastageQty > totalAvailableWastage;

  const isWastageUnavailable =
    totalAvailableWastage < 0;

  const isWastageInvalid =
    isWastageUnavailable || isWastageExceeded;

  useEffect(() => {
    const nextWastageQty = availableWastageQty > 0 ? Math.max(0, remainingWastageQty) : remainingKg;

    setFormData((prev) => {
      const nextValue = String(nextWastageQty);
      return prev.wastageQty === nextValue ? prev : { ...prev, wastageQty: nextValue };
    });

    if (batchKg > 0 && remainingKg === 0 && totalPackedKg > 0) {
      toast.success("Batch quantity completed. Remaining quantity is 0 KG.");
    }
  }, [availableWastageQty, remainingKg, remainingWastageQty, batchKg, totalPackedKg]);

  useEffect(() => {
    if (isWastageExceeded) {
      toast.error("Packed wastage quantity cannot be greater than available wastage quantity.");
    }
  }, [isWastageExceeded]);

  const updateRawMaterialField = (
    index: number,
    field: string,
    value: string
  ) => {
    const updated = [...rawMaterials];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setRawMaterials(updated);
  };

  const updateRawMaterialTextField = (index: number, field: string, value: string) => {
    updateRawMaterialField(index, field, sanitizeTextOnly(value));
  };

  const updateRawMaterialNumberField = (index: number, field: string, value: string) => {
    updateRawMaterialField(index, field, sanitizeNumberOnly(value, { allowDecimal: true }));
  };

  const updateField = (name: keyof typeof formData, value: string) => {
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const updateTextField = (name: keyof typeof formData, value: string) => {
    updateField(name, sanitizeTextOnly(value));
  };

  const updateNumberField = (name: keyof typeof formData, value: string, options?: { allowDecimal?: boolean }) => {
    updateField(name, sanitizeNumberOnly(value, options));
  };

  const updateProductItem = (
    index: number,
    field: keyof typeof emptyProductItem,
    value: string
  ) => {
    setProductItems((current) => {
      const updated = current.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );

      const packedKg = getTotalPackedKg(updated);
      const batchKg = getBatchKg(formData.tphBatch);

      if (batchKg > 0 && packedKg > batchKg) {
        toast.error("Total bags cannot be greater than batch quantity.");
        return current;
      }

      return updated;
    });
  };
  const addProductItem = () => {
    setProductItems((current) => [...current, emptyProductItem]);
  };

  const removeProductItem = (index: number) => {
    setProductItems((current) =>
      current.length === 1 ? current : current.filter((_, i) => i !== index)
    );
  };

  const getSelectValue = (field: ManufacturingOtherField, value: string) =>
    otherSelections[field] ? OTHER_OPTION : value;

  const handleSelectChange = (
    field: ManufacturingOtherField,
    value: string,
    fieldsToClear: ManufacturingOtherField[] = [],
    extraUpdates: Partial<typeof initialFormData> = {},
  ) => {
    const isOtherSelection = value === OTHER_OPTION;

    setOtherSelections((current) => {
      const next = { ...current, [field]: isOtherSelection };
      fieldsToClear.forEach((fieldName) => {
        next[fieldName] = false;
      });
      return next;
    });

    setFormData((current) => {
      const next = { ...current, ...extraUpdates };
      fieldsToClear.forEach((fieldName) => {
        next[fieldName] = "";
      });
      next[field] = isOtherSelection ? "" : value;
      return next;
    });
  };


  const getRawMaterialsForSubmission = () => {
    const productName = formData.finishedProductName.replace(" (Coupon)", "");
    const packagingLine =
      selectedProductCategory === "Tile Adhesive" && productName && formData.token && formData.bagSize
        ? [
          {
            rawMaterialName: "Packaging",
            packagingType: "FG",
            level2: "Tile Adhesive",
            level3: formData.token === "Coupon" ? "Coupon" : formData.bagSize,
            level4: productName,
            colorOfSandEpoxy: "",
            materialQuantity: formData.totalBagsProduced,
            materialUnit: formData.token === "Coupon" ? "pcs" : "bags",
          },
        ]
        : [];

    return [...rawMaterials, ...packagingLine];
  };
  const renderOtherInput = (field: ManufacturingOtherField, label: string, placeholder: string) =>
    otherSelections[field] ? (
      <Field htmlFor={`${field}-other`} label={`${label} (Other)`}>
        <Input
          id={`${field}-other`}
          value={formData[field]}
          placeholder={placeholder}
          onChange={(e) => updateTextField(field, e.target.value)}
        />
      </Field>
    ) : null;

  const selectedColor =
    formData.tphBatch === "1TPH"
      ? "White"
      : formData.tphBatch === "2TPH"
        ? "Grey"
        : formData.color;

  const totalProducedLabel =
    formData.tphBatch === "Manual Blender"
      ? "Total Pouch"
      : formData.tphBatch === "Sigma Mixer"
        ? "Total Bucket"
        : formData.tphBatch === "Manual Hand Mixer"
          ? "Total Can"
          : "Total Bags";

  const selectedProductCategory = formData.productCategory;
  const isTileAdhesiveProduct = selectedProductCategory === "Tile Adhesive";
  const productCategoryOptions =
    formData.tphBatch === "2TPH" ? ["Tile Adhesive", "Bondure"] : productCategories;
  const isProductCategoryLocked = ["1TPH", "Manual Blender", "Sigma Mixer", "Manual Hand Mixer"].includes(
    formData.tphBatch,
  );
  const colorOptions =
    formData.tphBatch === "Manual Blender"
      ? groutColors
      : formData.tphBatch === "Sigma Mixer"
        ? epoxyColors
        : [];
  const isColorDisabled =
    ["1TPH", "2TPH", "Manual Hand Mixer"].includes(formData.tphBatch) ||
    isTileAdhesiveProduct ||
    selectedProductCategory === "Grout";
  const finishedProductOptions =
    formData.tphBatch === "Manual Hand Mixer"
      ? tileCleanerProducts
      : selectedProductCategory === "Grout"
        ? groutProducts
        : selectedProductCategory === "Epoxy"
          ? epoxyProducts
          : isTileAdhesiveProduct && selectedColor === "White"
            ? tileAdhesiveWhiteProducts
            : isTileAdhesiveProduct && selectedColor === "Grey"
              ? tileAdhesiveGreyProducts
              : [];
  const bagSizeLabel =
    formData.productCategory === "Epoxy"
      ? "Bucket Size"
      : formData.productCategory === "Tile Cleaner"
        ? "Can Size"
        : formData.productCategory === "Grout"
          ? "Pouch Size"
          : "Bag Size";
  const isRecipeLocked =
    isTileAdhesiveProduct ||
    selectedProductCategory === "Bondure" ||
    selectedProductCategory === "Grout";
  const totalRecentBatchPages = Math.max(1, Math.ceil(recentBatches.length / recentBatchesPageSize));
  const visibleRecentBatches = recentBatches.slice(
    (recentBatchesPage - 1) * recentBatchesPageSize,
    recentBatchesPage * recentBatchesPageSize,
  );

  useEffect(() => {
    const tphBatch = formData.tphBatch.trim();
    const productCategory = selectedProductCategory.trim();
    const finishedProductName = formData.finishedProductName.trim();

    if (!tphBatch || !productCategory || !finishedProductName) {
      setAvailableWastageQty(0);
      setWastageBagSize("");
      setWastageTotalBags("");
      setIsWastageLoading(false);
      return;
    }

    let isActive = true;
    setIsWastageLoading(true);

    fetchWastageQty({
      tphBatch,
      productCategory,
      finishedProductName,
    })
      .then((qty) => {
        if (!isActive) {
          return;
        }

        setAvailableWastageQty(Number.isFinite(qty) ? qty : 0);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setAvailableWastageQty(0);
      })
      .finally(() => {
        if (isActive) {
          setIsWastageLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [formData.tphBatch, selectedProductCategory, formData.finishedProductName]);

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

  useEffect(() => {
    if (recentBatchesPage > totalRecentBatchPages) {
      setRecentBatchesPage(totalRecentBatchPages);
    }
  }, [recentBatchesPage, totalRecentBatchPages]);

  useEffect(() => {
    const productName = formData.finishedProductName?.replace(" (Coupon)", "");

    if (
      selectedProductCategory !== "Tile Adhesive" ||
      !selectedColor ||
      !productName
    ) {
      return;
    }

    const recipeColor = selectedColor === "Grey" ? "Grey" : selectedColor;
    const recipe = tileAdhesiveRecipes[recipeColor]?.[productName];

    if (!recipe) return;

    setRawMaterials(recipe);
  }, [selectedProductCategory, selectedColor, formData.finishedProductName]);

  useEffect(() => {
    if (selectedProductCategory !== "Bondure") {
      return;
    }

    setRawMaterials(bondureRecipes);
  }, [selectedProductCategory]);

  useEffect(() => {
    if (selectedProductCategory !== "Grout" || !formData.finishedProductName) {
      return;
    }

    const recipe = groutRecipes[formData.finishedProductName];

    if (!recipe) {
      return;
    }

    setRawMaterials(recipe);
  }, [selectedProductCategory, formData.finishedProductName]);

  useEffect(() => {
    if (selectedProductCategory !== "Epoxy" || !selectedColor) {
      return;
    }

    const recipe = epoxyRecipes[selectedColor];

    if (!recipe) {
      return;
    }

    setRawMaterials(recipe);
  }, [selectedProductCategory, selectedColor]);

  useEffect(() => {
    if (selectedProductCategory !== "Tile Cleaner" || !formData.finishedProductName) {
      return;
    }

    const recipe = tileCleanerRecipes[formData.finishedProductName];

    if (!recipe) {
      return;
    }

    setRawMaterials(recipe);
  }, [selectedProductCategory, formData.finishedProductName]);

  useEffect(() => {
    setFormData((current) => {
      if (isTileAdhesiveProduct) {
        return current.token === "N/A" ? { ...current, token: "" } : current;
      }

      return current.token === "N/A" ? current : { ...current, token: "N/A" };
    });
  }, [isTileAdhesiveProduct]);

  useEffect(() => {
    if (selectedProductCategory !== "Grout") {
      return;
    }

    const mappedColor = groutProductColorMap[formData.finishedProductName];

    if (!mappedColor || formData.color === mappedColor) {
      return;
    }

    setFormData((current) => ({
      ...current,
      color: mappedColor,
    }));
  }, [selectedProductCategory, formData.finishedProductName, formData.color]);

  useEffect(() => {
    if (selectedProductCategory !== "Epoxy") {
      return;
    }

    const mappedColor = epoxyProductColorMap[formData.finishedProductName];

    if (!mappedColor || formData.color === mappedColor) {
      return;
    }

    setFormData((current) => ({
      ...current,
      color: mappedColor,
    }));
  }, [selectedProductCategory, formData.finishedProductName, formData.color]);

  useEffect(() => {
    if (selectedProductCategory !== "Tile Cleaner") {
      return;
    }

    const mappedBagSize =
      formData.finishedProductName === "Crystal X 1L" || formData.finishedProductName === "Shine X 1L"
        ? "1L"
        : formData.finishedProductName === "Crystal X 5L" || formData.finishedProductName === "Shine X 5L"
          ? "5L"
          : "";

    if (!mappedBagSize || formData.bagSize === mappedBagSize) {
      return;
    }

    setFormData((current) => ({
      ...current,
      bagSize: mappedBagSize,
    }));
  }, [selectedProductCategory, formData.finishedProductName, formData.bagSize]);

  useEffect(() => {
    if (selectedProductCategory !== "Epoxy") {
      setFormData((current) =>
        current.sticker || current.sponge ? { ...current, sticker: "", sponge: "" } : current,
      );
      return;
    }

    const hiddenPackagingValue = formData.totalBagsProduced.trim();

    setFormData((current) =>
      current.sticker === hiddenPackagingValue && current.sponge === hiddenPackagingValue
        ? current
        : {
          ...current,
          sticker: hiddenPackagingValue,
          sponge: hiddenPackagingValue,
        },
    );
  }, [selectedProductCategory, formData.totalBagsProduced]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitStatus("idle");
    setSubmitMessage("");

    if (!formData.productionDate) {
      const message = "Production date is required.";
      setSubmitStatus("error");
      setSubmitMessage(message);
      toast.error(message);
      return;
    }

    if (!formData.tphBatch) {
      const message = "TPH / Batch is required.";
      setSubmitStatus("error");
      setSubmitMessage(message);
      toast.error(message);
      return;
    }

    if (!formData.batchNo.trim()) {
      const message = "Batch No. is required.";
      setSubmitStatus("error");
      setSubmitMessage(message);
      toast.error(message);
      return;
    }

    if (!selectedProductCategory.trim()) {
      const message = "Product category is required.";
      setSubmitStatus("error");
      setSubmitMessage(message);
      toast.error(message);
      return;
    }

    if (!formData.finishedProductName.trim()) {
      const message = "Finished product name is required.";
      setSubmitStatus("error");
      setSubmitMessage(message);
      toast.error(message);
      return;
    }

    if (!isNonNegativeNumber(formData.wastageQty)) {
      const message = "Wastage qty must be 0 or more.";
      setSubmitStatus("error");
      setSubmitMessage(message);
      toast.error(message);
      return;
    }

    if (isWastageExceeded) {
      const message = "Packed wastage quantity cannot be greater than available wastage quantity.";
      setSubmitStatus("error");
      setSubmitMessage(message);
      toast.error(message);
      return;
    }

    if (rawMaterials.length === 0) {
      const message = "At least one raw material is required.";
      setSubmitStatus("error");
      setSubmitMessage(message);
      toast.error(message);
      return;
    }

    const invalidMaterialIndex = rawMaterials.findIndex((item) =>
      !item.rawMaterialName.trim() ||
      !item.packagingType.trim() ||
      !isPositiveNumber(item.materialQuantity) ||
      !item.materialUnit.trim(),
    );

    if (invalidMaterialIndex !== -1) {
      const message = `Raw material row ${invalidMaterialIndex + 1} is incomplete or invalid.`;
      setSubmitStatus("error");
      setSubmitMessage(message);
      toast.error(message);
      return;
    }

    if (isWastageUnavailable) {
      toast.error(
        "No wastage quantity available for the selected product."
      );
      return;
    }

    if (isWastageExceeded) {
      toast.error(
        `Packed wastage ${packedWastageQty} KG cannot be greater than available wastage ${totalAvailableWastage} KG.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        color: selectedColor,
        productCategory: selectedProductCategory,
        sticker: selectedProductCategory === "Epoxy" ? formData.sticker : "",
        sponge: selectedProductCategory === "Epoxy" ? formData.sponge : "",
        rawMaterials: getRawMaterialsForSubmission(),

        productItems: productItems.map((item) => ({
          token: item.token,
          bagSize: item.bagSize,
          totalBagsProduced: Number(item.totalBagsProduced) || 0,
        })),
      };

      const response = await submitEntry("manufacturing", payload);

      const isFailed =
        response &&
        typeof response === "object" &&
        "success" in response &&
        response.success === false;

      const responseMessage =
        response && typeof response === "object"
          ? String(
            response.message ||
            response.data ||
            "Unable to save production entry."
          )
          : "Unable to save production entry.";

      if (isFailed) {
        setSubmitStatus("error");
        setSubmitMessage(responseMessage);
        toast.error(responseMessage);
        return;
      }

      if (packedWastageQty > 0 && availableWastageQty > 0) {
        setIsReducingWastage(true);
        console.log("Reducing wastage:", {
          tphBatch: formData.tphBatch,
          finishedProductName: formData.finishedProductName,
          remainingWastageQty: remainingWastageQty,
        });

        const reductionResponse = await reduceWastageQty({
          tphBatch: formData.tphBatch,
          finishedProductName: formData.finishedProductName,
          remainingWastageQty: remainingWastageQty,
        });

        const isReductionFailed =
          reductionResponse &&
          typeof reductionResponse === "object" &&
          "success" in reductionResponse &&
          reductionResponse.success === false;

        const reductionMessage =
          reductionResponse && typeof reductionResponse === "object"
            ? String(
              reductionResponse.message ||
              reductionResponse.data ||
              "Unable to reduce wastage quantity."
            )
            : "Unable to reduce wastage quantity.";

        if (isReductionFailed) {
          setSubmitStatus("error");
          setSubmitMessage(reductionMessage);
          toast.error(reductionMessage);
          return;
        }

        const latestWastageQty = await fetchWastageQty({
          tphBatch: formData.tphBatch,
          productCategory: selectedProductCategory,
          finishedProductName: formData.finishedProductName,
        });

        setAvailableWastageQty(latestWastageQty);
      }

      setFormData(initialFormData);
      setOtherSelections(initialManufacturingOtherState);
      setRawMaterials(initialRawMaterials);
      setProductItems([emptyProductItem]);
      setAvailableWastageQty(0);
      setWastageBagSize("");
      setWastageTotalBags("");
      toast.success("Production entry saved successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save production entry.";
      setSubmitStatus("error");
      setSubmitMessage(message);
      toast.error(message);
    } finally {
      setIsReducingWastage(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="min-w-0">
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>Production entry form</CardTitle>
            <CardDescription>Record production batches, material usage, output, bags, and wastage.</CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link to="/manufacturing-entries">
              <Eye />
              View Entries
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-5"
            onReset={() => {
              setFormData(initialFormData);
              setOtherSelections(initialManufacturingOtherState);
              setRawMaterials(initialRawMaterials);
              setProductItems([emptyProductItem]);
              setAvailableWastageQty(0);
              setWastageBagSize("");
              setWastageTotalBags("");
              setSubmitStatus("idle");
              setSubmitMessage("");
            }}
            onSubmit={handleSubmit}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <Field htmlFor="productionDate" label="Production Date">
                <Input
                  id="productionDate"
                  name="productionDate"
                  type="date"
                  value={formData.productionDate}
                  onChange={(e) => updateField("productionDate", e.target.value)}
                />
              </Field>

              <Field htmlFor="tphBatch" label="TPH / Batch">
                <Select
                  id="tphBatch"
                  name="tphBatch"
                  value={getSelectValue("tphBatch", formData.tphBatch)}
                  onChange={(e) => {
                    const tphBatch = e.target.value;
                    const isOtherSelection = tphBatch === OTHER_OPTION;

                    setOtherSelections((current) => ({
                      ...current,
                      tphBatch: isOtherSelection,
                      productCategory: false,
                      finishedProductName: false,
                      bagSize: false,
                      token: false,
                      color: false,
                    }));

                    if (isOtherSelection) {
                      setFormData({
                        ...formData,
                        tphBatch: "",
                        productCategory: "",
                        color: "",
                        finishedProductName: "",
                        bagSize: "",
                        token: "",
                      });
                      setRawMaterials(initialRawMaterials);
                      return;
                    }

                    const defaults = getBatchDefaults(tphBatch);

                    setFormData({
                      ...formData,
                      tphBatch,
                      productCategory: defaults.productCategory,
                      color: defaults.color,
                      finishedProductName: "",
                      bagSize: "",
                      token: defaults.productCategory === "Tile Adhesive" ? "" : "N/A",
                    });
                    setRawMaterials(initialRawMaterials);
                  }}
                >
                  <option value="" disabled>
                    Select TPH/Batch
                  </option>

                  {getOptionsWithOther(["1TPH", "2TPH", "Manual Blender", "Sigma Mixer", "Manual Hand Mixer"]).map((option) => (
                    <option key={option} value={option === "Other" ? OTHER_OPTION : option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>
              {renderOtherInput("tphBatch", "TPH / Batch", "Enter batch type")}

              <Field htmlFor="batchNo" label="Batch No.">
                <Input
                  id="batchNo"
                  name="batchNo"
                  placeholder="e.g. B-2405-018"
                  value={formData.batchNo}
                  onChange={(e) => updateField("batchNo", e.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field htmlFor="productCategory" label="Product Category">
                <Select
                  id="productCategory"
                  name="productCategory"
                  value={getSelectValue("productCategory", formData.productCategory)}
                  onChange={(e) => {
                    const value = e.target.value;
                    const isOtherSelection = value === OTHER_OPTION;

                    setOtherSelections((current) => ({
                      ...current,
                      productCategory: isOtherSelection,
                      finishedProductName: false,
                      bagSize: false,
                      color: false,
                    }));

                    setFormData({
                      ...formData,
                      productCategory: isOtherSelection ? "" : value,
                      color: isOtherSelection ? "" : formData.tphBatch === "2TPH" ? "Grey" : formData.color,
                      finishedProductName: "",
                      bagSize: "",
                    });
                    setRawMaterials(initialRawMaterials);
                  }}
                  disabled={
                    isProductCategoryLocked || !formData.tphBatch
                  }
                >
                  <option value="" disabled>
                    Select category
                  </option>

                  {getOptionsWithOther(productCategoryOptions).map((option) => (
                    <option key={option} value={option === "Other" ? OTHER_OPTION : option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>
              {renderOtherInput("productCategory", "Product Category", "Enter product category")}
              <Field
                htmlFor="finishedProductName"
                label="Finished Product Name"
              >
                {finishedProductOptions.length > 0 ? (
                  <Select
                    id="finishedProductName"
                    name="finishedProductName"
                    value={getSelectValue("finishedProductName", formData.finishedProductName)}
                    onChange={(e) => {
                      handleSelectChange("finishedProductName", e.target.value);
                      setRawMaterials(initialRawMaterials);
                    }}
                  >
                    <option value="" disabled>Select Finished Product</option>
                    {getOptionsWithOther(finishedProductOptions).map((option) => (
                      <option key={option} value={option === "Other" ? OTHER_OPTION : option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    id="finishedProductName"
                    name="finishedProductName"
                    placeholder="Enter finished product"
                    value={formData.finishedProductName}
                    onChange={(e) => updateTextField("finishedProductName", e.target.value)}
                  />
                )}
              </Field>

              {finishedProductOptions.length > 0 &&
                renderOtherInput("finishedProductName", "Finished Product Name", "Enter finished product")}

              <Field htmlFor="color" label="Color (auto-filled for TPH batches)">
                {colorOptions.length > 0 || isColorDisabled ? (
                  <Select
                    id="color"
                    name="color"
                    value={getSelectValue("color", selectedColor || "")}
                    onChange={(e) => handleSelectChange("color", e.target.value)}
                    disabled={isColorDisabled}
                  >
                    <option value="" disabled>
                      Select Color
                    </option>
                    {isColorDisabled && selectedColor ? (
                      <option value={selectedColor}>{selectedColor}</option>
                    ) : null}
                    {getOptionsWithOther(colorOptions).map((option) => (
                      <option key={option} value={option === "Other" ? OTHER_OPTION : option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    id="color"
                    name="color"
                    placeholder="e.g. Grey, White, etc."
                    value={selectedColor || ""}
                    onChange={(e) => updateTextField("color", e.target.value)}
                  />
                )}
              </Field>
              {colorOptions.length > 0 && !isColorDisabled && renderOtherInput("color", "Color", "Enter color")}
            </div>

            <div className="space-y-4">

              <h2 className="text-lg font-semibold">Raw Materials Used</h2>

              <hr className="my-0" />

              {rawMaterials.map((item, index) => (

                <div
                  key={index}
                  className="flex flex-col gap-4 rounded-md border p-4 md:items-end xl:grid xl:grid-cols-4"
                >
                  <Field className="min-w-0" htmlFor={`rawMaterialName-${index}`} label="Raw Material">
                    <Input
                      className="w-full"
                      id={`rawMaterialName-${index}`}
                      placeholder="e.g. Cement"
                      readOnly={isRecipeLocked}
                      value={item.packagingType}
                      onChange={(e) =>
                        updateRawMaterialTextField(index, "rawMaterialName", e.target.value)
                      }
                    />
                  </Field>

                  <Field className="min-w-0" htmlFor={`packagingType-${index}`} label="Packaging Type">
                    <Input
                      className="w-full"
                      id={`rawMaterialName-${index}`}
                      placeholder="e.g. White, Premix"
                      readOnly={isRecipeLocked}
                      value={item.rawMaterialName}
                      onChange={(e) =>
                        updateRawMaterialTextField(index, "packagingType", e.target.value)
                      }
                    />
                  </Field>

                  <Field className="min-w-0" htmlFor={`materialQuantity-${index}`} label="Material Quantity">
                    <Input
                      className="w-full"
                      id={`materialQuantity-${index}`}
                      placeholder="e.g. 1000 kg"
                      readOnly={isRecipeLocked}
                      value={item.materialQuantity}
                      onChange={(e) =>
                        updateRawMaterialNumberField(index, "materialQuantity", e.target.value)
                      }
                    />
                  </Field>

                  <Field className="min-w-0" htmlFor={`materialUnit-${index}`} label="Unit">
                    <Input
                      className="w-full"
                      id={`materialUnit-${index}`}
                      placeholder="e.g. kg"
                      readOnly={isRecipeLocked}
                      value={item.materialUnit}
                      onChange={(e) =>
                        updateRawMaterialTextField(index, "materialUnit", e.target.value)
                      }
                    />
                  </Field>
                </div>
              ))}
            </div>

            <div className="space-y-4">

              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Finished Product Details</h2>

                <button
                  type="button"
                  onClick={addProductItem}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white"
                >
                  + Add Item
                </button>
              </div>

              <hr className="my-0" />

              <div className="rounded-lg bg-blue-50 p-4 text-sm font-medium">
                Total Batch: {batchKg} KG | Packed: {totalPackedKg} KG | Remaining/Wastage:{" "}
                {remainingKg} KG
              </div>

              {productItems.map((item, index) => (
                <div key={index} className="rounded-xl border p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Product Item {index + 1}</h3>

                    {productItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProductItem(index)}
                        className="text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <Field
                      label="Token"
                      htmlFor={`token-${index}`}
                    >
                      <Select
                        id={`token-${index}`}
                        value={item.token}
                        onChange={(e) => updateProductItem(index, "token", e.target.value)}
                        disabled={!isTileAdhesiveProduct}
                      >
                        {isTileAdhesiveProduct ? (
                          <>
                            <option value="">Select Token</option>
                            <option value="Coupon">Coupon</option>
                            <option value="Non-Coupon">Non-Coupon</option>
                          </>
                        ) : (
                          <option value="N/A">N/A</option>
                        )}
                      </Select>
                    </Field>

                    <Field
                      label={bagSizeLabel}
                      htmlFor={`bagSize-${index}`}
                    >
                      <Select
                        id={`bagSize-${index}`}
                        value={item.bagSize}
                        onChange={(e) => {
                          const bagSize = e.target.value;

                          updateProductItem(index, "bagSize", bagSize);
                          updateProductItem(
                            index,
                            "totalBagsProduced",
                            getTotalBagsProduced(formData.tphBatch, bagSize)
                          );
                        }}
                      >
                        <option value="">Select {bagSizeLabel}</option>

                        {formData.productCategory === "Bondure" && (
                          <option value="40kg">40KG</option>
                        )}

                        {formData.productCategory === "Epoxy" && (
                          <>
                            <option value="1kg">1KG</option>
                            <option value="5kg">5KG</option>
                          </>
                        )}

                        {formData.productCategory === "Grout" && (
                          <option value="Pouch 1KG">1KG</option>
                        )}

                        {formData.productCategory === "Tile Cleaner" && (
                          <>
                            <option value="1L">1L</option>
                            <option value="5L">5L</option>
                          </>
                        )}

                        {!["Bondure", "Epoxy", "Grout", "Tile Cleaner"].includes(
                          formData.productCategory
                        ) && (
                            <>
                              <option value="20kg">20KG</option>
                              <option value="50kg">50KG</option>
                            </>
                          )}
                      </Select>
                    </Field>

                    <Field
                      label={totalProducedLabel}
                      htmlFor={`totalBagsProduced-${index}`}
                    >
                      <Input
                        type="number"
                        min="0"
                        id={`totalBagsProduced-${index}`}
                        value={item.totalBagsProduced}
                        onChange={(e) =>
                          updateProductItem(index, "totalBagsProduced", e.target.value)
                        }
                      />
                    </Field>

                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 rounded-xl border p-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Wastage Quantity Usage</h2>
                <p className="text-sm text-muted-foreground">Use available wastage stock separately from finished product packing.</p>
              </div>

              <div
                className={`rounded-lg border p-4 text-sm font-medium ${isWastageExceeded
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
              >
                {isWastageLoading ? (
                  <span>Loading wastage quantity...</span>
                ) : (
                  <div className="">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <div>Total Available Wastage: {availableWastageQty} KG</div>
                      <div>Packed Wastage: {packedWastageQty} KG</div>
                      <div>Remaining Wastage: {Math.max(0, remainingWastageQty)} KG</div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2 mt-4">
                      <Field className="md:col-span-1" htmlFor="wastageBagSize" label="Wastage Bag Size">
                        <Select
                          id="wastageBagSize"
                          value={wastageBagSize}
                          onChange={(e) => setWastageBagSize(e.target.value)}
                        >
                          <option value="">Select Bag Size</option>
                          <option value="20kg">20kg</option>
                          <option value="50kg">50kg</option>
                        </Select>
                      </Field>
                      <Field className="md:col-span-1" htmlFor="wastageTotalBags" label="Wastage Total Bags">
                        <Input
                          id="wastageTotalBags"
                          type="number"
                          min="0"
                          step="1"
                          value={wastageTotalBags}
                          onChange={(e) => setWastageTotalBags(sanitizeNumberOnly(e.target.value))}
                          placeholder="Enter total bags"
                        />
                      </Field>
                    </div>
                  </div>
                )}
              </div>

              {isWastageExceeded ? (
                <p className="text-sm font-medium text-red-600">
                  Packed wastage quantity cannot be greater than available wastage quantity.
                </p>
              ) : null}
            </div>

            <div className="grid gap-4">
              <Field htmlFor="remarks" label="Remarks">
                <Textarea
                  id="remarks"
                  name="remarks"
                  placeholder="Add notes about batch quality, downtime, shortage, or rework"
                  value={formData.remarks}
                  onChange={(e) => updateField("remarks", e.target.value)}
                />
              </Field>
            </div>


            {formData.productCategory === "Epoxy" && (
              <>
                <input name="sticker" type="hidden" value={formData.sticker} />
                <input name="sponge" type="hidden" value={formData.sponge} />
              </>
            )}

            {formData.productCategory === "Tile Cleaner" && (
              <>
                <input name="sticker" type="hidden" value={formData.sticker} />
                <input name="sponge" type="hidden" value={formData.sponge} />
              </>
            )}

            <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
              {submitStatus === "error" && submitMessage && (
                <p
                  className="text-sm font-medium text-destructive sm:mr-auto"
                >
                  {submitMessage}
                </p>
              )}
              <Button disabled={isSubmitting || isReducingWastage} type="reset" variant="outline">
                <RotateCcw />
                Reset
              </Button>
              <Button
                disabled={isSubmitting || isReducingWastage || isWastageInvalid}
                type="submit"
                style={{
                  backgroundColor: isSubmitting ? "#e8e8e8" : "",
                  color: isSubmitting ? "#333" : "",
                }}
              >
                {isSubmitting || isReducingWastage ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <SubmitLoader />
                  </div>
                ) : (
                  <>
                    <Save />
                    {isReducingWastage ? "Reducing wastage..." : "Save production"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
              )))}
            {recentBatches.length > recentBatchesPageSize ? (
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
    </div>
  );
}
