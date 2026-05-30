import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Eye, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { sanitizeNumberOnly, sanitizeTextOnly } from "@/lib/inputValidation";
import {
  fetchDispatchEntries,
  fetchProductionMaterialLogs,
  submitEntry,
  type DispatchEntry,
  type ProductionMaterialLog,
} from "@/lib/api";
import SubmitLoader from "../ui/SubmitLoader";

const MOBILE_RECENT_DEPARTURES_PAGE_SIZE = 3;
const DESKTOP_RECENT_DEPARTURES_PAGE_SIZE = 7;
const OTHER_OPTION = "__other__";
const dispatchOtherFields = ["productCategory", "productName", "token", "productColor", "bagSize"] as const;
type DispatchOtherField = (typeof dispatchOtherFields)[number];
const initialFormData = {
  date: "",
  time: "",
  challanNo: "",
  challanName: "",
  vehicleNo: "",
  driverName: "",
  driverContact: "",
  dispatchTime: "",
  dispatchSite: "",
  todayVehicleNo: "",
  token: "",
  productCategory: "",
  bagSize: "",
  productColor: "",
  productName: "",
  quantity: "",
  totalBags: "",
};

type DispatchProductSelection = Pick<
  typeof initialFormData,
  "token" | "productCategory" | "bagSize" | "productColor" | "productName" | "quantity" | "totalBags"
>;

const productSelectionFields = [
  "token",
  "productCategory",
  "bagSize",
  "productColor",
  "productName",
  "quantity",
  "totalBags",
] as const;

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

const initialDispatchOtherState = Object.fromEntries(
  dispatchOtherFields.map((field) => [field, false]),
) as Record<DispatchOtherField, boolean>;

function getOptionsWithOther(options: string[]) {
  const normalizedOptions = options.filter((option) => option.toLowerCase() !== "other" && option.toLowerCase() !== "others");
  return [...normalizedOptions, "Other"];
}

function isPositiveNumber(value: string) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0;
}

function isDigitsOnly(value: string) {
  return /^\d+$/.test(value.trim());
}

function isValidDriverContact(value: string) {
  return /^[6-9]\d{9}$/.test(value.trim());
}

