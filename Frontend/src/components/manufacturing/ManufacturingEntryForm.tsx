import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Eye, RotateCcw, Save } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchWastageQty, reduceWastageQty, submitEntry } from "@/lib/api";
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
} from "@/components/manufacturing/manufacturingData";
import { buildTileCleanerRecipe, normalizeTileCleanerProductName } from "@/components/manufacturing/tileCleanerRecipes";
import SubmitLoader from "../ui/SubmitLoader";
import { BatchDetailsSection } from "./manufacturing-entry-form/components/BatchDetailsSection";
import { FinishedProductSection } from "./manufacturing-entry-form/components/FinishedProductSection";
import { ProductDetailsSection } from "./manufacturing-entry-form/components/ProductDetailsSection";
import { RawMaterialsSection } from "./manufacturing-entry-form/components/RawMaterialsSection";
import { RecentBatchesPanel } from "./manufacturing-entry-form/components/RecentBatchesPanel";
import { WastageSection } from "./manufacturing-entry-form/components/WastageSection";
import {
  EMPTY_PRODUCT_ITEM,
  GROUT_COLORS,
  INITIAL_MANUFACTURING_OTHER_STATE,
  INITIAL_RAW_MATERIALS,
  OTHER_OPTION,
  PRODUCT_CATEGORIES,
  TILE_ADHESIVE_GREY_PRODUCTS,
  TILE_ADHESIVE_WHITE_PRODUCTS,
  TILE_CLEANER_PRODUCTS,
  createInitialFormData,
} from "./manufacturing-entry-form/constants";
import { Field } from "./manufacturing-entry-form/Field";
import { useAvailableWastage } from "./manufacturing-entry-form/hooks/useAvailableWastage";
import { useRecentBatches } from "./manufacturing-entry-form/hooks/useRecentBatches";
import type {
  ManufacturingFormData,
  ManufacturingOtherField,
  ManufacturingProductItem,
  ManufacturingRawMaterial,
  SubmitStatus,
} from "./manufacturing-entry-form/types";
import {
  getAutoProducedQuantity,
  getBatchDefaults,
  getBatchKg,
  getBondureTotalBagsProduced,
  getFinalTotalBagsProduced,
  getOptionsWithOther,
  getTotalPackedKg,
  getWastageSizeLabel,
  getWastageSizeOptions,
  isNonNegativeNumber,
  isPositiveNumber,
} from "./manufacturing-entry-form/utils";

