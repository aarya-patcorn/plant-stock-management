import type { BatchDefaults, ManufacturingProductItem } from "./types";

export const getTotalBagsProduced = (tphBatch: string, bagSize: string) => {
  if (tphBatch === "2TPH" && bagSize === "20kg") return "50";
  if (tphBatch === "2TPH" && bagSize === "50kg") return "20";

  if (tphBatch === "1TPH" && bagSize === "20kg") return "25";
  if (tphBatch === "1TPH" && bagSize === "50kg") return "10";

  return "";
};

export const getFinalTotalBagsProduced = (
  tphBatch: string,
  bagSize: string,
  wastageTotalBags: string,
) => {
  if (!String(tphBatch || "").trim() || !String(bagSize || "").trim()) {
    return "";
  }

  const calculatedTotalBagsProduced = Number(getTotalBagsProduced(tphBatch, bagSize) || 0);
  const wastageBags = Number(wastageTotalBags || 0);

  return String(calculatedTotalBagsProduced + wastageBags);
};

export const getAutoProducedQuantity = (
  productCategory: string,
  totalProducedKg: number,
  bagSize: string,
) => {
  if (!["Epoxy", "Grout"].includes(productCategory)) {
    return "";
  }

  const match = String(bagSize || "").match(/(\d+(?:\.\d+)?)/i);
  const unitKg = match ? Number(match[1]) : 0;

  if (!unitKg || totalProducedKg <= 0) {
    return "";
  }

  return String(Math.floor(totalProducedKg / unitKg));
};

export const getBondureTotalBagsProduced = (bagSize: string) => {
  const match = String(bagSize || "").match(/(\d+(?:\.\d+)?)/i);
  const bagSizeNumber = match ? Number(match[1]) : 0;

  if (!bagSizeNumber) {
    return "";
  }

  return String(1000 / bagSizeNumber);
};

export const getBatchDefaults = (tphBatch: string): BatchDefaults => {
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

export function isPositiveNumber(value: string) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0;
}

export function isNonNegativeNumber(value: string) {
  if (!value.trim()) {
    return true;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue >= 0;
}

export function getOptionsWithOther(options: string[]) {
  const normalizedOptions = options.filter((option) => option.toLowerCase() !== "other" && option.toLowerCase() !== "others");
  return [...normalizedOptions, "Other"];
}

export const getBatchKg = (tphBatch: string) => {
  if (tphBatch === "1TPH") return 500;
  if (tphBatch === "2TPH") return 1000;
  if (tphBatch === "Manual Blender") return 300;
  if (tphBatch === "Sigma Mixer") return 62;
  return 0;
};

export const getBagSizeKg = (bagSize: string) => {
  const match = bagSize.match(/\d+/);
  return match ? Number(match[0]) : 0;
};

export const getTotalPackedKg = (items: ManufacturingProductItem[]) => {
  return items.reduce((total, item) => {
    const bagKg = getBagSizeKg(item.bagSize);
    const bags = Number(item.totalBagsProduced) || 0;
    return total + bagKg * bags;
  }, 0);
};

export const getWastageSizeLabel = (productCategory: string) =>
  productCategory === "Tile Cleaner"
    ? "Bottle Size"
    : productCategory === "Grout" || productCategory === "Tile Grout"
      ? "Pouch Size"
      : productCategory === "Epoxy"
        ? "Bucket Size"
        : "Wastage Bag Size";

export const getWastageSizeOptions = (productCategory: string) =>
  productCategory === "Bondure"
    ? ["40Kg"]
    : productCategory === "Tile Adhesive"
      ? ["20KG", "50KG"]
      : productCategory === "Tile Cleaner"
        ? ["1L", "5L"]
        : productCategory === "Grout" || productCategory === "Tile Grout"
          ? ["1Kg"]
          : productCategory === "Epoxy"
            ? ["1KG", "5KG"]
            : [];
