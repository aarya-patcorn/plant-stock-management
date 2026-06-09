import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Eye, RotateCcw, Save } from "lucide-react";
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
const materialOptions = ["Cement", "Sand", "Chemical", "Packaging"];
const packagingItemTypeOptions = ["Bag", "Coupon"];
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
] as const;
type PurchaseOtherField = (typeof purchaseOtherFields)[number];

const initialCommonFormData = {
  date: "",
  time: "",
  supplierName: "",
  invoiceNo: "",
  unloadBy: "",
  attachFile: "",
  remarks: "",
};

const initialPurchaseItemData = {
  rawMaterialName: "",
  packagingType: "",
  level2: "",
  level3: "",
  level4: "",
  packagingBag: "",
  packagingBagColor: "",
  coupon: "",
  bucketSize: "",
  colorOfSandEpoxy: "",
  quantityPurchased: "",
  unit: "",
  bagQuantity: "",
};

type PurchaseItemData = typeof initialPurchaseItemData;

type PurchaseItemState = {
  id: string;
  data: PurchaseItemData;
  packagingItemType: string;
  otherSelections: Record<PurchaseOtherField, boolean>;
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

type RawMaterialName = "Cement" | "Sand" | "Chemical" | "Packaging";
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
      "Tile Adhesive": {
        label: "Select Chemical",
        options: ["K50", "K60", "K80", "K90", "KX"],
      },
      "Tile Grout": {
        label: "Select Chemical",
        options: ["Calcium Carbonate", "Yellow Pigment", "Black Pigment", "Red Pigment", "Blue Pigment"],
      },
    },
  },

  Packaging: {
    label: "Packaging Type",
    options: ["FG"],

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
            options: ["20kg", "50kg"],
            children: {
              K50: {
                label: "Packaging Size",
                options: ["20kg", "50kg"],
              },
              K60: {
                label: "Packaging Size",
                options: ["20kg", "50kg"],
              },
              K80: {
                label: "Packaging Size",
                options: ["20kg", "50kg"],
              },
              K90: {
                label: "Packaging Size",
                options: ["20kg", "50kg"],
              },
              "Kamdhenu X": {
                label: "Packaging Size",
                options: ["20kg", "50kg"],
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
            options: ["Pouch 1KG", "Carton"],
          },

          Epoxy: {
            label: "Packaging Material",
            options: [
              "Bucket 1KG",
              "Bucket 5KG",
              "Hardner 112gm",
              "Hardner 385gm",
              "Sticker",
              "Sponge",
              "Coloured Sand",
              "Carton 1x4",
              "Carton 1x8",
            ],
          },

          "Tile Cleaner": {
            label: "Packaging Material",
            options: ["Can", "Sticker", "Seal"],
          },
        },
      },
    },
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

function createPurchaseItemState(): PurchaseItemState {
  return {
    id: crypto.randomUUID(),
    data: { ...initialPurchaseItemData },
    packagingItemType: "",
    otherSelections: { ...initialPurchaseOtherState },
  };
}

function getItemConfig(item: PurchaseItemState) {
  return hasRawMaterialConfig(item.data.rawMaterialName as RawMaterialOption)
    ? rawMaterialConfig[item.data.rawMaterialName as RawMaterialName]
    : undefined;
}

function getLevel2Config(item: PurchaseItemState) {
  const config = getItemConfig(item);
  return config && "children" in config
    ? config.children?.[item.data.packagingType as keyof typeof config.children]
    : undefined;
}

function getCementLevel2Options(item: PurchaseItemState) {
  return item.data.rawMaterialName === "Cement" && item.data.packagingType === "PPC"
    ? ["Silo", "Bag"]
    : item.data.rawMaterialName === "Cement" && item.data.packagingType === "White Cement"
      ? ["Bag"]
      : ["Silo"];
}

function shouldShowPackagingBagField(item: PurchaseItemState) {
  return item.data.rawMaterialName === "Packaging" &&
    item.data.packagingType === "FG" &&
    (item.data.level2 === "Tile Adhesive" || item.data.level2 === "Bondure");
}

function shouldShowPackagingBagColorField(item: PurchaseItemState) {
  return item.data.rawMaterialName === "Packaging" &&
    item.data.packagingType === "FG" &&
    item.data.level2 === "Tile Adhesive";
}

function showPackagingItemTypeField(item: PurchaseItemState) {
  return item.data.rawMaterialName === "Packaging" &&
    item.data.packagingType === "FG" &&
    item.data.level2 === "Tile Adhesive";
}

function getSelectedLevel2Config(item: PurchaseItemState) {
  const level2Config = getLevel2Config(item);
  return level2Config && "children" in level2Config
    ? level2Config.children?.[item.data.level2 as keyof typeof level2Config.children]
    : undefined;
}

