import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Eye, ReceiptText, RotateCcw, Save, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fetchPurchaseEntries, submitEntry, type PurchaseEntry } from "@/lib/api";
import { sanitizeNumberOnly, sanitizeTextOnly } from "@/lib/inputValidation";
import SubmitLoader from "../ui/SubmitLoader";

const unitOptions = ["kg", "ltr", "mt", "pcs", "bags", "ml", "nos", "others"];
const materialOptions = ["Cement", "Sand", "Chemical", "Packaging", "Spares", "Other"];
const epoxySandColorOptions = [
  "White",
  "Black",
  "Ivory",
  "Blue",
  "Slate Grey",
  "Light Grey",
  "Dark Grey",
  "Coffee brown",
  "Jaisalmer colour",
  "Sabal",
  "Savetrane",
  "Terracotta",
];
const packagingBagColorOptions = ["White", "Grey"];
const MOBILE_RECENT_PURCHASES_PAGE_SIZE = 3;
const DESKTOP_RECENT_PURCHASES_PAGE_SIZE = 4;
const OTHER_OPTION = "__other__";
const purchaseOtherFields = [
  "rawMaterialName",
  "packagingType",
  "level2",
  "packagingBag",
  "level3",
  "level4",
  "bucketSize",
  "colorOfSandEpoxy",
  "unit",
  "unloadBy",
] as const;
type PurchaseOtherField = (typeof purchaseOtherFields)[number];

const initialFormData = {
  date: "",
  time: "",
  rawMaterialName: "",
  packagingType: "",
  level2: "",
  level3: "",
  level4: "",
  packagingBag: "",
  packagingBagColor: "",
  bucketSize: "",
  colorOfSandEpoxy: "",
  quantityPurchased: "",
  unit: "",
  supplierName: "",
  invoiceNo: "",
  unloadBy: "",
  attachFile: "",
  remarks: "",
};

function formatMetricTonnesFromKilograms(kilograms: number) {
  const metricTonnes = kilograms / 1000;
  return metricTonnes.toFixed(3).replace(/\.?0+$/, "");
}

type MaterialConfig = {
  label: string;
  options: string[];
  children?: Record<string, MaterialConfig>;
};

type RawMaterialName = "Cement" | "Sand" | "Chemical" | "Packaging" | "Spares";
type RawMaterialOption = RawMaterialName | "Other" | "";
const rawMaterialConfig: Record<RawMaterialName, MaterialConfig> = {
  Cement: {
    label: "Cement Type",
    options: ["PPC", "OPC", "White Cement"],
    children: {
      PPC: {
        label: "Packaging Type",
        options: ["Silo"],
      },
      OPC: {
        label: "Packaging Type",
        options: ["Silo"],
      },
      "White Cement": {
        label: "Packaging Type",
        options: ["Bag"],
      },
    },
  },

  Sand: {
    label: "Sand Type",
    options: ["Grey", "White"],
    children: {
      Grey: {
        label: "Sand Size",
        options: ["Small (600 micron)", "Big (1200 micron)"],
      },
    },
  },

  Chemical: {
    label: "Select Chemical Type",
    options: [
      "Tile Adhesive",
      "Tile Grout",
      "Epoxy",
      "Tile Cleaner",
    ],
    children: {
      Epoxy: {
        label: "Select Chemical",
        options: [
          "Resin",
          "Hardner",
          "Pigments",
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
          "Alcohol Ethoxylate"
        ],
      },
      "Tile Adhesive": {
        label: "Select Chemical",
        options: ["K50", "K60", "K80", "K90", "KX"],
      },
      "Tile Grout": {
        label: "Select Chemical",
        options: ["Calcium Carbonate", "Yellow Pigment", "Black Pigment", "Red Pigment", "Blue Pigment",],
      },
    },
  },

  Packaging: {
    label: "Packaging Type",
    options: ["Bulk", "FG"],

    children: {
      FG: {
        label: "FG Product",
        options: [
          "Tile Adhesive",
          "Tile Grout",
          "Epoxy",
          "Tile Cleaner",
          "Bondure",
        ],

        children: {
          "Tile Adhesive": {
            label: "Packaging Size",
            options: ["20kg", "50kg", "Coupon"],
            children: {
              K50: {
                label: "Packaging Size",
                options: ["20kg", "50kg", "Coupon"],
              },
              K60: {
                label: "Packaging Size",
                options: ["20kg", "50kg", "Coupon"],
              },
              K70: {
                label: "Packaging Size",
                options: ["20kg", "50kg", "Coupon"],
              },
              K80: {
                label: "Packaging Size",
                options: ["20kg", "50kg", "Coupon"],
              },
              K90: {
                label: "Packaging Size",
                options: ["20kg", "50kg", "Coupon"],
              },
              "Kamdhenu X": {
                label: "Packaging Size",
                options: ["20kg", "50kg", "Coupon"],
              },
            },
          },
          Bondure: {
            label: "Packaging Size",
            options: ["40 KG"],
            children: {
              Bondure: {
                label: "Packaging Size",
                options: ["40 KG"],
              },
            },
          },

          "Tile Grout": {
            label: "Packaging",
            options: ["Pouch 1KG"],
          },

          Epoxy: {
            label: "Packaging Material",
            options: [
              "Bucket 1KG",
              "Bucket 5KG",
              "Sticker",
              "Sponge",
              "Coloured Sand",
              "Carton 1x4",
              "Carton 1x8",
            ],
          },

          "Tile Cleaner": {
            label: "Packaging Material",
            options: ["Bucket", "Sticker", "Seal"],
          },
        },
      },
    },
  },

  Spares: {
    label: "Machine Type",
    options: ["Printing", "Sealing", "Stretching"],
  },
};