export function ProductDepartureForm() {
  const [formData, setFormData] = useState(initialFormData);
  const [otherSelections, setOtherSelections] = useState(initialDispatchOtherState);
  const [selectedProducts, setSelectedProducts] = useState<DispatchProductSelection[]>([]);
  const [productionEntries, setProductionEntries] = useState<ProductionMaterialLog[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productLoadError, setProductLoadError] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentDepartures, setRecentDepartures] = useState<DispatchEntry[]>([]);
  const [recentDeparturesPage, setRecentDeparturesPage] = useState(1);
  const [recentDeparturesPageSize, setRecentDeparturesPageSize] = useState(() =>
    typeof window !== "undefined" && window.innerWidth >= 1024
      ? DESKTOP_RECENT_DEPARTURES_PAGE_SIZE
      : MOBILE_RECENT_DEPARTURES_PAGE_SIZE,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updatePageSize = () =>
      setRecentDeparturesPageSize(
        mediaQuery.matches ? DESKTOP_RECENT_DEPARTURES_PAGE_SIZE : MOBILE_RECENT_DEPARTURES_PAGE_SIZE,
      );

    updatePageSize();
    mediaQuery.addEventListener("change", updatePageSize);

    return () => mediaQuery.removeEventListener("change", updatePageSize);
  }, []);

  useEffect(() => {
    let isMounted = true;

    void fetchProductionMaterialLogs()
      .then((entries) => {
        if (!isMounted) {
          return;
        }

        setProductionEntries(entries.filter((entry) => entry.productCategory && entry.productName));
        setProductLoadError("");
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setProductionEntries([]);
        setProductLoadError(
          error instanceof Error ? error.message : "Unable to fetch production material logs.",
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const productCategories = useMemo(
    () => Array.from(new Set(productionEntries.map((entry) => entry.productCategory))).filter(Boolean),
    [productionEntries],
  );

  const productNames = useMemo(
    () =>
      Array.from(
        new Set(
          productionEntries
            .filter((entry) => entry.productCategory === formData.productCategory)
            .map((entry) => entry.productName),
        ),
      ).filter(Boolean),
    [formData.productCategory, productionEntries],
  );

  const productColors = useMemo(
    () =>
      Array.from(
        new Set(
          productionEntries
            .filter(
              (entry) =>
                entry.productCategory === formData.productCategory &&
                entry.productName === formData.productName,
            )
            .map((entry) => entry.productColor),
        ),
      ).filter(Boolean),
    [formData.productCategory, formData.productName, productionEntries],
  );
  const isTileCleanerSelected = formData.productCategory === "Tile Cleaner";

  const tokenOptions = useMemo(
    () =>
      Array.from(
        new Set(
          productionEntries
            .filter(
              (entry) =>
                entry.productCategory === formData.productCategory &&
                entry.productName === formData.productName,
            )
            .map((entry) => entry.token),
        ),
      ).filter(Boolean),
    [formData.productCategory, formData.productName, productionEntries],
  );

  const bagSizes = useMemo(
    () =>
      Array.from(
        new Set(
          productionEntries
            .filter(
              (entry) =>
                entry.productCategory === formData.productCategory &&
                entry.productName === formData.productName &&
                (isTileCleanerSelected || entry.productColor === formData.productColor) &&
                (!formData.token || entry.token === formData.token),
            )
            .map((entry) => entry.bagSize),
        ),
      ).filter(Boolean),
    [
      formData.productCategory,
      formData.productName,
      formData.productColor,
      formData.token,
      isTileCleanerSelected,
      productionEntries,
    ],
  );

  const selectedProductionEntry = useMemo(
    () =>
      productionEntries.find(
        (entry) =>
          entry.productCategory === formData.productCategory &&
          entry.productName === formData.productName &&
          (!formData.token || entry.token === formData.token) &&
          (isTileCleanerSelected || entry.productColor === formData.productColor) &&
          entry.bagSize === formData.bagSize,
      ),
    [
      formData.bagSize,
      formData.productCategory,
      formData.productColor,
      formData.productName,
      formData.token,
      isTileCleanerSelected,
      productionEntries,
    ],
  );
  const totalRecentDeparturePages = Math.max(1, Math.ceil(recentDepartures.length / recentDeparturesPageSize));
  const visibleRecentDepartures = recentDepartures.slice(
    (recentDeparturesPage - 1) * recentDeparturesPageSize,
    recentDeparturesPage * recentDeparturesPageSize,
  );
  const isManualProductSelection =
    otherSelections.productCategory ||
    otherSelections.productName ||
    otherSelections.productColor ||
    otherSelections.bagSize;

  useEffect(() => {
    if (!selectedProductionEntry) {
      if (!isManualProductSelection) {
        setFormData((current) => (current.quantity ? { ...current, quantity: "" } : current));
      }
      return;
    }

    if (isManualProductSelection) {
      return;
    }

    setFormData((current) => ({
      ...current,
      quantity: String(selectedProductionEntry.currentQuantity),
    }));
  }, [isManualProductSelection, selectedProductionEntry]);

  useEffect(() => {
    let isMounted = true;

    void fetchDispatchEntries()
      .then((entries) => {
        if (!isMounted) {
          return;
        }

        const sortedEntries = [...entries].sort((left, right) =>
          `${right.date} ${right.time}`.localeCompare(`${left.date} ${left.time}`),
        );
        setRecentDepartures(sortedEntries);
      })
      .catch(() => {
        if (isMounted) {
          setRecentDepartures([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (recentDeparturesPage > totalRecentDeparturePages) {
      setRecentDeparturesPage(totalRecentDeparturePages);
    }
  }, [recentDeparturesPage, totalRecentDeparturePages]);

  useEffect(() => {
    if (tokenOptions.length === 0) {
      setFormData((current) => (current.token ? { ...current, token: "" } : current));
      return;
    }

    setFormData((current) => {
      if (tokenOptions.includes(current.token)) {
        return current;
      }

      return {
        ...current,
        token: tokenOptions.length === 1 ? tokenOptions[0] : "",
      };
    });
  }, [tokenOptions]);

  useEffect(() => {
    if (!isTileCleanerSelected) {
      return;
    }

    setOtherSelections((current) =>
      current.productColor ? { ...current, productColor: false } : current,
    );

    setFormData((current) =>
      current.productColor ? { ...current, productColor: "" } : current,
    );
  }, [isTileCleanerSelected]);

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

  const updateDriverContactField = (value: string) => {
    updateField("driverContact", sanitizeNumberOnly(value).slice(0, 10));
  };

  const getSelectValue = (field: DispatchOtherField, value: string) =>
    otherSelections[field] ? OTHER_OPTION : value;

  const handleSelectChange = (
    field: DispatchOtherField,
    value: string,
    fieldsToClear: DispatchOtherField[] = [],
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

  const renderOtherInput = (field: DispatchOtherField, label: string, placeholder: string) =>
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

  const getCurrentProductSelection = (): DispatchProductSelection => ({
    token: formData.token,
    productCategory: formData.productCategory,
    bagSize: formData.bagSize,
    productColor: isTileCleanerSelected ? "" : formData.productColor,
    productName: formData.productName,
    quantity: formData.quantity,
    totalBags: formData.totalBags,
  });

  const resetProductSelectionFields = () => {
    setFormData((current) => ({
      ...current,
      ...Object.fromEntries(productSelectionFields.map((field) => [field, ""])),
    }));
    setOtherSelections(initialDispatchOtherState);
  };

  const getProductKey = (product: DispatchProductSelection) =>
    [
      product.productCategory,
      product.productName,
      product.token,
      product.productColor,
      product.bagSize,
    ].join("|");

  const formatProductLabel = (product: DispatchProductSelection) =>
    [product.productCategory, product.productName, product.token, product.productColor, product.bagSize]
      .filter(Boolean)
      .join(" / ");

  const validateProductSelection = (product: DispatchProductSelection, index?: number) => {
    const prefix = typeof index === "number" ? `Product ${index + 1}: ` : "";
    const isTileCleanerProduct = product.productCategory === "Tile Cleaner";

    if (!product.productCategory) {
      return `${prefix}Product category is required.`;
    }

    if (!product.productName) {
      return `${prefix}Product name is required.`;
    }

    if (!product.token) {
      return `${prefix}Token is required.`;
    }

    if (!isTileCleanerProduct && !product.productColor) {
      return `${prefix}Product color is required.`;
    }

    if (!product.bagSize) {
      return `${prefix}Bag size is required.`;
    }

    if (!isPositiveNumber(product.quantity)) {
      return `${prefix}Available stock must be greater than 0.`;
    }

    if (!isPositiveNumber(product.totalBags)) {
      return `${prefix}Departed bags must be greater than 0.`;
    }

    if (Number(product.totalBags) > Number(product.quantity)) {
      return `${prefix}Departed bags cannot be greater than available stock.`;
    }

    return "";
  };

  const getProductsForSubmission = () =>
    selectedProducts.length > 0 ? selectedProducts : [getCurrentProductSelection()];

  const handleAddProduct = () => {
    const product = getCurrentProductSelection();
    const validationMessage = validateProductSelection(product);

    if (validationMessage) {
      setSubmitStatus("error");
      setSubmitMessage(validationMessage);
      toast.error(validationMessage);
      return;
    }

    const productKey = getProductKey(product);
    const existingIndex = selectedProducts.findIndex((selectedProduct) => getProductKey(selectedProduct) === productKey);

    setSelectedProducts((current) => {
      if (existingIndex === -1) {
        return [...current, product];
      }

      return current.map((selectedProduct, index) => (index === existingIndex ? product : selectedProduct));
    });
    resetProductSelectionFields();
    setSubmitStatus("idle");
    setSubmitMessage("");
    toast.success(existingIndex === -1 ? "Product added to departure." : "Product line updated.");
  };

  const removeSelectedProduct = (indexToRemove: number) => {
    setSelectedProducts((current) => current.filter((_, index) => index !== indexToRemove));
  };

  const validateForm = () => {
    if (!formData.date) {
      return "Date is required.";
    }

    if (!formData.time) {
      return "Time is required.";
    }

    if (!formData.challanNo.trim()) {
      return "Challan No. is required.";
    }

    if (!formData.challanName.trim()) {
      return "Challan name is required.";
    }

    if (!formData.vehicleNo.trim()) {
      return "Vehicle No. is required.";
    }

    if (!formData.driverName.trim()) {
      return "Driver name is required.";
    }

    if (!formData.driverContact.trim()) {
      return "Driver contact is required.";
    }

    if (!isDigitsOnly(formData.driverContact)) {
      return "Driver contact must contain only digits.";
    }

    if (!isValidDriverContact(formData.driverContact)) {
      return "Driver contact must start with 6-9 and be exactly 10 digits.";
    }

    if (!formData.dispatchTime) {
      return "Dispatch time is required.";
    }

    if (!formData.dispatchSite.trim()) {
      return "Dispatch site is required.";
    }

    if (!isPositiveNumber(formData.todayVehicleNo)) {
      return "Today vehicle No. must be greater than 0.";
    }

    const productsToSubmit = getProductsForSubmission();

    for (let index = 0; index < productsToSubmit.length; index += 1) {
      const validationMessage = validateProductSelection(
        productsToSubmit[index],
        selectedProducts.length > 0 ? index : undefined,
      );

      if (validationMessage) {
        return validationMessage;
      }
    }

    return "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitStatus("idle");
    setSubmitMessage("");

    const validationMessage = validateForm();

    if (validationMessage) {
      setSubmitStatus("error");
      setSubmitMessage(validationMessage);
      toast.error(validationMessage);
      return;
    }

    const productsToSubmit = getProductsForSubmission();

    setIsSubmitting(true);

    try {
      for (const product of productsToSubmit) {
        await submitEntry("dispatch", {
          ...formData,
          ...product,
          productColor: product.productCategory === "Tile Cleaner" ? "" : product.productColor,
        });
      }
      setFormData(initialFormData);
      setOtherSelections(initialDispatchOtherState);
      setSelectedProducts([]);
      toast.success(
        productsToSubmit.length === 1
          ? "Dispatch entry saved successfully."
          : `${productsToSubmit.length} dispatch entries saved successfully.`,
      );
    } catch (error) {
      setSubmitStatus("error");
      setSubmitMessage(error instanceof Error ? error.message : "Unable to save dispatch entry.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="min-w-0">
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>Product dispatch form</CardTitle>
            <CardDescription>Capture challan, vehicle, dispatch, and one or more product departure lines.</CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link to="/dispatch-entries">
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
              setOtherSelections(initialDispatchOtherState);
              setSelectedProducts([]);
              setSubmitStatus("idle");
              setSubmitMessage("");
            }}
            onSubmit={handleSubmit}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field htmlFor="date" label="Date">
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateField("date", e.target.value)}
                />
              </Field>
              <Field htmlFor="time" label="Time">
                <Input
                  id="time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => updateField("time", e.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field htmlFor="challan-no" label="Challan No.">
                <Input
                  id="challan-no"
                  name="challanNo"
                  placeholder="e.g. CH-2405-112"
                  value={formData.challanNo}
                  onChange={(e) => updateField("challanNo", e.target.value)}
                />
              </Field>
              <Field htmlFor="challan-name" label="Challan Name">
                <Input
                  id="challan-name"
                  name="challanName"
                  placeholder="Enter challan name"
                  value={formData.challanName}
                  onChange={(e) => updateTextField("challanName", e.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field htmlFor="vehicle-no" label="Vehicle No.">
                <Input
                  id="vehicle-no"
                  name="vehicleNo"
                  placeholder="Enter vehicle number"
                  value={formData.vehicleNo}
                  onChange={(e) => updateField("vehicleNo", e.target.value)}
                />
              </Field>
              <Field htmlFor="driver-name" label="Driver Name">
                <Input
                  id="driver-name"
                  name="driverName"
                  placeholder="Enter driver name"
                  value={formData.driverName}
                  onChange={(e) => updateTextField("driverName", e.target.value)}
                />
              </Field>
              <Field htmlFor="driver-contact" label="Driver Contact">
                <Input
                  id="driver-contact"
                  inputMode="numeric"
                  maxLength={10}
                  name="driverContact"
                  placeholder="Enter 10-digit mobile number"
                  pattern="[6-9][0-9]{9}"
                  value={formData.driverContact}
                  onChange={(e) => updateDriverContactField(e.target.value)}
                />
              </Field>
              <Field htmlFor="dispatch-time" label="Dispatch Time">
                <Input
                  id="dispatch-time"
                  name="dispatchTime"
                  type="time"
                  value={formData.dispatchTime}
                  onChange={(e) => updateField("dispatchTime", e.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field htmlFor="dispatch-site" label="Dispatch Site">
                <Input
                  id="dispatch-site"
                  name="dispatchSite"
                  placeholder="Enter dispatch site"
                  value={formData.dispatchSite}
                  onChange={(e) => updateTextField("dispatchSite", e.target.value)}
                />
              </Field>
              <Field htmlFor="today-vehicle-no" label="Today Vehicle No.">
                <Input
                  id="today-vehicle-no"
                  min="1"
                  name="todayVehicleNo"
                  placeholder="Daily vehicle count"
                  type="number"
                  value={formData.todayVehicleNo}
                  onChange={(e) => updateNumberField("todayVehicleNo", e.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">

              <Field htmlFor="product-category" label="Product Category">
                <Select
                  id="product-category"
                  name="productCategory"
                  value={getSelectValue("productCategory", formData.productCategory)}
                  onChange={(e) =>
                    handleSelectChange(
                      "productCategory",
                      e.target.value,
                      ["token", "productName", "productColor", "bagSize"],
                      { quantity: "" },
                    )
                  }
                  disabled={isLoadingProducts}
                >
                  <option value="" disabled>
                    {isLoadingProducts ? "Loading categories..." : "Select category"}
                  </option>
                  {getOptionsWithOther(productCategories).map((option) => (
                    <option key={option} value={option === "Other" ? OTHER_OPTION : option}>{option}</option>
                  ))}
                </Select>
              </Field>
              {renderOtherInput("productCategory", "Product Category", "Enter product category")}

              <Field htmlFor="product-name" label="Product Name">
                <Select
                  id="product-name"
                  name="productName"
                  value={getSelectValue("productName", formData.productName)}
                  onChange={(e) =>
                    handleSelectChange(
                      "productName",
                      e.target.value,
                      ["token", "productColor", "bagSize"],
                      { quantity: "" },
                    )
                  }
                  disabled={!formData.productCategory}
                >
                  <option value="" disabled>
                    Select product
                  </option>
                  {getOptionsWithOther(productNames).map((option) => (
                    <option key={option} value={option === "Other" ? OTHER_OPTION : option}>{option}</option>
                  ))}
                </Select>
              </Field>
              {renderOtherInput("productName", "Product Name", "Enter product name")}

              <Field htmlFor="token" label="Token">
                <Select
                  id="token"
                  name="token"
                  value={getSelectValue("token", formData.token)}
                  onChange={(e) => handleSelectChange("token", e.target.value)}
                  disabled={!formData.productName}
                >
                  <option value="" disabled>
                    {!formData.productName ? "Select product first" : "Select token type"}
                  </option>
                  {getOptionsWithOther(tokenOptions).map((option) => (
                    <option key={option} value={option === "Other" ? OTHER_OPTION : option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>
              {renderOtherInput("token", "Token", "Enter token")}


              <Field htmlFor="product-color" label="Product Color">
                <Select
                  id="product-color"
                  name="productColor"
                  value={isTileCleanerSelected ? "" : getSelectValue("productColor", formData.productColor)}
                  onChange={(e) =>
                    handleSelectChange("productColor", e.target.value, ["bagSize"], { quantity: "" })
                  }
                  disabled={!formData.productName || isTileCleanerSelected}
                >
                  <option value="" disabled>
                    {isTileCleanerSelected ? "Not applicable for Tile Cleaner" : "Select color"}
                  </option>
                  {getOptionsWithOther(productColors).map((option) => (
                    <option key={option} value={option === "Other" ? OTHER_OPTION : option}>{option}</option>
                  ))}
                </Select>
              </Field>
              {!isTileCleanerSelected &&
                renderOtherInput("productColor", "Product Color", "Enter product color")}

              <Field htmlFor="bag-size" label="Bag Size">
                <Select
                  id="bag-size"
                  name="bagSize"
                  value={getSelectValue("bagSize", formData.bagSize)}
                  onChange={(e) => handleSelectChange("bagSize", e.target.value)}
                  disabled={!formData.productName || (!isTileCleanerSelected && !formData.productColor)}
                >
                  <option value="" disabled>
                    Select bag size
                  </option>
                  {getOptionsWithOther(bagSizes).map((option) => (
                    <option key={option} value={option === "Other" ? OTHER_OPTION : option}>{option}</option>
                  ))}
                </Select>
              </Field>
              {renderOtherInput("bagSize", "Bag Size", "Enter bag size")}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field htmlFor="quantity" label="Available Stock">
                <Input
                  id="quantity"
                  min="0"
                  name="quantity"
                  placeholder="0"
                  step="0.01"
                  type="number"
                  readOnly={!isManualProductSelection}
                  value={formData.quantity}
                  onChange={(e) => updateNumberField("quantity", e.target.value, { allowDecimal: true })}
                />
              </Field>
              <Field htmlFor="total-bags" label="Departed Bags">
                <Input
                  id="total-bags"
                  min="0"
                  name="totalBags"
                  placeholder="0"
                  type="number"
                  value={formData.totalBags}
                  onChange={(e) => updateNumberField("totalBags", e.target.value, { allowDecimal: true })}
                />
              </Field>
            </div>

            <div className="space-y-3 rounded-md border border-slate-200/80 bg-background/60 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Selected products</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add each product line before saving this departure.
                  </p>
                </div>
                <Button disabled={isSubmitting} type="button" variant="outline" onClick={handleAddProduct}>
                  <Plus />
                  Add product
                </Button>
              </div>

              {selectedProducts.length === 0 ? (
                <div className="rounded-md border border-dashed bg-white/70 p-3 text-sm text-muted-foreground">
                  No products added yet. The current product fields will be saved as a single departure line.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedProducts.map((product, index) => (
                    <div
                      className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                      key={`${getProductKey(product)}-${index}`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {formatProductLabel(product) || `Product ${index + 1}`}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {product.totalBags} departed bags from {product.quantity} available
                        </p>
                      </div>
                      <Button
                        aria-label={`Remove ${formatProductLabel(product) || `product ${index + 1}`}`}
                        className="self-start sm:self-auto"
                        disabled={isSubmitting}
                        size="icon"
                        type="button"
                        variant="ghost"
                        onClick={() => removeSelectedProduct(index)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
              {submitStatus === "error" && submitMessage && (
                <p
                  className="text-sm font-medium text-destructive sm:mr-auto"
                >
                  {submitMessage}
                </p>
              )}
              {productLoadError && (
                <p className="text-sm font-medium text-destructive sm:mr-auto">
                  {productLoadError}
                </p>
              )}
              <Button disabled={isSubmitting} type="reset" variant="outline">
                <RotateCcw />
                Reset
              </Button>
              <Button
                disabled={isSubmitting}
                type="submit"
                style={{
                  backgroundColor: isSubmitting ? "#e8e8e8" : "",
                  color: isSubmitting ? "#333" : "",
                }}
              >
                {isSubmitting ? (
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
                    Save departures
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
            <CardTitle className="mt-2">Recent departures</CardTitle>
            <CardDescription>Latest dispatch entries for this register.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 xl:flex-1 xl:overflow-y-auto">
            {visibleRecentDepartures.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                No dispatch entries available yet.
              </div>
            ) : (
              visibleRecentDepartures.map((departure) => (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm" key={departure.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium">{departure.productName || "Dispatch entry"}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{departure.challanNo || departure.id}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[departure.totalBags, "bags"].filter(Boolean).join(" ")} dispatched by {departure.driverName || "-"}
                  </p>
                </div>
              )))}
            {recentDepartures.length > recentDeparturesPageSize ? (
              <div className="flex items-center justify-between gap-2 border-t border-slate-200/80 pt-4">
                <Button
                  className="rounded-xl bg-white"
                  type="button"
                  variant="outline"
                  onClick={() => setRecentDeparturesPage((page) => Math.max(1, page - 1))}
                  disabled={recentDeparturesPage === 1}
                >
                  Prev
                </Button>
                <span className="text-xs text-muted-foreground">
                  {recentDeparturesPage} / {totalRecentDeparturePages}
                </span>
                <Button
                  className="rounded-xl bg-white"
                  type="button"
                  variant="outline"
                  onClick={() => setRecentDeparturesPage((page) => Math.min(totalRecentDeparturePages, page + 1))}
                  disabled={recentDeparturesPage === totalRecentDeparturePages}
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
