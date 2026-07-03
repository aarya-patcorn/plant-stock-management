import type { ManufacturingRawMaterial } from "./manufacturing-entry-form/types";

export type GroutRecipeName =
  | "White"
  | "Ivory"
  | "Black Cement Grout"
  | "Coffee Brown"
  | "Light Grey"
  | "Grey"
  | "Red"
  | "Blue"
  | "Green"
  | "Yellow"

export type GroutRecipeMaterialName =
  | "White Cement"
  | "Grey Cement"
  | "Calcium Carbonate"
  | "K50 Chemical"
  | "Yellow Pigment"
  | "Black Pigment"
  | "Red Pigment"
  | "Blue Pigment"

export type GroutRecipeMap = Record<GroutRecipeName, Partial<Record<GroutRecipeMaterialName, number>>>;

const groutRecipeMaterials: Record<GroutRecipeMaterialName, Pick<ManufacturingRawMaterial, "rawMaterialName" | "packagingType" | "level2">> = {
  "White Cement": {
    rawMaterialName: "Cement",
    packagingType: "White Cement",
    level2: "Bag",
  },
  "Grey Cement": {
    rawMaterialName: "Cement",
    packagingType: "PPC",
    level2: "Bag",
  },
  "Calcium Carbonate": {
    rawMaterialName: "Chemical",
    packagingType: "Tile Grout",
    level2: "Calcium Carbonate",
  },
  "K50 Chemical": {
    rawMaterialName: "Chemical",
    packagingType: "Tile Adhesive",
    level2: "K50",
  },
  "Yellow Pigment": {
    rawMaterialName: "Chemical",
    packagingType: "Tile Grout",
    level2: "Yellow Pigment",
  },
  "Black Pigment": {
    rawMaterialName: "Chemical",
    packagingType: "Tile Grout",
    level2: "Black Pigment",
  },
  "Red Pigment": {
    rawMaterialName: "Chemical",
    packagingType: "Tile Grout",
    level2: "Red Pigment",
  },
  "Blue Pigment": {
    rawMaterialName: "Chemical",
    packagingType: "Tile Grout",
    level2: "Blue Pigment",
  },
};

export const groutRecipes: GroutRecipeMap = {
  White: {
    "White Cement": 600,
    "Calcium Carbonate": 400,
    "K50 Chemical": 13.333,
  },
  Ivory: {
    "White Cement": 600,
    "Calcium Carbonate": 400,
    "K50 Chemical": 13.333,
    "Yellow Pigment": 0.333,
  },
  "Black Cement Grout": {
    "Grey Cement": 600,
    "Calcium Carbonate": 400,
    "K50 Chemical": 13.333,
    "Black Pigment": 11.667,
  },
  "Coffee Brown": {
    "White Cement": 466.667,
    "Grey Cement": 133.333,
    "Calcium Carbonate": 400,
    "K50 Chemical": 13.333,
    "Black Pigment": 4.667,
    "Red Pigment": 4.333,
  },
  "Light Grey": {
    "White Cement": 600,
    "Grey Cement": 133.333,
    "Calcium Carbonate": 400,
    "K50 Chemical": 13.333,
  },
  Grey: {
    "White Cement": 333.333,
    "Grey Cement": 466.667,
    "Calcium Carbonate": 400,
    "K50 Chemical": 13.333,
  },
  Red: {
    "White Cement": 666.667,
    "Calcium Carbonate": 333.333,
    "K50 Chemical": 10,
    "Red Pigment": 6,
  },
  Blue: {
    "White Cement": 666.667,
    "Calcium Carbonate": 333.333,
    "K50 Chemical": 10,
    "Blue Pigment": 13.333,
  },
  Green: {
    "White Cement": 666.667,
    "Calcium Carbonate": 333.333,
    "K50 Chemical": 10,
    "Yellow Pigment": 3,
    "Blue Pigment": 10.333,
  },
  Yellow: {
    "White Cement": 666.667,
    "Calcium Carbonate": 333.333,
    "K50 Chemical": 10,
    "Yellow Pigment": 3.333,
  },
};

export function normalizeGroutProductName(value: string): GroutRecipeName | "" {
  const normalized = String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

  if (normalized === "white" || normalized === "white grout") return "White";
  if (normalized === "ivory" || normalized === "ivory grout") return "Ivory";
  if (normalized === "black" || normalized === "black grout" || normalized === "black cement grout") return "Black Cement Grout";
  if (normalized === "coffee brown" || normalized === "coffee brown grout") return "Coffee Brown";
  if (normalized === "light grey" || normalized === "light grey grout") return "Light Grey";
  if (normalized === "grey" || normalized === "grey grout") return "Grey";
  if (normalized === "red" || normalized === "red grout") return "Red";
  if (normalized === "blue" || normalized === "blue grout") return "Blue";
  if (normalized === "green" || normalized === "green grout") return "Green";
  if (normalized === "yellow" || normalized === "yellow grout") return "Yellow";

  return "";
}

export function parseGroutPouchSizeToKg(pouchSize: string) {
  const text = String(pouchSize || "").trim().toLowerCase();
  const match = text.match(/(\d+(?:\.\d+)?)/);
  const quantity = match ? Number(match[1]) : 0;

  if (!Number.isFinite(quantity)) {
    return 0;
  }

  if (text.includes("gm") || text.includes("gram")) {
    return quantity / 1000;
  }

  if (text.includes("mt") || text.includes("ton")) {
    return quantity * 1000;
  }

  return quantity;
}

function formatGroutQuantity(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }

  return String(Number(value.toFixed(3)));
}

export function buildGroutRecipeFromTotalKg(
  productNameOrColor: string, 
  totalGroutKg: number,
): ManufacturingRawMaterial[] {
  const normalizedProductName = normalizeGroutProductName(productNameOrColor);
  const formula = normalizedProductName ? groutRecipes[normalizedProductName] : null;
  const safeTotalGroutKg = Number.isFinite(totalGroutKg) ? totalGroutKg : 0;
  const canCalculateQuantity = safeTotalGroutKg > 0;

  if (!formula) {
    return [];
  }

  return Object.entries(formula).map(([materialName, perKgGramValue]) => {
    const material = groutRecipeMaterials[materialName as GroutRecipeMaterialName];

    return {
      rawMaterialName: material.rawMaterialName,
      packagingType: material.packagingType,
      level2: material.level2,
      level3: "",
      level4: "",
      packagingBagColor: "",
      bucketSize: "",
      bagColor: "",
      sandEpoxyColor: "",
      colorOfSandEpoxy: "",
      materialQuantity: canCalculateQuantity
        ? formatGroutQuantity((Number(perKgGramValue) * safeTotalGroutKg) / 1000)
        : "",
      materialUnit: "kg",
    };
  });
}

export function buildGroutRecipe(
  productNameOrColor: string,
  pouchSize: string,
  totalPouch: string | number,
): ManufacturingRawMaterial[] {
  const pouchSizeKg = parseGroutPouchSizeToKg(pouchSize);
  const totalPouchCount = Number(totalPouch) || 0;
  const totalGroutKg = pouchSizeKg * totalPouchCount;

  return buildGroutRecipeFromTotalKg(productNameOrColor, totalGroutKg);
}
