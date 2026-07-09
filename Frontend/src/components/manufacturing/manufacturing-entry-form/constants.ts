import type {
  ManufacturingFormData,
  ManufacturingOtherField,
  ManufacturingProductItem,
  ManufacturingRawMaterial,
} from "./types";
import { getCurrentLocalDateInputValue } from "@/lib/dateTimeDefaults";

export const PRODUCT_CATEGORIES = ["Tile Adhesive", "Bondure", "Epoxy", "Grout", "Tile Cleaner", "Other"];
export const UNIT_OPTIONS = ["kg", "g", "ltr", "ml", "pcs", "bags"];
export const GROUT_COLORS = ["Black", "White", "Ivory", "Coffee Brown", "Grey", "Light Grey", "Green", "Blue", "Red", "Yellow"];
export const TILE_ADHESIVE_WHITE_PRODUCTS = ["K60", "K80", "K90", "Kamdhenu X"];
export const TILE_ADHESIVE_GREY_PRODUCTS = ["K50", "K60", "K80", "K90", "Kamdhenu X"];
export const TILE_CLEANER_PRODUCTS = ["ShineX", "CrystalX"];
export const TPH_BATCH_OPTIONS = ["1TPH", "2TPH", "Manual Blender", "Sigma Mixer", "Manual Hand Mixer"];
export const MOBILE_RECENT_BATCHES_PAGE_SIZE = 3;
export const DESKTOP_RECENT_BATCHES_PAGE_SIZE = 8;
export const OTHER_OPTION = "__other__";
export const MANUFACTURING_OTHER_FIELDS = [
  "tphBatch",
  "productCategory",
  "finishedProductName",
  "token",
  "color",
  "bagSize",
] as const satisfies readonly ManufacturingOtherField[];

export const createInitialFormData = (): ManufacturingFormData => ({
  productionDate: getCurrentLocalDateInputValue(),
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
  canSize: "",
  totalCan: "",
  sticker: "",
  sponge: "",
  wastageQty: "",
  remarks: "",
});

export const INITIAL_RAW_MATERIALS: ManufacturingRawMaterial[] = [
  {
    rawMaterialName: "",
    packagingType: "",
    level2: "",
    level3: "",
    level4: "",
    packagingBagColor: "",
    bucketSize: "",
    bagColor: "",
    sandEpoxyColor: "",
    colorOfSandEpoxy: "",
    materialQuantity: "",
    materialUnit: "",
  },
];

export const EMPTY_PRODUCT_ITEM: ManufacturingProductItem = {
  token: "",
  bagSize: "",
  bucketSize: "",
  totalBagsProduced: "",
};

export const INITIAL_MANUFACTURING_OTHER_STATE = Object.fromEntries(
  MANUFACTURING_OTHER_FIELDS.map((field) => [field, false]),
) as Record<ManufacturingOtherField, boolean>;