function getLevel3Config(item: PurchaseItemState) {
  const selectedLevel2Config = getSelectedLevel2Config(item);
  if (!selectedLevel2Config) {
    return undefined;
  }

  if (shouldShowPackagingBagField(item)) {
    return "children" in selectedLevel2Config
      ? selectedLevel2Config.children?.[item.data.packagingBag as keyof typeof selectedLevel2Config.children]
      : undefined;
  }

  return selectedLevel2Config;
}

function shouldShowEpoxySandColorField(item: PurchaseItemState) {
  return item.data.rawMaterialName === "Packaging" &&
    item.data.packagingType === "FG" &&
    item.data.level2 === "Epoxy" &&
    item.data.level3 === "Coloured Sand";
}

function shouldShowTileCleanerBucketSizeField(item: PurchaseItemState) {
  return item.data.rawMaterialName === "Packaging" &&
    item.data.packagingType === "FG" &&
    item.data.level2 === "Tile Cleaner" &&
    item.data.level3 === "Can";
}

function getPackagingBagOptions(item: PurchaseItemState) {
  return item.data.level2 === "Bondure" ? ["Bondure"] : ["K50", "K60", "K80", "K90", "Kamdhenu X"];
}

function getPackagingBagColorOptions(item: PurchaseItemState) {
  return item.data.packagingBag === "K50" ? ["Grey"] : ["White", "Grey"];
}

function isPpcCementBagFlow(item: PurchaseItemState) {
  return item.data.rawMaterialName === "Cement" &&
    item.data.packagingType === "PPC" &&
    item.data.level2 === "Bag";
}

function shouldShowAutoBagQuantityField(item: PurchaseItemState) {
  return (item.data.rawMaterialName === "Sand" &&
    (item.data.packagingType === "White" || (item.data.packagingType === "Grey" && Boolean(item.data.level2)))) ||
    (item.data.rawMaterialName === "Cement" &&
      (item.data.packagingType === "White Cement" || isPpcCementBagFlow(item)) &&
      item.data.level2 === "Bag");
}

function getAutoBagWeightInKg(item: PurchaseItemState) {
  return item.data.rawMaterialName === "Sand"
    ? item.data.packagingType === "Grey"
      ? 40
      : item.data.packagingType === "White"
        ? 50
        : 0
    : item.data.rawMaterialName === "Cement" &&
      (item.data.packagingType === "White Cement" || isPpcCementBagFlow(item))
      ? 50
      : 0;
}

function isPackagingTileAdhesiveFlow(item: PurchaseItemState) {
  return item.data.rawMaterialName === "Packaging" &&
    item.data.packagingType === "FG" &&
    item.data.level2 === "Tile Adhesive" &&
    Boolean(item.data.packagingBag);
}

function isPackagingFgFlow(item: PurchaseItemState) {
  return item.data.rawMaterialName === "Packaging" &&
    item.data.packagingType === "FG";
}

function getAutoSelectedUnit(item: PurchaseItemState) {
  return shouldShowAutoBagQuantityField(item) || item.data.rawMaterialName === "Cement"
    ? "mt"
    : item.data.rawMaterialName === "Chemical"
      ? "kg"
      : isPackagingTileAdhesiveFlow(item) && item.packagingItemType === "Bag" && (item.data.level3 === "20kg" || item.data.level3 === "50kg")
        ? "bags"
        : isPackagingTileAdhesiveFlow(item) && item.packagingItemType === "Coupon" && (item.data.level3 === "20kg" || item.data.level3 === "50kg")
          ? "pcs"
          : isPackagingFgFlow(item) && item.data.level2 === "Tile Cleaner"
            ? "pcs"
            : isPackagingFgFlow(item) && item.data.level2 === "Bondure"
              ? "bags"
              : isPackagingFgFlow(item) &&
                item.data.level2 === "Epoxy" &&
                item.data.level3 === "Coloured Sand"
                ? "kg"
                : isPackagingFgFlow(item) &&
                  (item.data.level2 === "Tile Grout" || item.data.level2 === "Epoxy")
                  ? "nos"
                  : "";
}

function getUnloadByMode(item: PurchaseItemState | undefined) {
  if (!item) return "input";
  if (item.data.rawMaterialName === "Cement" && item.data.level2 === "Silo") return "cement-silo";
  if (item.data.rawMaterialName === "Cement" && item.data.level2 === "Bag") return "cement-bag";
  if (item.data.rawMaterialName === "Chemical") return "chemical";
  if (item.data.rawMaterialName === "Packaging") return "packaging";
  if (item.data.rawMaterialName === "Sand") return "sand";
  return "input";
}

