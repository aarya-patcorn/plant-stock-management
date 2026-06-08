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
  sticker: string;
  sponge: string;
  wastageQty: string;
  remarks: string;
}

export interface ManufacturingRawMaterial {
  rawMaterialName: string;
  packagingType: string;
  materialQuantity: string;
  materialUnit: string;
}

export interface ManufacturingProductItem {
  token: string;
  bagSize: string;
  totalBagsProduced: string;
}

export interface BatchDefaults {
  productCategory: string;
  color: string;
}