export function ManufacturingEntryForm() {
  const [formData, setFormData] = useState<ManufacturingFormData>(createInitialFormData);
  const [otherSelections, setOtherSelections] = useState(INITIAL_MANUFACTURING_OTHER_STATE);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rawMaterials, setRawMaterials] = useState<ManufacturingRawMaterial[]>(INITIAL_RAW_MATERIALS);
  const [productItems, setProductItems] = useState<ManufacturingProductItem[]>([EMPTY_PRODUCT_ITEM]);
  const [wastageBagSize, setWastageBagSize] = useState("");
  const [wastageTotalBags, setWastageTotalBags] = useState("");
  const [isReducingWastage, setIsReducingWastage] = useState(false);

  const {
    recentBatches,
    recentBatchesPage,
    setRecentBatchesPage,
    totalRecentBatchPages,
    visibleRecentBatches,
  } = useRecentBatches();

  const selectedProductCategory = formData.productCategory;
  const { availableWastageQty, isWastageLoading, setAvailableWastageQty } = useAvailableWastage(
    formData.tphBatch,
    selectedProductCategory,
    formData.finishedProductName,
  );

  const batchKg = getBatchKg(formData.tphBatch);
  const totalPackedKg = useMemo(() => getTotalPackedKg(productItems), [productItems]);
  const remainingKg = Math.max(0, batchKg - totalPackedKg);
  const totalProducedUnits = useMemo(
    () => String(productItems.reduce((sum, item) => sum + (Number(item.totalBagsProduced) || 0), 0)),
    [productItems],
  );
  const isTileAdhesiveProduct = selectedProductCategory === "Tile Adhesive";
  const isTileCleanerProduct = selectedProductCategory === "Tile Cleaner";
  const isAutoCalculatedPackagingProduct = ["Epoxy", "Grout"].includes(selectedProductCategory);
  const isSinglePackagingRowProduct = isAutoCalculatedPackagingProduct || isTileCleanerProduct;
  const wastageSizeLabel = getWastageSizeLabel(formData.productCategory);
  const wastageSizeOptions = getWastageSizeOptions(formData.productCategory);
  const totalAvailableWastage = Number(availableWastageQty || 0);
  const wastageBagSizeKg = Number(String(wastageBagSize || "").replace(/kg/i, ""));
  const packedWastageQty = wastageBagSizeKg * Number(wastageTotalBags || 0);
  const remainingWastageQty = Math.max(0, totalAvailableWastage - packedWastageQty);
  const isWastageExceeded = packedWastageQty > totalAvailableWastage;
  const isWastageUnavailable = totalAvailableWastage < 0;
  const isWastageInvalid = isWastageUnavailable || isWastageExceeded;

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

  const productCategoryOptions =
    formData.tphBatch === "2TPH" ? ["Tile Adhesive", "Bondure"] : PRODUCT_CATEGORIES;
  const isProductCategoryLocked = ["1TPH", "Manual Blender", "Sigma Mixer", "Manual Hand Mixer"].includes(
    formData.tphBatch,
  );
  const colorOptions =
    formData.tphBatch === "Manual Blender"
      ? GROUT_COLORS
      : formData.tphBatch === "Sigma Mixer"
        ? epoxyColors
        : [];
  const isColorDisabled =
    ["1TPH", "2TPH", "Manual Hand Mixer"].includes(formData.tphBatch) ||
    isTileAdhesiveProduct ||
    selectedProductCategory === "Grout";
  const finishedProductOptions =
    formData.tphBatch === "Manual Hand Mixer"
      ? TILE_CLEANER_PRODUCTS
      : selectedProductCategory === "Grout"
        ? groutProducts
        : selectedProductCategory === "Epoxy"
          ? epoxyProducts
          : isTileAdhesiveProduct && selectedColor === "White"
            ? TILE_ADHESIVE_WHITE_PRODUCTS
            : isTileAdhesiveProduct && selectedColor === "Grey"
              ? TILE_ADHESIVE_GREY_PRODUCTS
              : [];
  const bagSizeLabel =
    formData.productCategory === "Epoxy"
      ? "Bucket Size"
      : formData.productCategory === "Tile Cleaner"
        ? "Can Size"
        : formData.productCategory === "Grout"
          ? "Pouch Size"
          : "Bag Size";

  useEffect(() => {
    const hasUsedWastage =
      availableWastageQty > 0 &&
      remainingWastageQty !== availableWastageQty;

    const nextWastageQty = hasUsedWastage
      ? Math.max(0, remainingWastageQty)
      : Math.max(0, remainingKg);

    setFormData((prev) => {
      const nextValue = String(nextWastageQty);
      return prev.wastageQty === nextValue
        ? prev
        : { ...prev, wastageQty: nextValue };
    });

    if (batchKg > 0 && remainingKg === 0 && totalPackedKg > 0) {
      toast.success("Batch quantity completed. Remaining quantity is 0 KG.");
    }
  }, [
    availableWastageQty,
    batchKg,
    remainingKg,
    remainingWastageQty,
    totalPackedKg,
  ]);

  useEffect(() => {
    if (isWastageExceeded) {
      toast.error("Packed wastage quantity cannot be greater than available wastage quantity.");
    }
  }, [isWastageExceeded]);

  useEffect(() => {
    if (selectedProductCategory !== "Bondure") {
      return;
    }

    setFormData((current) =>
      current.finishedProductName === "Bondure"
        ? current
        : {
          ...current,
          finishedProductName: "Bondure",
        },
    );
  }, [selectedProductCategory]);

  useEffect(() => {
    setWastageBagSize("");
  }, [formData.productCategory]);

  useEffect(() => {
    if (selectedProductCategory !== "Bondure") {
      return;
    }

    const primaryItem = productItems[0] ?? {
      bagSize: "",
      totalBagsProduced: "",
    };

    setFormData((current) => {
      const nextBagSize = primaryItem.bagSize || "";
      const nextTotalBagsProduced = primaryItem.totalBagsProduced || "";

      if (
        current.finishedProductName === "Bondure" &&
        current.bagSize === nextBagSize &&
        current.totalBagsProduced === nextTotalBagsProduced
      ) {
        return current;
      }

      return {
        ...current,
        finishedProductName: "Bondure",
        bagSize: nextBagSize,
        totalBagsProduced: nextTotalBagsProduced,
      };
    });
  }, [productItems, selectedProductCategory]);

  const updateRawMaterialField = (
    index: number,
    field: string,
    value: string,
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

  const updateField = (name: keyof ManufacturingFormData, value: string) => {
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const updateTextField = (name: keyof ManufacturingFormData, value: string) => {
    updateField(name, sanitizeTextOnly(value));
  };

  const updateProductItem = (
    index: number,
    field: keyof ManufacturingProductItem,
    value: string,
  ) => {
    setProductItems((current) => {
      const updated = current.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      );

      const packedKg = getTotalPackedKg(updated);

      if (batchKg > 0 && packedKg > batchKg) {
        toast.error("Total bags cannot be greater than batch quantity.");
        return current;
      }

      return updated;
    });
  };

  useEffect(() => {
    setProductItems((current) =>
      current.map((item) => {
        if (selectedProductCategory === "Bondure") {
          return item;
        }

        const nextTotalBagsProduced = isAutoCalculatedPackagingProduct
          ? getAutoProducedQuantity(selectedProductCategory, batchKg, item.bagSize)
          : getFinalTotalBagsProduced(
            formData.tphBatch,
            item.bagSize,
            wastageTotalBags,
          );

        return item.totalBagsProduced === nextTotalBagsProduced
          ? item
          : { ...item, totalBagsProduced: nextTotalBagsProduced };
      }),
    );
  }, [batchKg, formData.tphBatch, isAutoCalculatedPackagingProduct, productItems.length, selectedProductCategory, wastageTotalBags]);

  useEffect(() => {
    if (!isSinglePackagingRowProduct || productItems.length <= 1) {
      return;
    }

    setProductItems((current) => current.slice(0, 1));
  }, [isSinglePackagingRowProduct, productItems.length]);

  const addProductItem = () => {
    setProductItems((current) => [...current, EMPTY_PRODUCT_ITEM]);
  };

  const removeProductItem = (index: number) => {
    setProductItems((current) =>
      current.length === 1 ? current : current.filter((_, i) => i !== index),
    );
  };

  const getSelectValue = (field: ManufacturingOtherField, value: string) =>
    otherSelections[field] ? OTHER_OPTION : value;

  const handleSelectChange = (
    field: ManufacturingOtherField,
    value: string,
    fieldsToClear: ManufacturingOtherField[] = [],
    extraUpdates: Partial<ManufacturingFormData> = {},
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
    if (selectedProductCategory !== "Tile Cleaner") {
      return;
    }

    const primaryItem = productItems[0];
    const tileCleanerProductName = normalizeTileCleanerProductName(
      formData.finishedProductName,
    );
    const canSize = String(primaryItem?.bagSize || formData.canSize || "");
    const totalCan = String(primaryItem?.totalBagsProduced || formData.totalCan || "");
    const recipe = 
    buildTileCleanerRecipe(tileCleanerProductName, canSize, totalCan);

    setRawMaterials(recipe.length > 0 ? recipe : INITIAL_RAW_MATERIALS);
  }, [
    selectedProductCategory,
    formData.finishedProductName,
    formData.canSize,
    formData.totalCan,
    productItems[0]?.bagSize,
    productItems[0]?.totalBagsProduced,
  ]);

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

    const normalizedProductName = normalizeTileCleanerProductName(formData.finishedProductName);
    if (!normalizedProductName || formData.finishedProductName === normalizedProductName) {
      return;
    }

    setFormData((current) => ({
      ...current,
      finishedProductName: normalizedProductName,
    }));
  }, [selectedProductCategory, formData.finishedProductName]);

  useEffect(() => {
    if (!isTileCleanerProduct) {
      return;
    }

    const primaryItem = productItems[0];
    const nextCanSize = primaryItem?.bagSize || "";
    const nextTotalCan = primaryItem?.totalBagsProduced || "";

    setFormData((current) =>
      current.canSize === nextCanSize && current.totalCan === nextTotalCan
        ? current
        : {
          ...current,
          canSize: nextCanSize,
          totalCan: nextTotalCan,
        },
    );
  }, [isTileCleanerProduct, productItems]);

  useEffect(() => {
    if (selectedProductCategory !== "Epoxy") {
      setFormData((current) =>
        current.sticker || current.sponge ? { ...current, sticker: "", sponge: "" } : current,
      );
      return;
    }

    const hiddenPackagingValue = totalProducedUnits.trim();

    setFormData((current) =>
      current.sticker === hiddenPackagingValue && current.sponge === hiddenPackagingValue
        ? current
        : {
          ...current,
          sticker: hiddenPackagingValue,
          sponge: hiddenPackagingValue,
        },
    );
  }, [selectedProductCategory, totalProducedUnits]);

  const resetForm = () => {
    setFormData(createInitialFormData());
    setOtherSelections(INITIAL_MANUFACTURING_OTHER_STATE);
    setRawMaterials(INITIAL_RAW_MATERIALS);
    setProductItems([EMPTY_PRODUCT_ITEM]);
    setAvailableWastageQty(0);
    setWastageBagSize("");
    setWastageTotalBags("");
    setSubmitStatus("idle");
    setSubmitMessage("");
  };

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
      toast.error("No wastage quantity available for the selected product.");
      return;
    }

    if (isWastageExceeded) {
      toast.error(
        `Packed wastage ${packedWastageQty} KG cannot be greater than available wastage ${totalAvailableWastage} KG.`,
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        color: selectedColor,
        productCategory: selectedProductCategory,
        canSize: isTileCleanerProduct ? productItems[0]?.bagSize || formData.canSize : "",
        totalCan: isTileCleanerProduct ? productItems[0]?.totalBagsProduced || formData.totalCan : "",
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
            "Unable to save production entry.",
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
          remainingWastageQty,
        });

        const reductionResponse = await reduceWastageQty({
          tphBatch: formData.tphBatch,
          finishedProductName: formData.finishedProductName,
          remainingWastageQty,
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
              "Unable to reduce wastage quantity.",
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

      setFormData(createInitialFormData());
      setOtherSelections(INITIAL_MANUFACTURING_OTHER_STATE);
      setRawMaterials(INITIAL_RAW_MATERIALS);
      setProductItems([EMPTY_PRODUCT_ITEM]);
      setAvailableWastageQty(0);
      setWastageBagSize("");
      setWastageTotalBags("");
      toast.success("Production entry saved successfully.");
    } catch (error: any) {
      const message =
        error?.message ||
        error?.data?.message ||
        "Unable to save production entry.";

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
      <Card className="min-w-0 rounded-[1.75rem] border border-white/70 bg-white/90 shadow-[0_24px_60px_rgba(15,23,42,0.10)] backdrop-blur">
        <CardHeader className="gap-3 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Production Workspace
            </p>
            <CardTitle className="text-3xl tracking-[-0.03em]">Production entry form</CardTitle>
          </div>
          <Button asChild variant="outline">
            <Link to="/manufacturing-entries">
              <Eye />
              View Entries
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          <form className="grid gap-5" onReset={resetForm} onSubmit={handleSubmit}>
            <BatchDetailsSection
              formData={formData}
              getSelectValue={getSelectValue}
              onBatchNoChange={(value) => updateField("batchNo", value)}
              onProductionDateChange={(value) => updateField("productionDate", value)}
              onTphBatchChange={(tphBatch) => {
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
                  setRawMaterials(INITIAL_RAW_MATERIALS);
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
                setRawMaterials(INITIAL_RAW_MATERIALS);
              }}
              renderOtherInput={renderOtherInput}
            />

            <ProductDetailsSection
              colorOptions={colorOptions}
              finishedProductOptions={finishedProductOptions}
              formData={formData}
              getSelectValue={getSelectValue}
              isColorDisabled={isColorDisabled}
              isProductCategoryLocked={isProductCategoryLocked}
              onColorChange={(value) => handleSelectChange("color", value)}
              onFinishedProductNameChange={(value) => {
                handleSelectChange("finishedProductName", value);
                setRawMaterials(INITIAL_RAW_MATERIALS);
              }}
              onFinishedProductNameInputChange={(value) => updateTextField("finishedProductName", value)}
              onProductCategoryChange={(value) => {
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
                setRawMaterials(INITIAL_RAW_MATERIALS);
              }}
              productCategoryOptions={productCategoryOptions}
              renderOtherInput={renderOtherInput}
              selectedColor={selectedColor}
              updateTextField={updateTextField}
            />

            <RawMaterialsSection
              rawMaterials={rawMaterials}
              updateRawMaterialNumberField={updateRawMaterialNumberField}
              updateRawMaterialTextField={updateRawMaterialTextField}
            />

            <FinishedProductSection
              addProductItem={addProductItem}
              bagSizeLabel={bagSizeLabel}
              batchKg={batchKg}
              disableAddProductItem={isSinglePackagingRowProduct}
              formProductCategory={formData.productCategory}
              formTphBatch={formData.tphBatch}
              getAutoProducedQuantity={getAutoProducedQuantity}
              getBondureTotalBagsProduced={getBondureTotalBagsProduced}
              getFinalTotalBagsProduced={getFinalTotalBagsProduced}
              isAutoCalculatedPackagingProduct={isAutoCalculatedPackagingProduct}
              isTileAdhesiveProduct={isTileAdhesiveProduct}
              productItems={productItems}
              remainingKg={remainingKg}
              removeProductItem={removeProductItem}
              selectedProductCategory={selectedProductCategory}
              totalPackedKg={totalPackedKg}
              totalProducedLabel={totalProducedLabel}
              updateProductItem={updateProductItem}
              wastageTotalBags={wastageTotalBags}
            />

            <WastageSection
              availableWastageQty={availableWastageQty}
              isWastageExceeded={isWastageExceeded}
              isWastageLoading={isWastageLoading}
              packedWastageQty={packedWastageQty}
              remainingWastageQty={remainingWastageQty}
              setWastageBagSize={setWastageBagSize}
              setWastageTotalBags={(value) => setWastageTotalBags(sanitizeNumberOnly(value))}
              wastageBagSize={wastageBagSize}
              wastageSizeLabel={wastageSizeLabel}
              wastageSizeOptions={wastageSizeOptions}
              wastageTotalBags={wastageTotalBags}
            />

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
                <p className="text-sm font-medium text-destructive sm:mr-auto">
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

      <RecentBatchesPanel
        recentBatches={recentBatches}
        recentBatchesPage={recentBatchesPage}
        setRecentBatchesPage={setRecentBatchesPage}
        totalRecentBatchPages={totalRecentBatchPages}
        visibleRecentBatches={visibleRecentBatches}
      />
    </div>
  );
}