function getUnloadByOptions(mode: string) {
  switch (mode) {
    case "cement-silo":
      return [
        { value: "Chandrashekhar", label: "Chandrashekhar" },
        { value: "Anand", label: "Anand" },
      ];
    case "cement-bag":
      return [
        { value: "Anand", label: "Sujeet" },
        { value: "Chandrashekhar", label: "Thailesh" },
        { value: "Vasu", label: "Vasu" },
      ];
    case "chemical":
      return [
        { value: "Thailesh", label: "Thalesh" },
        { value: "Sujeet", label: "Sujeet" },
        { value: "Vasu", label: "Vasu" },
      ];
    case "packaging":
      return [
        { value: "Thailesh", label: "Thailesh" },
        { value: "Sujeet", label: "Sujeet" },
        { value: "Vasu", label: "Vasu" },
      ];
    case "sand":
      return [
        { value: "Sujeet", label: "Sujeet" },
        { value: "Thailesh", label: "Thailesh" },
        { value: "Vasu", label: "Vasu" },
      ];
    default:
      return [];
  }
}

export function PurchaseEntryForm() {
  const [commonFormData, setCommonFormData] = useState(initialCommonFormData);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemState[]>([createPurchaseItemState()]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUnloadByOther, setIsUnloadByOther] = useState(false);
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

  useEffect(() => {
    setPurchaseItems((current) => {
      const next = current.map((item) => {
        let updatedItem = item;
        const data = updatedItem.data;
        const autoSelectedUnit = getAutoSelectedUnit(updatedItem);

        if (data.rawMaterialName === "Cement") {
          if (data.packagingType === "OPC" && data.level2 !== "Silo") {
            updatedItem = {
              ...updatedItem,
              data: {
                ...updatedItem.data,
                level2: "Silo",
                level3: "",
                colorOfSandEpoxy: "",
                bucketSize: "",
              },
              otherSelections: {
                ...updatedItem.otherSelections,
                level2: false,
                level3: false,
                colorOfSandEpoxy: false,
                bucketSize: false,
              },
            };
          }

          if (data.packagingType === "White Cement" && data.level2 !== "Bag") {
            updatedItem = {
              ...updatedItem,
              data: {
                ...updatedItem.data,
                level2: "Bag",
                level3: "",
                colorOfSandEpoxy: "",
                bucketSize: "",
              },
              otherSelections: {
                ...updatedItem.otherSelections,
                level2: false,
                level3: false,
                colorOfSandEpoxy: false,
                bucketSize: false,
              },
            };
          }
        }

        if (shouldShowPackagingBagField(updatedItem) && updatedItem.data.level2 === "Bondure") {
          if (updatedItem.data.packagingBag !== "Bondure" || updatedItem.data.level3 !== "40 KG") {
            updatedItem = {
              ...updatedItem,
              data: {
                ...updatedItem.data,
                packagingBag: "Bondure",
                level3: "40 KG",
              },
              otherSelections: {
                ...updatedItem.otherSelections,
                packagingBag: false,
                level3: false,
              },
            };
          }
        }

        if (!shouldShowPackagingBagColorField(updatedItem) && updatedItem.data.level4) {
          updatedItem = {
            ...updatedItem,
            data: {
              ...updatedItem.data,
              level4: "",
            },
          };
        }

        if (!showPackagingItemTypeField(updatedItem)) {
          if (updatedItem.packagingItemType || updatedItem.data.coupon) {
            updatedItem = {
              ...updatedItem,
              packagingItemType: "",
              data: {
                ...updatedItem.data,
                coupon: "",
              },
            };
          }
        } else if (updatedItem.packagingItemType !== "Coupon") {
          if (updatedItem.data.coupon) {
            updatedItem = {
              ...updatedItem,
              data: {
                ...updatedItem.data,
                coupon: "",
              },
            };
          }
        } else {
          const nextCoupon = updatedItem.data.level3 ? `${updatedItem.data.level3} Coupon` : "";
          if (updatedItem.data.coupon !== nextCoupon) {
            updatedItem = {
              ...updatedItem,
              data: {
                ...updatedItem.data,
                coupon: nextCoupon,
              },
            };
          }
        }

        if (updatedItem.data.packagingBag === "K50" && updatedItem.data.packagingBagColor !== "Grey") {
          updatedItem = {
            ...updatedItem,
            data: {
              ...updatedItem.data,
              packagingBagColor: "Grey",
            },
          };
        }

        if (autoSelectedUnit && updatedItem.data.unit !== autoSelectedUnit) {
          updatedItem = {
            ...updatedItem,
            data: {
              ...updatedItem.data,
              unit: autoSelectedUnit,
            },
            otherSelections: {
              ...updatedItem.otherSelections,
              unit: false,
            },
          };
        }

        const autoBagWeightInKg = getAutoBagWeightInKg(updatedItem);
        if (!shouldShowAutoBagQuantityField(updatedItem) || !autoBagWeightInKg) {
          const isAutoBagMaterial =
            updatedItem.data.rawMaterialName === "Sand" ||
            (updatedItem.data.rawMaterialName === "Cement" &&
              (updatedItem.data.packagingType === "White Cement" ||
                (updatedItem.data.packagingType === "PPC" && updatedItem.data.level2 === "Bag")));

          if (isAutoBagMaterial && (updatedItem.data.bagQuantity || updatedItem.data.quantityPurchased || updatedItem.data.unit !== (updatedItem.data.rawMaterialName === "Cement" ? "mt" : ""))) {
            updatedItem = {
              ...updatedItem,
              data: {
                ...updatedItem.data,
                bagQuantity: "",
                quantityPurchased: "",
                unit: updatedItem.data.rawMaterialName === "Cement" ? "mt" : "",
              },
              otherSelections: {
                ...updatedItem.otherSelections,
                unit: false,
              },
            };
          }
        } else if (!updatedItem.data.bagQuantity) {
          if (updatedItem.data.quantityPurchased || updatedItem.data.unit !== "mt") {
            updatedItem = {
              ...updatedItem,
              data: {
                ...updatedItem.data,
                quantityPurchased: "",
                unit: "mt",
              },
              otherSelections: {
                ...updatedItem.otherSelections,
                unit: false,
              },
            };
          }
        } else {
          const totalKilograms = Number(updatedItem.data.bagQuantity) * autoBagWeightInKg;
          const quantityPurchased = formatMetricTonnesFromKilograms(totalKilograms);
          if (updatedItem.data.quantityPurchased !== quantityPurchased || updatedItem.data.unit !== "mt") {
            updatedItem = {
              ...updatedItem,
              data: {
                ...updatedItem.data,
                quantityPurchased,
                unit: "mt",
              },
              otherSelections: {
                ...updatedItem.otherSelections,
                unit: false,
              },
            };
          }
        }

        return updatedItem;
      });

      return JSON.stringify(next) === JSON.stringify(current) ? current : next;
    });
  }, [purchaseItems]);

  const updateCommonField = (name: keyof typeof initialCommonFormData, value: string) => {
    setCommonFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const updateCommonTextField = (name: keyof typeof initialCommonFormData, value: string) => {
    updateCommonField(name, sanitizeTextOnly(value));
  };

  const updatePurchaseItemData = (index: number, field: keyof PurchaseItemData, value: string) => {
    setPurchaseItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
            ...item,
            data: {
              ...item.data,
              [field]: value,
            },
          }
          : item,
      ),
    );
  };

  const updatePurchaseItemTextField = (index: number, field: keyof PurchaseItemData, value: string) => {
    updatePurchaseItemData(index, field, sanitizeTextOnly(value));
  };

  const updatePurchaseItemNumberField = (index: number, field: keyof PurchaseItemData, value: string, options?: { allowDecimal?: boolean }) => {
    updatePurchaseItemData(index, field, sanitizeNumberOnly(value, options));
  };

  const getItemSelectValue = (item: PurchaseItemState, field: PurchaseOtherField, value: string) =>
    item.otherSelections[field] ? OTHER_OPTION : value;

  const handleItemSelectChange = (
    index: number,
    field: PurchaseOtherField,
    value: string,
    fieldsToClear: PurchaseOtherField[] = [],
    extraUpdates: Partial<PurchaseItemData> = {},
  ) => {
    const isOtherSelection = value === OTHER_OPTION;

    setPurchaseItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        const nextOtherSelections = { ...item.otherSelections, [field]: isOtherSelection };
        fieldsToClear.forEach((fieldName) => {
          nextOtherSelections[fieldName] = false;
        });

        const nextData = { ...item.data, ...extraUpdates };
        fieldsToClear.forEach((fieldName) => {
          nextData[fieldName] = "";
        });
        nextData[field] = isOtherSelection ? "" : value;

        return {
          ...item,
          data: nextData,
          otherSelections: nextOtherSelections,
        };
      }),
    );
  };

  const addPurchaseItem = () => {
    setPurchaseItems((current) => [...current, createPurchaseItemState()]);
  };

  const removePurchaseItem = (index: number) => {
    setPurchaseItems((current) => current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index));
  };

  const renderItemOtherInput = (item: PurchaseItemState, index: number, field: PurchaseOtherField, label: string, placeholder: string) =>
    item.otherSelections[field] ? (
      <Field htmlFor={`${field}-other-${item.id}`} label={`${label} (Other)`}>
        <Input
          id={`${field}-other-${item.id}`}
          value={item.data[field]}
          placeholder={placeholder}
          onChange={(e) => updatePurchaseItemTextField(index, field as keyof PurchaseItemData, e.target.value)}
        />
      </Field>
    ) : null;

  const firstPurchaseItem = purchaseItems[0];
  const quantityAllowsDecimal = purchaseItems.some((item) => isMetricTonUnit(item.data.unit));
  const quantityPurchasedValidationMessage = useMemo(() => {
    const invalidItem = purchaseItems.find((item) =>
      item.data.quantityPurchased &&
      !isMetricTonUnit(item.data.unit) &&
      hasDecimalValue(item.data.quantityPurchased),
    );

    return invalidItem ? "Decimal values are allowed only for mt unit." : "";
  }, [purchaseItems]);

  const validateForm = () => {
    if (!commonFormData.date) {
      return "Date is required.";
    }

    if (!commonFormData.time) {
      return "Time is required.";
    }

    for (const [index, item] of purchaseItems.entries()) {
      const config = getItemConfig(item);
      const level2Config = getLevel2Config(item);
      const level3Config = getLevel3Config(item);
      const itemLabel = `Item ${index + 1}`;

      if (!item.data.rawMaterialName) {
        return `${itemLabel}: Raw material name is required.`;
      }

      if (config && !item.data.packagingType) {
        return `${itemLabel}: ${config.label} is required.`;
      }

      if (level2Config && !item.data.level2) {
        return `${itemLabel}: ${level2Config.label} is required.`;
      }

      if (shouldShowPackagingBagField(item) && !item.data.packagingBag) {
        return `${itemLabel}: Packaging bag is required.`;
      }

      if (shouldShowPackagingBagColorField(item) && !item.data.packagingBagColor.trim()) {
        return `${itemLabel}: Packaging bag color is required.`;
      }

      if (showPackagingItemTypeField(item) && !item.packagingItemType) {
        return `${itemLabel}: Packaging item type is required.`;
      }

      if (level3Config && (!shouldShowPackagingBagField(item) || item.data.packagingBag) && (!showPackagingItemTypeField(item) || Boolean(item.packagingItemType)) && !item.data.level3) {
        return `${itemLabel}: ${level3Config.label} is required.`;
      }

      if (shouldShowTileCleanerBucketSizeField(item) && !item.data.bucketSize) {
        return `${itemLabel}: Can size is required.`;
      }

      if (shouldShowEpoxySandColorField(item) && !item.data.colorOfSandEpoxy) {
        return `${itemLabel}: Color of sand (epoxy) is required.`;
      }

      if (shouldShowAutoBagQuantityField(item) && !isPositiveNumber(item.data.bagQuantity)) {
        return `${itemLabel}: Bag quantity must be greater than 0.`;
      }

      if (!isPositiveNumber(item.data.quantityPurchased)) {
        return `${itemLabel}: Quantity purchased must be greater than 0.`;
      }

      if (!item.data.unit) {
        return `${itemLabel}: Unit is required.`;
      }

      if (!isMetricTonUnit(item.data.unit) && hasDecimalValue(item.data.quantityPurchased)) {
        return `${itemLabel}: Decimal values are allowed only for mt unit.`;
      }
    }

    if (!commonFormData.supplierName.trim()) {
      return "Supplier name is required.";
    }

    if (!commonFormData.unloadBy.trim()) {
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
        ...commonFormData,
        purchaseItems: purchaseItems.map((item) => ({
          rawMaterialName: item.data.rawMaterialName,
          packagingType: item.data.packagingType,
          level2: item.data.level2,
          level3: item.data.level3,
          level4: item.data.level4,
          packagingBag: item.data.packagingBag,
          packagingBagColor: item.data.packagingBagColor,
          coupon: item.data.coupon,
          bucketSize: item.data.bucketSize,
          colorOfSandEpoxy: item.data.colorOfSandEpoxy,
          quantityPurchased: item.data.quantityPurchased,
          unit: item.data.unit,
          bagQuantity: item.data.bagQuantity,
        })),
      };

      await submitEntry("purchase", submittedEntry, selectedFile);
      const latestEntries = await fetchPurchaseEntries();
      setRecentPurchases(latestEntries);
      setRecentPurchasesPage(1);
      setCommonFormData(initialCommonFormData);
      setPurchaseItems([createPurchaseItemState()]);
      setIsUnloadByOther(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSelectedFile(null);
      toast.success("Purchase entry saved successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save purchase entry.";
      setSubmitStatus("error");
      setSubmitMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCommonFormData(initialCommonFormData);
    setPurchaseItems([createPurchaseItemState()]);
    setSelectedFile(null);
    setIsUnloadByOther(false);
    setSubmitStatus("idle");
    setSubmitMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const unloadByMode = getUnloadByMode(firstPurchaseItem);
  const unloadByOptions = getUnloadByOptions(unloadByMode);

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
          <form className="grid gap-5" onReset={resetForm} onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field htmlFor="date" label="Date">
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={commonFormData.date}
                  onChange={(e) => updateCommonField("date", e.target.value)}
                />
              </Field>
              <Field htmlFor="time" label="Time">
                <Input
                  id="time"
                  name="time"
                  type="time"
                  value={commonFormData.time}
                  onChange={(e) => updateCommonField("time", e.target.value)}
                />
              </Field>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Purchase Items</h2>
                <Button type="button" onClick={addPurchaseItem} variant="outline">
                  + Add Item
                </Button>
              </div>

              {purchaseItems.map((item, index) => {
                const config = getItemConfig(item);
                const level2Config = getLevel2Config(item);
                const level3Config = getLevel3Config(item);
                const shouldShowAutoBagQty = shouldShowAutoBagQuantityField(item);
                const autoSelectedUnit = getAutoSelectedUnit(item);
                const itemQuantityAllowsDecimal = isMetricTonUnit(item.data.unit);

                return (
                  <div key={item.id} className="space-y-4 rounded-xl border p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold">Item {index + 1}</h3>
                      {purchaseItems.length > 1 ? (
                        <Button type="button" variant="outline" onClick={() => removePurchaseItem(index)}>
                          Remove
                        </Button>
                      ) : null}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <Field htmlFor={`raw-material-name-${item.id}`} label="Raw Material Name">
                        <Select
                          id={`raw-material-name-${item.id}`}
                          name="rawMaterialName"
                          value={getItemSelectValue(item, "rawMaterialName", item.data.rawMaterialName)}
                          onChange={(e) =>
                            handleItemSelectChange(
                              index,
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
                                "unit",
                              ],
                            )
                          }
                        >
                          <option value="" disabled>
                            Select Raw Material
                          </option>

                          {materialOptions.map((option) => (
                            <option key={option} value={option === "Other" ? OTHER_OPTION : option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      {renderItemOtherInput(item, index, "rawMaterialName", "Raw Material Name", "Enter raw material name")}

                      {config ? (
                        <Field htmlFor={`level1-${item.id}`} label={config.label}>
                          <Select
                            id={`level1-${item.id}`}
                            name="packagingType"
                            value={getItemSelectValue(item, "packagingType", item.data.packagingType)}
                            onChange={(e) =>
                              handleItemSelectChange(
                                index,
                                "packagingType",
                                e.target.value,
                                ["level2", "level3", "level4", "packagingBag", "bucketSize", "colorOfSandEpoxy", "unit"],
                              )
                            }
                          >
                            <option value="" disabled>
                              Select {config.label}
                            </option>

                            {config.options.map((option) => (
                              <option key={option} value={option === "Other" ? OTHER_OPTION : option}>
                                {option}
                              </option>
                            ))}
                          </Select>
                        </Field>
                      ) : null}
                      {renderItemOtherInput(item, index, "packagingType", config?.label ?? "Packaging Type", "Enter value")}

                      {level2Config ? (
                        <Field htmlFor={`level2-${item.id}`} label={level2Config.label}>
                          <Select
                            id={`level2-${item.id}`}
                            name="level2"
                            value={getItemSelectValue(item, "level2", item.data.level2)}
                            disabled={
                              item.data.rawMaterialName === "Cement" &&
                              (
                                item.data.packagingType === "OPC" ||
                                item.data.packagingType === "White Cement"
                              )
                            }
                            onChange={(e) =>
                              handleItemSelectChange(
                                index,
                                "level2",
                                e.target.value,
                                ["level3", "level4", "packagingBag", "bucketSize", "colorOfSandEpoxy"],
                              )
                            }
                          >
                            <option value="" disabled>
                              Select {level2Config.label}
                            </option>

                            {(item.data.rawMaterialName === "Cement"
                              ? getCementLevel2Options(item)
                              : level2Config.options).map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </Select>
                        </Field>
                      ) : null}
                      {renderItemOtherInput(item, index, "level2", level2Config?.label ?? "Level 2", "Enter value")}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      {shouldShowAutoBagQty ? (
                        <Field htmlFor={`bag-quantity-${item.id}`} label="Bag Quantity">
                          <Input
                            id={`bag-quantity-${item.id}`}
                            min="0"
                            name="bagQuantity"
                            placeholder="Enter bag quantity"
                            type="number"
                            value={item.data.bagQuantity}
                            onChange={(e) => updatePurchaseItemNumberField(index, "bagQuantity", e.target.value)}
                          />
                        </Field>
                      ) : null}

                      {shouldShowPackagingBagField(item) ? (
                        <Field htmlFor={`packagingBag-${item.id}`} label="Packaging Bag">
                          <Select
                            id={`packagingBag-${item.id}`}
                            name="packagingBag"
                            value={getItemSelectValue(item, "packagingBag", item.data.packagingBag)}
                            disabled={item.data.level2 === "Bondure"}
                            onChange={(e) => handleItemSelectChange(index, "packagingBag", e.target.value, ["level4", "bucketSize", "level3"])}
                          >
                            <option value="" disabled>
                              Select Packaging Bag
                            </option>

                            {getPackagingBagOptions(item).map((option) => (
                              <option key={option} value={option === "Other" ? OTHER_OPTION : option}>
                                {option}
                              </option>
                            ))}
                          </Select>
                        </Field>
                      ) : null}
                      {renderItemOtherInput(item, index, "packagingBag", "Packaging Bag", "Enter packaging bag")}

                      {shouldShowPackagingBagColorField(item) ? (
                        <Field htmlFor={`packagingBagColor-${item.id}`} label="Packaging Bag Color">
                          <Select
                            id={`packagingBagColor-${item.id}`}
                            name="packagingBagColor"
                            value={item.data.packagingBagColor}
                            onChange={(e) => updatePurchaseItemData(index, "packagingBagColor", e.target.value)}
                          >
                            <option value="" disabled>
                              Select packaging bag color
                            </option>
                            {getPackagingBagColorOptions(item).map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </Select>
                        </Field>
                      ) : null}

                      {showPackagingItemTypeField(item) ? (
                        <Field htmlFor={`packagingItemType-${item.id}`} label="Packaging Item Type">
                          <Select
                            id={`packagingItemType-${item.id}`}
                            name="packagingItemType"
                            value={item.packagingItemType}
                            onChange={(e) =>
                              setPurchaseItems((current) =>
                                current.map((currentItem, currentIndex) =>
                                  currentIndex === index
                                    ? { ...currentItem, packagingItemType: e.target.value }
                                    : currentItem,
                                ),
                              )
                            }
                          >
                            <option value="" disabled>
                              Select packaging item type
                            </option>
                            {packagingItemTypeOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </Select>
                        </Field>
                      ) : null}

                      {level3Config && (!shouldShowPackagingBagField(item) || item.data.packagingBag) && (!showPackagingItemTypeField(item) || Boolean(item.packagingItemType)) ? (
                        <Field htmlFor={`level3-${item.id}`} label={level3Config.label}>
                          <Select
                            id={`level3-${item.id}`}
                            name="level3"
                            value={getItemSelectValue(item, "level3", item.data.level3)}
                            disabled={item.data.level2 === "Bondure"}
                            onChange={(e) => handleItemSelectChange(index, "level3", e.target.value, ["bucketSize", "colorOfSandEpoxy"])}
                          >
                            <option value="" disabled>
                              Select {level3Config.label}
                            </option>

                            {level3Config.options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </Select>
                        </Field>
                      ) : null}
                      {renderItemOtherInput(item, index, "level3", level3Config?.label ?? "Level 3", "Enter value")}

                      {showPackagingItemTypeField(item) && item.packagingItemType === "Coupon" ? (
                        <Field htmlFor={`coupon-${item.id}`} label="Coupon">
                          <Input
                            id={`coupon-${item.id}`}
                            name="coupon"
                            value={item.data.coupon}
                            placeholder="Select packaging size to set coupon"
                            readOnly
                          />
                        </Field>
                      ) : null}

                      {shouldShowTileCleanerBucketSizeField(item) ? (
                        <Field htmlFor={`bucketSize-${item.id}`} label="Can Size">
                          <Select
                            id={`bucketSize-${item.id}`}
                            name="bucketSize"
                            value={getItemSelectValue(item, "bucketSize", item.data.bucketSize)}
                            onChange={(e) => handleItemSelectChange(index, "bucketSize", e.target.value)}
                          >
                            <option value="" disabled>
                              Select Can Size
                            </option>
                            {["1L", "5L"].map((option) => (
                              <option key={option} value={option === "Other" ? OTHER_OPTION : option}>
                                {option}
                              </option>
                            ))}
                          </Select>
                        </Field>
                      ) : null}
                      {renderItemOtherInput(item, index, "bucketSize", "Can Size", "Enter can size")}

                      {shouldShowEpoxySandColorField(item) ? (
                        <Field htmlFor={`color-of-sand-epoxy-${item.id}`} label="Color Of Sand (Epoxy)">
                          <Select
                            id={`color-of-sand-epoxy-${item.id}`}
                            name="colorOfSandEpoxy"
                            value={getItemSelectValue(item, "colorOfSandEpoxy", item.data.colorOfSandEpoxy)}
                            onChange={(e) => handleItemSelectChange(index, "colorOfSandEpoxy", e.target.value)}
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
                      ) : null}
                      {renderItemOtherInput(item, index, "colorOfSandEpoxy", "Color Of Sand (Epoxy)", "Enter sand color")}

                      <Field htmlFor={`quantity-purchased-${item.id}`} label="Quantity Purchased">
                        <div className="space-y-2">
                          <Input
                            id={`quantity-purchased-${item.id}`}
                            aria-invalid={Boolean(quantityPurchasedValidationMessage)}
                            inputMode={itemQuantityAllowsDecimal ? "decimal" : "numeric"}
                            name="quantityPurchased"
                            pattern={itemQuantityAllowsDecimal ? "^\\d*(\\.\\d*)?$" : "^\\d*$"}
                            placeholder="Enter quantity"
                            readOnly={shouldShowAutoBagQty}
                            step={itemQuantityAllowsDecimal ? "any" : "1"}
                            type="text"
                            value={item.data.quantityPurchased}
                            onChange={(e) => updatePurchaseItemData(index, "quantityPurchased", sanitizeNumberOnly(e.target.value, { allowDecimal: true }))}
                          />
                        </div>
                      </Field>

                      <Field htmlFor={`unit-${item.id}`} label="Unit">
                        <Select
                          id={`unit-${item.id}`}
                          name="unit"
                          value={getItemSelectValue(item, "unit", item.data.unit)}
                          disabled={Boolean(autoSelectedUnit)}
                          onChange={(e) => handleItemSelectChange(index, "unit", e.target.value)}
                        >
                          <option value="" disabled>
                            Unit
                          </option>
                          {unitOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </Select>
                      </Field>
                      {renderItemOtherInput(item, index, "unit", "Unit", "Enter unit")}
                    </div>
                  </div>
                );
              })}

              {quantityPurchasedValidationMessage ? (
                <p className="text-sm font-medium text-destructive">
                  {quantityPurchasedValidationMessage}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field htmlFor="supplier-name" label="Supplier Name">
                <Input
                  id="supplier-name"
                  name="supplierName"
                  placeholder="Enter supplier name"
                  value={commonFormData.supplierName}
                  onChange={(e) => updateCommonTextField("supplierName", e.target.value)}
                />
              </Field>
              <Field htmlFor="invoice-no" label="Bill / Invoice No. (Optional)">
                <Input
                  id="invoice-no"
                  name="invoiceNo"
                  placeholder="Invoice number"
                  value={commonFormData.invoiceNo}
                  onChange={(e) => updateCommonField("invoiceNo", e.target.value)}
                />
              </Field>
              <Field htmlFor="unload-by" label="Unload By">
                {unloadByMode === "input" ? (
                  <Input
                    id="unload-by"
                    name="unloadBy"
                    placeholder="Person or team name"
                    value={commonFormData.unloadBy}
                    onChange={(e) => {
                      setIsUnloadByOther(false);
                      updateCommonTextField("unloadBy", e.target.value);
                    }}
                  />
                ) : (
                  <div className="space-y-2">
                    <select
                      id="unload-by"
                      name="unloadBy"
                      className="w-full h-10 border rounded-md px-3"
                      value={isUnloadByOther ? OTHER_OPTION : commonFormData.unloadBy}
                      onChange={(e) => {
                        if (e.target.value === OTHER_OPTION) {
                          setIsUnloadByOther(true);
                          updateCommonField("unloadBy", "");
                          return;
                        }

                        setIsUnloadByOther(false);
                        updateCommonField("unloadBy", e.target.value);
                      }}
                    >
                      <option value="">Select Person</option>
                      {unloadByOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                      <option value={OTHER_OPTION}>Other</option>
                    </select>
                    {isUnloadByOther ? (
                      <Input
                        id="unload-by-other"
                        name="unloadByOther"
                        placeholder="Enter person or team name"
                        value={commonFormData.unloadBy}
                        onChange={(e) => updateCommonTextField("unloadBy", e.target.value)}
                      />
                    ) : null}
                  </div>
                )}
              </Field>

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
                value={commonFormData.remarks}
                onChange={(e) => updateCommonField("remarks", e.target.value)}
              />
            </Field>

            <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
              {submitStatus === "error" && submitMessage && (
                <p className="text-sm font-medium text-destructive sm:mr-auto">
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
