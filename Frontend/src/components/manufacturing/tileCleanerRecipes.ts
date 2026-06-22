import type { ManufacturingRawMaterial } from "./manufacturing-entry-form/types";

export type TileCleanerRecipeName = "ShineX" | "CrystalX";
export type TileCleanerRecipeMap = Record<TileCleanerRecipeName, Record<string, number>>;

export const tileCleanerRecipes: TileCleanerRecipeMap = {
  ShineX: {
    "Urea (Technical Grade)": 3,
    "2-Butoxyethanol": 2,
    "Sulphamic Acid": 3.5,
    "Citric Acid": 2,
    "Hydrochloric Acid (32%)": 3,
    "Alphox-200": 2,
    "Cocamidopropyl Betaine": 3.5,
    "Xanthan Gum": 0.3,
    "Fragrance & Dye": 0.2,
  },
  CrystalX: {
    "Alcohol Ethoxylate": 6,
    "Sodium Gluconate": 2.5,
    "2-Butoxyethanol": 2.5,
    "Isopropyl Alcohol (IPA 99%)": 1,
    "Benzalkonium Chloride (BKC)": 0.9,
    "Fragrance & Dye": 0.4,
  },
};

export function normalizeTileCleanerProductName(value: string): TileCleanerRecipeName | "" {
  const normalized = String(value || "").trim().toLowerCase().replace(/\s+/g, "");

  if (normalized.startsWith("shinex")) return "ShineX";
  if (normalized.startsWith("crystalx")) return "CrystalX";

  return "";
}

function parseTileCleanerCanSizeToLiters(canSize: string) {
  const match = String(canSize || "").match(/(\d+(?:\.\d+)?)/);
  const liters = match ? Number(match[1]) : 0;
  return Number.isFinite(liters) ? liters : 0;
}

export function buildTileCleanerRecipe(
  productName: string,
  canSize: string,
  totalCan: string | number,
): ManufacturingRawMaterial[] {
  const normalizedProductName = normalizeTileCleanerProductName(productName);
  const formula = normalizedProductName ? tileCleanerRecipes[normalizedProductName] : null;
  const litersPerCan = parseTileCleanerCanSizeToLiters(canSize);
  const totalCanCount = Number(totalCan) || 0;
  const totalLiquidML = litersPerCan * totalCanCount * 1000;
  const canCalculateQuantity = litersPerCan > 0 && totalCanCount > 0 && totalLiquidML > 0;

  if (!formula) {
    return [];
  }

  return Object.entries(formula).map(([chemicalName, percentage]) => ({
    rawMaterialName: "Chemical",
    packagingType: "Tile Cleaner",
    level2: chemicalName,
    level3: "",
    level4: "",
    packagingBagColor: "",
    bucketSize: "",
    bagColor: "",
    sandEpoxyColor: "",
    colorOfSandEpoxy: "",
    materialQuantity: canCalculateQuantity
      ? String((totalLiquidML * percentage) / 100)
      : "",
    materialUnit: "ml",
  }));
}