const hasRawMaterialConfig = (value: RawMaterialOption): value is RawMaterialName =>
  value !== "" && value !== "Other" && value in rawMaterialConfig;

const initialPurchaseOtherState = Object.fromEntries(
  purchaseOtherFields.map((field) => [field, false]),
) as Record<PurchaseOtherField, boolean>;

function getOptionsWithOther(options: string[]) {
  const normalizedOptions = options.filter((option) => option.toLowerCase() !== "other" && option.toLowerCase() !== "others");
  return [...normalizedOptions, "Other"];
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

function isPositiveNumber(value: string) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0;
}

function isMetricTonUnit(unit: string) {
  return unit.trim().toLowerCase() === "mt";
}

function hasDecimalValue(value: string) {
  return value.includes(".");
}

export function PurchaseEntryForm() {

  const [formData, setFormData] = useState(initialFormData)
  const [otherSelections, setOtherSelections] = useState(initialPurchaseOtherState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sandBagQuantity, setSandBagQuantity] = useState("");
  const [recentPurchases, setRecentPurchases] = useState<PurchaseEntry[]>([]);
  const [recentPurchasesPage, setRecentPurchasesPage] = useState(1);
  const [recentPurchasesPageSize, setRecentPurchasesPageSize] = useState(() =>
    typeof window !== "undefined" && window.innerWidth >= 1024
      ? DESKTOP_RECENT_PURCHASES_PAGE_SIZE
      : MOBILE_RECENT_PURCHASES_PAGE_SIZE,
  );
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const quantityAllowsDecimal = isMetricTonUnit(formData.unit);
  const quantityPurchasedValidationMessage = useMemo(() => {
    if (!formData.quantityPurchased || quantityAllowsDecimal || !hasDecimalValue(formData.quantityPurchased)) {
      return "";
    }

    return "Decimal values are allowed only for mt unit.";
  }, [formData.quantityPurchased, quantityAllowsDecimal]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updatePageSize = () =>
      setRecentPurchasesPageSize(
        mediaQuery.matches ? DESKTOP_RECENT_PURCHASES_PAGE_SIZE : MOBILE_RECENT_PURCHASES_PAGE_SIZE,
      );

    updatePageSize();
    mediaQuery.addEventListener("change", updatePageSize);

    return () => mediaQuery.removeEventListener("change", updatePageSize);
  }, []);

  useEffect(() => {
    let isMounted = true;

    void fetchPurchaseEntries()
      .then((entries) => {
        if (isMounted) {
          setRecentPurchases(entries.slice(0, 5));
        }
      })
      .catch(() => {
        if (isMounted) {
          setRecentPurchases([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const totalRecentPurchasePages = Math.max(1, Math.ceil(recentPurchases.length / recentPurchasesPageSize));
  const visibleRecentPurchases = recentPurchases.slice(
    (recentPurchasesPage - 1) * recentPurchasesPageSize,
    recentPurchasesPage * recentPurchasesPageSize,
  );

  useEffect(() => {
    if (recentPurchasesPage > totalRecentPurchasePages) {
      setRecentPurchasesPage(totalRecentPurchasePages);
    }
  }, [recentPurchasesPage, totalRecentPurchasePages]);

  const config = useMemo(() => {
    return hasRawMaterialConfig(formData.rawMaterialName as RawMaterialOption)
      ? rawMaterialConfig[formData.rawMaterialName as RawMaterialName]
      : undefined;
  }, [formData.rawMaterialName])

  const level2Config = useMemo(() => {
    return config && "children" in config
      ? config.children?.[formData.packagingType as keyof typeof config.children]
      : undefined;
  }, [config, formData.packagingType])

  const shouldShowPackagingBagField =
    formData.rawMaterialName === "Packaging" &&
    formData.packagingType === "FG" &&
    (formData.level2 === "Tile Adhesive" || formData.level2 === "Bondure");
  const shouldShowPackagingBagColorField =
    formData.rawMaterialName === "Packaging" &&
    formData.packagingType === "FG" &&
    formData.level2 === "Tile Adhesive";

  const selectedLevel2Config = useMemo(() => {
    return level2Config && "children" in level2Config
      ? level2Config.children?.[formData.level2 as keyof typeof level2Config.children]
      : undefined;
  }, [level2Config, formData.level2]);

  const level3Config = useMemo(() => {
    if (!selectedLevel2Config) {
      return undefined;
    }

    if (shouldShowPackagingBagField) {
      return "children" in selectedLevel2Config
        ? selectedLevel2Config.children?.[formData.packagingBag as keyof typeof selectedLevel2Config.children]
        : undefined;
    }

    return selectedLevel2Config;
  }, [formData.packagingBag, selectedLevel2Config, shouldShowPackagingBagField]);

  const shouldShowEpoxySandColorField =
    formData.rawMaterialName === "Packaging" &&
    formData.packagingType === "FG" &&
    formData.level2 === "Epoxy" &&
    formData.level3 === "Coloured Sand";
  const shouldShowTileCleanerBucketSizeField =
    formData.rawMaterialName === "Packaging" &&
    formData.packagingType === "FG" &&
    formData.level2 === "Tile Cleaner" &&
    formData.level3 === "Bucket";
  const packagingBagOptions =
    formData.level2 === "Bondure" ? ["Bondure"] : ["K50", "K60", "K70", "K80", "K90", "Kamdhenu X"];
  const bucketSizeOptions = ["1L", "5L"];
  const shouldShowAutoBagQuantityField =
    (formData.rawMaterialName === "Sand" &&
      (formData.packagingType === "White" || (formData.packagingType === "Grey" && Boolean(formData.level2)))) ||
    (formData.rawMaterialName === "Cement" &&
      formData.packagingType === "White Cement" &&
      formData.level2 === "Bag");
  const autoBagWeightInKg =
    formData.rawMaterialName === "Sand"
      ? formData.packagingType === "Grey"
        ? 40
        : formData.packagingType === "White"
          ? 50
          : 0
      : formData.rawMaterialName === "Cement" && formData.packagingType === "White Cement"
        ? 40
        : 0;
  const isPackagingTileAdhesiveFlow =
    formData.rawMaterialName === "Packaging" &&
    formData.packagingType === "FG" &&
    formData.level2 === "Tile Adhesive" &&
    Boolean(formData.packagingBag);
  const isPackagingFgFlow =
    formData.rawMaterialName === "Packaging" &&
    formData.packagingType === "FG";
  const autoSelectedUnit =
    shouldShowAutoBagQuantityField || formData.rawMaterialName === "Cement"
      ? "mt"
      : formData.rawMaterialName === "Chemical"
        ? "kg"
        : isPackagingTileAdhesiveFlow && (formData.level3 === "20kg" || formData.level3 === "50kg")
          ? "bags"
          : isPackagingTileAdhesiveFlow && formData.level3 === "Coupon"
            ? "pcs"
            : isPackagingFgFlow && formData.level2 === "Tile Cleaner"
              ? "pcs"
              : isPackagingFgFlow && formData.level2 === "Bondure"
                ? "bags"
                : isPackagingFgFlow &&
                  formData.level2 === "Epoxy" &&
                  formData.level3 === "Coloured Sand"
                  ? "kg"
                  : isPackagingFgFlow &&
                    (formData.level2 === "Tile Grout" || formData.level2 === "Epoxy")
                    ? "nos"
                    : "";
                    
  useEffect(() => {
    if (formData.rawMaterialName !== "Cement") {
      return;
    }

    if (
      (formData.packagingType === "PPC" || formData.packagingType === "OPC") &&
      formData.level2 !== "Silo"
    ) {
      setFormData((current) => ({
        ...current,
        level2: "Silo",
        level3: "",
        colorOfSandEpoxy: "",
        bucketSize: "",
        unloadBy: "",
      }));
      setOtherSelections((current) => ({
        ...current,
        level2: false,
        level3: false,
        colorOfSandEpoxy: false,
        bucketSize: false,
        unloadBy: false,
      }));
    }

    if (formData.packagingType === "White Cement" && formData.level2 !== "Bag") {
      setFormData((current) => ({
        ...current,
        level2: "Bag",
        level3: "",
        colorOfSandEpoxy: "",
        bucketSize: "",
        unloadBy: "",
      }));
      setOtherSelections((current) => ({
        ...current,
        level2: false,
        level3: false,
        colorOfSandEpoxy: false,
        bucketSize: false,
        unloadBy: false,
      }));
    }
  }, [formData.level2, formData.packagingType, formData.rawMaterialName]);

  useEffect(() => {
    if (!shouldShowPackagingBagField) {
      return;
    }

    if (formData.level2 === "Bondure") {
      setFormData((current) => {
        if (current.packagingBag === "Bondure" && current.level3 === "40 KG") {
          return current;
        }

        return {
          ...current,
          packagingBag: "Bondure",
          level3: "40 KG",
        };
      });
      setOtherSelections((current) => ({
        ...current,
        packagingBag: false,
        level3: false,
      }));
    }
  }, [formData.level2, shouldShowPackagingBagField, formData.packagingBag, formData.level3]);

  useEffect(() => {
    if (shouldShowPackagingBagColorField || !formData.level4) {
      return;
    }

    setFormData((current) => ({
      ...current,
      level4: "",
    }));
  }, [formData.level4, shouldShowPackagingBagColorField]);

  useEffect(() => {
    if (!autoSelectedUnit) {
      return;
    }

    setFormData((current) =>
      current.unit === autoSelectedUnit
        ? current
        : {
          ...current,
          unit: autoSelectedUnit,
        },
    );
    setOtherSelections((current) => ({
      ...current,
      unit: false,
    }));
  }, [autoSelectedUnit]);

  useEffect(() => {
    if (!shouldShowAutoBagQuantityField || !autoBagWeightInKg) {
      setSandBagQuantity((current) => (current ? "" : current));
      setFormData((current) => {
        const isAutoBagMaterial =
          current.rawMaterialName === "Sand" ||
          (current.rawMaterialName === "Cement" && current.packagingType === "White Cement");

        if (!isAutoBagMaterial) {
          return current;
        }

        const nextUnit = current.rawMaterialName === "Cement" ? "mt" : "";

        if (!current.quantityPurchased && current.unit === nextUnit) {
          return current;
        }

        return {
          ...current,
          quantityPurchased: "",
          unit: nextUnit,
        };
      });
      setOtherSelections((current) => ({
        ...current,
        unit: false,
      }));
      return;
    }

    if (!sandBagQuantity) {
      setFormData((current) => {
        if (!current.quantityPurchased && current.unit === "mt") {
          return current;
        }

        return {
          ...current,
          quantityPurchased: "",
          unit: "mt",
        };
      });
      setOtherSelections((current) => ({
        ...current,
        unit: false,
      }));
      return;
    }

    const totalKilograms = Number(sandBagQuantity) * autoBagWeightInKg;
    const quantityPurchased = formatMetricTonnesFromKilograms(totalKilograms);

    setFormData((current) => {
      if (current.quantityPurchased === quantityPurchased && current.unit === "mt") {
        return current;
      }

      return {
        ...current,
        quantityPurchased,
        unit: "mt",
      };
    });
    setOtherSelections((current) => ({
      ...current,
      unit: false,
    }));
  }, [autoBagWeightInKg, sandBagQuantity, shouldShowAutoBagQuantityField]);

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

  const handleQuantityPurchasedChange = (value: string) => {
    updateField("quantityPurchased", sanitizeNumberOnly(value, { allowDecimal: true }));
  };

  const getSelectValue = (field: PurchaseOtherField, value: string) =>
    otherSelections[field] ? OTHER_OPTION : value;

  const handleSelectChange = (
    field: PurchaseOtherField,
    value: string,
    fieldsToClear: PurchaseOtherField[] = [],
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

  const renderOtherInput = (field: PurchaseOtherField, label: string, placeholder: string) =>
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

  const validateForm = () => {
    if (!formData.date) {
      return "Date is required.";
    }

    if (!formData.time) {
      return "Time is required.";
    }

    if (!formData.rawMaterialName) {
      return "Raw material name is required.";
    }

    if (config && !formData.packagingType) {
      return `${config.label} is required.`;
    }

    if (level2Config && !formData.level2) {
      return `${level2Config.label} is required.`;
    }

    if (shouldShowPackagingBagField && !formData.packagingBag) {
      return "Packaging bag is required.";
    }

    if (shouldShowPackagingBagColorField && !formData.packagingBagColor.trim()) {
      return "Packaging bag color is required.";
    }

    if (level3Config && (!shouldShowPackagingBagField || formData.packagingBag) && !formData.level3) {
      return `${level3Config.label} is required.`;
    }

    if (shouldShowTileCleanerBucketSizeField && !formData.bucketSize) {
      return "Bucket size is required.";
    }

    if (shouldShowEpoxySandColorField && !formData.colorOfSandEpoxy) {
      return "Color of sand (epoxy) is required.";
    }

    if (shouldShowAutoBagQuantityField && !isPositiveNumber(sandBagQuantity)) {
      return "Bag quantity must be greater than 0.";
    }

    if (!isPositiveNumber(formData.quantityPurchased)) {
      return "Quantity purchased must be greater than 0.";
    }

    if (!formData.unit) {
      return "Unit is required.";
    }

    if (!quantityAllowsDecimal && hasDecimalValue(formData.quantityPurchased)) {
      return "Decimal values are allowed only for mt unit.";
    }

    if (!formData.supplierName.trim()) {
      return "Supplier name is required.";
    }

    if (!formData.unloadBy.trim()) {
      return "Unload By is required.";
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

    setIsSubmitting(true);

    try {
      const submittedEntry = {
        id: crypto.randomUUID(),
        serialNo: "",
        ...formData,
        purchaseStock: formData.quantityPurchased,
        currentStock: "",
        usedInProduction: "",
      };

      await submitEntry("purchase", submittedEntry, selectedFile);
      const latestEntries = await fetchPurchaseEntries();
      setRecentPurchases(latestEntries);
      setRecentPurchasesPage(1);
      setFormData(initialFormData);
      setSandBagQuantity("");
      setOtherSelections(initialPurchaseOtherState);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSelectedFile(null);
      toast.success("Purchase entry saved successfully.");
    } catch (error) {
      setSubmitStatus("error");
      setSubmitMessage(error instanceof Error ? error.message : "Unable to save purchase entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="min-w-0">
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>Purchase entry form</CardTitle>
            <CardDescription>Capture each purchase using the same columns as your Google Sheet.</CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link to="/purchase-entries">
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
              setSandBagQuantity("");
              setOtherSelections(initialPurchaseOtherState);
              setSelectedFile(null);
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

            <div className="grid gap-4 md:grid-cols-3">
              <Field htmlFor="raw-material-name" label="Raw Material Name">
                <Select
                  id="raw-material-name"
                  name="rawMaterialName"
                  value={getSelectValue("rawMaterialName", formData.rawMaterialName)}
                  onChange={(e) =>
                    handleSelectChange(
                      "rawMaterialName",
                      e.target.value,
                      [
                        "packagingType",
                        "level2",
                        "level3",
                        "level4",
                        "packagingBag",
                        "bucketSize",
                        "colorOfSandEpoxy",
                        "unloadBy",
                      ],
                    )
                  }
                >
                  <option value="" disabled>
                    Select Raw Material
                  </option>

                  {getOptionsWithOther(materialOptions).map((option) => (
                    <option key={option} value={option === "Other" ? OTHER_OPTION : option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>
              {renderOtherInput("rawMaterialName", "Raw Material Name", "Enter raw material name")}

              {/* LEVEL 1 */}
              {config && (
                <Field htmlFor="level1" label={config.label}>
                  <Select
                    id="level1"
                    name="packagingType"
                    value={getSelectValue("packagingType", formData.packagingType)}
                    onChange={(e) =>
                      handleSelectChange(
                        "packagingType",
                        e.target.value,
                        ["level2", "level3", "level4", "packagingBag", "bucketSize", "colorOfSandEpoxy", "unloadBy"],
                      )
                    }
                  >
                    <option value="" disabled>
                      Select {config.label}
                    </option>

                    {getOptionsWithOther(config.options).map((option) => (
                      <option key={option} value={option === "Other" ? OTHER_OPTION : option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              {renderOtherInput("packagingType", config?.label ?? "Packaging Type", "Enter value")}

              {/* LEVEL 2 */}
              {level2Config && (
                <Field htmlFor="level2" label={level2Config.label}>
                  <Select
                    id="level2"
                    name="level2"
                    value={getSelectValue("level2", formData.level2)}
                    disabled={
                      formData.rawMaterialName === "Cement" &&
                      (
                        formData.packagingType === "PPC" ||
                        formData.packagingType === "OPC" ||
                        formData.packagingType === "White Cement"
                      )
                    }
                    onChange={(e) =>
                      handleSelectChange(
                        "level2",
                        e.target.value,
                        ["level3", "level4", "packagingBag", "bucketSize", "colorOfSandEpoxy"],
                      )
                    }
                  >
                    <option value="" disabled>
                      Select {level2Config.label}
                    </option>

                    {getOptionsWithOther(level2Config.options).map((option) => (
                      <option key={option} value={option === "Other" ? OTHER_OPTION : option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              {renderOtherInput("level2", level2Config?.label ?? "Level 2", "Enter value")}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {shouldShowAutoBagQuantityField && (
                <Field htmlFor="sand-bag-quantity" label="Bag Quantity">
                  <Input
                    id="sand-bag-quantity"
                    min="0"
                    name="sandBagQuantity"
                    placeholder="Enter bag quantity"
                    type="number"
                    value={sandBagQuantity}
                    onChange={(e) => setSandBagQuantity(sanitizeNumberOnly(e.target.value))}
                  />
                </Field>
              )}

              {/* LEVEL 3 */}
              {shouldShowPackagingBagField && (
                <Field htmlFor="packagingBag" label="Packaging Bag">
                  <Select
                    id="packagingBag"
                    name="packagingBag"
                    value={getSelectValue("packagingBag", formData.packagingBag)}
                    disabled={formData.level2 === "Bondure"}
                    onChange={(e) => handleSelectChange("packagingBag", e.target.value, ["level4", "bucketSize", "level3"])}
                  >
                    <option value="" disabled>
                      Select Packaging Bag
                    </option>

                    {getOptionsWithOther(packagingBagOptions).map((option) => (
                      <option key={option} value={option === "Other" ? OTHER_OPTION : option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              {renderOtherInput("packagingBag", "Packaging Bag", "Enter packaging bag")}

              {shouldShowPackagingBagColorField && (
                <Field htmlFor="packagingBagColor" label="Packaging Bag Color">
                  <Select
                    id="packagingBagColor"
                    name="packagingBagColor"
                    value={formData.packagingBagColor}
                    onChange={(e) => updateField("packagingBagColor", e.target.value)}
                  >
                    <option value="" disabled>
                      Select packaging bag color
                    </option>
                    {packagingBagColorOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}

              {level3Config && (!shouldShowPackagingBagField || formData.packagingBag) && (
                <Field htmlFor="level3" label={level3Config.label}>
                  <Select
                    id="level3"
                    name="level3"
                    value={getSelectValue("level3", formData.level3)}
                    disabled={formData.level2 === "Bondure"}
                    onChange={(e) => handleSelectChange("level3", e.target.value, ["bucketSize", "colorOfSandEpoxy"])}
                  >
                    <option value="" disabled>
                      Select {level3Config.label}
                    </option>

                    {getOptionsWithOther(level3Config.options).map((option) => (
                      <option key={option} value={option === "Other" ? OTHER_OPTION : option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              {renderOtherInput("level3", level3Config?.label ?? "Level 3", "Enter value")}

              {shouldShowTileCleanerBucketSizeField && (
                <Field htmlFor="bucketSize" label="Bucket Size">
                  <Select
                    id="bucketSize"
                    name="bucketSize"
                    value={getSelectValue("bucketSize", formData.bucketSize)}
                    onChange={(e) => handleSelectChange("bucketSize", e.target.value)}
                  >
                    <option value="" disabled>
                      Select Bucket Size
                    </option>
                    {getOptionsWithOther(bucketSizeOptions).map((option) => (
                      <option key={option} value={option === "Other" ? OTHER_OPTION : option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              {renderOtherInput("bucketSize", "Bucket Size", "Enter bucket size")}

              {shouldShowEpoxySandColorField && (
                <Field htmlFor="color-of-sand-epoxy" label="Color Of Sand (Epoxy)">
                  <Select
                    id="color-of-sand-epoxy"
                    name="colorOfSandEpoxy"
                    value={getSelectValue("colorOfSandEpoxy", formData.colorOfSandEpoxy)}
                    onChange={(e) => handleSelectChange("colorOfSandEpoxy", e.target.value)}
                  >
                    <option value="" disabled>
                      Select sand color
                    </option>
                    {getOptionsWithOther(epoxySandColorOptions).map((option) => (
                      <option key={option} value={option === "Other" ? OTHER_OPTION : option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              {renderOtherInput("colorOfSandEpoxy", "Color Of Sand (Epoxy)", "Enter sand color")}

              <Field htmlFor="quantity-purchased" label="Quantity Purchased">
                <div className="space-y-2">
                  <Input
                    id="quantity-purchased"
                    aria-invalid={Boolean(quantityPurchasedValidationMessage)}
                    inputMode={quantityAllowsDecimal ? "decimal" : "numeric"}
                    name="quantityPurchased"
                    pattern={quantityAllowsDecimal ? "^\\d*(\\.\\d*)?$" : "^\\d*$"}
                    placeholder="Enter quantity"
                    readOnly={shouldShowAutoBagQuantityField}
                    step={quantityAllowsDecimal ? "any" : "1"}
                    type="text"
                    value={formData.quantityPurchased}
                    onChange={(e) => handleQuantityPurchasedChange(e.target.value)}
                  />
                  {quantityPurchasedValidationMessage ? (
                    <p className="text-sm font-medium text-destructive">
                      {quantityPurchasedValidationMessage}
                    </p>
                  ) : null}
                </div>
              </Field>

              <Field htmlFor="unit" label="Unit">
                <Select
                  id="unit"
                  name="unit"
                  value={getSelectValue("unit", formData.unit)}
                  disabled={Boolean(autoSelectedUnit)}
                  onChange={(e) => handleSelectChange("unit", e.target.value)}
                >
                  <option value="" disabled>
                    Unit
                  </option>
                  {getOptionsWithOther(unitOptions).map((option) => (
                    <option key={option} value={option === "Other" ? OTHER_OPTION : option}>{option}</option>
                  ))}
                </Select>
              </Field>
              {renderOtherInput("unit", "Unit", "Enter unit")}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field htmlFor="supplier-name" label="Supplier Name">
                <Input
                  id="supplier-name"
                  name="supplierName"
                  placeholder="Enter supplier name"
                  value={formData.supplierName}
                  onChange={(e) => updateTextField("supplierName", e.target.value)}
                />
              </Field>
              <Field htmlFor="invoice-no" label="Bill / Invoice No. (Optional)">
                <Input
                  id="invoice-no"
                  name="invoiceNo"
                  placeholder="Invoice number"
                  value={formData.invoiceNo}
                  onChange={(e) => updateField("invoiceNo", e.target.value)}
                />
              </Field>
              <Field htmlFor="unload-by" label="Unload By">

                {/* Cement + Silo */}
                {formData.rawMaterialName === "Cement" &&
                  formData.level2 === "Silo" ? (

                  <select
                    id="unload-by"
                    name="unloadBy"
                    className="w-full h-10 border rounded-md px-3"
                    value={getSelectValue("unloadBy", formData.unloadBy)}
                    onChange={(e) => handleSelectChange("unloadBy", e.target.value)}
                  >
                    <option value="">Select Person</option>
                    <option value="Vasu">Chandrashekhar</option>
                    <option value="Sujit">Anand</option>
                    <option value="Thalesh">Sushil</option>
                    <option value={OTHER_OPTION}>Other</option>
                  </select>

                ) : formData.rawMaterialName === "Cement" &&
                  formData.level2 === "Bag" ? (

                  /* Cement + Bag */

                  <select
                    id="unload-by"
                    name="unloadBy"
                    className="w-full h-10 border rounded-md px-3"
                    value={getSelectValue("unloadBy", formData.unloadBy)}
                    onChange={(e) => handleSelectChange("unloadBy", e.target.value)}
                  >
                    <option value="">Select Person</option>
                    <option value="Anand">Sujeet</option>
                    <option value="Chandrashekhar">Thailesh</option>
                    <option value="Sushil">Vashu</option>
                    <option value={OTHER_OPTION}>Other</option>
                  </select>

                ) : formData.rawMaterialName === "Sand" ? (

                  /* Sand */

                  <select
                    id="unload-by"
                    name="unloadBy"
                    className="w-full h-10 border rounded-md px-3"
                    value={getSelectValue("unloadBy", formData.unloadBy)}
                    onChange={(e) => handleSelectChange("unloadBy", e.target.value)}
                  >
                    <option value="">Select Person</option>
                    <option value="Anand">Sujeet</option>
                    <option value="Chandrashekhar">Thailesh</option>
                    <option value="Sushil">Vashu</option>
                    <option value={OTHER_OPTION}>Other</option>
                  </select>

                ) : (

                  /* Default Input */

                  <Input
                    id="unload-by"
                    name="unloadBy"
                    placeholder="Person or team name"
                    value={formData.unloadBy}
                    onChange={(e) => updateTextField("unloadBy", e.target.value)}
                  />
                )}
              </Field>
              {renderOtherInput("unloadBy", "Unload By", "Enter person or team name")}

              <Field htmlFor="attach-file" label="Attach File (Optional)">
                <Input
                  ref={fileInputRef}
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  name="attachFile"
                  type="file"
                  onChange={(e) => {
                    setSelectedFile(e.target.files?.[0] ?? null);
                  }}
                />
              </Field>
            </div>

            <Field htmlFor="remarks" label="Remarks">
              <Textarea
                id="remarks"
                name="remarks"
                placeholder="Add notes about quality, shortage, damage, or payment status"
                value={formData.remarks}
                onChange={(e) => updateTextField("remarks", e.target.value)}
              />
            </Field>

            <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
              {submitStatus === "error" && submitMessage && (
                <p
                  className="text-sm font-medium text-destructive sm:mr-auto"
                >
                  {submitMessage}
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
                    Save purchase
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
            <CardTitle className="mt-2">Recent purchases</CardTitle>
            <CardDescription>Latest saved purchase entries.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 xl:flex-1 xl:overflow-y-auto">
            {recentPurchases.length === 0 ? (
              <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                Saved purchase entries will appear here.
              </div>
            ) : (
              visibleRecentPurchases.map((purchase) => {
                const materialPath = [
                  purchase.rawMaterialName,
                  purchase.packagingType,
                  purchase.level2,
                  purchase.packagingBag,
                  purchase.level3,
                ].filter(Boolean).join(" / ");
                const quantity = [purchase.quantityPurchased, purchase.unit].filter(Boolean).join(" ");

                return (
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm" key={purchase.id}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium">{materialPath || "Purchase entry"}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {purchase.invoiceNo || purchase.id}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p>{quantity || "Quantity not provided"}</p>
                      <p>{purchase.supplierName || "Supplier not provided"}</p>
                      <p>
                        {[purchase.date, purchase.time].filter(Boolean).join(" at ") || "Date not provided"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            {recentPurchases.length > recentPurchasesPageSize ? (
              <div className="flex items-center justify-between gap-2 border-t border-slate-200/80 pt-4">
                <Button
                  className="rounded-xl bg-white"
                  type="button"
                  variant="outline"
                  onClick={() => setRecentPurchasesPage((page) => Math.max(1, page - 1))}
                  disabled={recentPurchasesPage === 1}
                >
                  Prev
                </Button>
                <span className="text-xs text-muted-foreground">
                  {recentPurchasesPage} / {totalRecentPurchasePages}
                </span>
                <Button
                  className="rounded-xl bg-white"
                  type="button"
                  variant="outline"
                  onClick={() => setRecentPurchasesPage((page) => Math.min(totalRecentPurchasePages, page + 1))}
                  disabled={recentPurchasesPage === totalRecentPurchasePages}
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
