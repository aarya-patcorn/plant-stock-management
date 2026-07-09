export type ManufacturingOtherField =
  | "tphBatch"
  | "productCategory"
  | "finishedProductName"
  | "token"
  | "color"
  | "bagSize";

export type SubmitStatus = "idle" | "success" | "error";

export interface ManufacturingFormData {
  productionDate: string;
  tphBatch: string;
  batchNo: string;
  productCategory: string;
  materialQuantity: string;
  materialUnit: string;
  token: string;
  color: string;
  finishedProductName: string;
  bagSize: string;
  totalBagsProduced: string;
  canSize: string;
  totalCan: string;
  sticker: string;
  sponge: string;
  wastageQty: string;
  remarks: string;
}

export interface ManufacturingRawMaterial {
  rawMaterialName: string;
  packagingType: string;
  level2: string;
  level3: string;
  level4?: string;
  packagingBagColor?: string;
  bucketSize?: string;
  bagColor?: string;
  sandEpoxyColor?: string;
  colorOfSandEpoxy: string;
  materialQuantity: string | number;
  materialUnit: string;
}

export interface ManufacturingProductItem {
  token: string;
  bagSize: string;
  bucketSize?: string;
  totalBagsProduced: string;
}

export interface BatchDefaults {
  productCategory: string;
  color: string;
}
