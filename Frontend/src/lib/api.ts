const API_BASE_URL = import.meta.env.VITE_API_URL;

type FormType = "purchase" | "manufacturing" | "dispatch";
type FormPayload = Record<string, unknown>;
type ApiResponse = { message?: string; success?: boolean; status?: string; data?: unknown } | null;

type LoginPayload = {
  userId: string;
  password: string;
};

export type PurchaseEntry = {
  id: string;
  serialNo: string;
  date: string;
  time: string;
  rawMaterialName: string;
  packagingType: string;
  level2: string;
  level3: string;
  level4: string;
  packagingBag: string;
  packagingBagColor: string;
  bucketSize: string;
  quantityPurchased: string;
  purchaseStock: string;
  unit: string;
  supplierName: string;
  invoiceNo: string;
  unloadBy: string;
  currentStock: string;
  usedInProduction: string;
  attachFile: string;
  remarks: string;
};

export type ManufacturingEntry = {
  id: string;
  productionDate: string;
  tphBatch: string;
  batchNo: string;
  productCategory: string;
  token: string;
  color: string;
  finishedProductName: string;
  bagSize: string;
  totalBagsProduced: string;
  wastageQty: string;
  wastageReason: string;
  rawMaterialNames: string;
  rawMaterialQty: string;
  rawMaterialUnits: string;
  remarks: string;
};

export type ProductionMaterialLog = {
  id: string;
  productCategory: string;
  productColor: string;
  productName: string;
  token: string;
  bagSize: string;
  currentQuantity: string;
  shippedQuantity: string;
  remarks: string;
};

export type DispatchEntry = {
  id: string;
  date: string;
  time: string;
  challanNo: string;
  challanName: string;
  vehicleNo: string;
  driverName: string;
  driverContact: string;
  dispatchTime: string;
  dispatchSite: string;
  todayVehicleNo: string;
  token: string;
  productCategory: string;
  bagSize: string;
  productColor: string;
  productName: string;
  quantity: string;
  totalBags: string;
};

const endpointByFormType: Record<FormType, string> = {
  purchase: "/api/purchases",
  manufacturing: "/api/manufacturing",
  dispatch: "/api/dispatch",
};

function apiUrl(endpoint: string) {
  return API_BASE_URL.replace(/\/$/, "") + endpoint;
}

function getApiErrorMessage(responseData: ApiResponse, fallback: string) {
  if (!responseData) return fallback;
  if (typeof responseData.message === "string" && responseData.message.trim()) return responseData.message;
  if (typeof responseData.data === "string" && responseData.data.trim()) return responseData.data;
  return fallback;
}

async function requestApi(endpoint: string, options: RequestInit = {}, fallbackMessage = "Request failed.") {
  const response = await fetch(apiUrl(endpoint), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const responseText = await response.text();
  const responseData = responseText ? safeParseJson(responseText) : null;

  if (!response.ok || responseData?.success === false || responseData?.status === "error") {
    throw new Error(getApiErrorMessage(responseData, responseText || fallbackMessage));
  }

  return responseData;
}

export async function submitEntry(formType: FormType, payload: FormPayload) {
  return requestApi(endpointByFormType[formType], { method: "POST", body: JSON.stringify(payload) }, "Unable to save entry.");
}

export async function updatePurchaseEntry(payload: PurchaseEntry) {
  return requestApi("/api/purchases/" + payload.id, { method: "PUT", body: JSON.stringify(payload) }, "Unable to update purchase entry.");
}

export async function updateManufacturingEntry(payload: ManufacturingEntry) {
  return requestApi("/api/manufacturing/" + payload.id, { method: "PUT", body: JSON.stringify(payload) }, "Unable to update manufacturing entry.");
}

export async function updateDispatchEntry(payload: DispatchEntry) {
  return requestApi("/api/dispatch/" + payload.id, { method: "PUT", body: JSON.stringify(payload) }, "Unable to update dispatch entry.");
}

export async function deletePurchaseEntry(entryId: string) {
  return requestApi("/api/purchases/" + entryId, { method: "DELETE" }, "Unable to delete purchase entry.");
}

export async function deleteManufacturingEntry(entryId: string) {
  return requestApi("/api/manufacturing/" + entryId, { method: "DELETE" }, "Unable to delete manufacturing entry.");
}

export async function deleteDispatchEntry(entryId: string) {
  return requestApi("/api/dispatch/" + entryId, { method: "DELETE" }, "Unable to delete dispatch entry.");
}

export async function loginUser(payload: LoginPayload) {
  return requestApi("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }, "Invalid user ID or password.");
}

export async function fetchPurchaseEntries() {
  const responseData = await requestApi("/api/purchases", {}, "Unable to fetch purchase entries.");
  const entries = Array.isArray(responseData?.data) ? responseData.data : [];
  return entries.map(normalizePurchaseEntry);
}

export async function fetchInventory() {
  const responseData = await requestApi("/api/inventory", {}, "Unable to fetch inventory.");
  const entries = Array.isArray(responseData?.data) ? responseData.data : [];
  return entries.map(normalizePurchaseEntry);
}

export async function fetchManufacturingEntries() {
  const responseData = await requestApi("/api/manufacturing", {}, "Unable to fetch manufacturing entries.");
  const entries = Array.isArray(responseData?.data) ? responseData.data : [];
  return entries.map(normalizeManufacturingEntry);
}

export async function fetchProductionMaterialLogs() {
  const responseData = await requestApi("/api/manufacturing/logs/production-materials", {}, "Unable to fetch production material logs.");
  const entries = Array.isArray(responseData?.data) ? responseData.data : [];
  return entries.map(normalizeProductionMaterialLog);
}

export async function fetchDispatchEntries() {
  const responseData = await requestApi("/api/dispatch", {}, "Unable to fetch dispatch entries.");
  const entries = Array.isArray(responseData?.data) ? responseData.data : [];
  return entries.map(normalizeDispatchEntry);
}

function normalizePurchaseEntry(entry: unknown): PurchaseEntry {
  const record = typeof entry === "object" && entry !== null ? entry as Record<string, unknown> : {};
  return {
    id: stringifyValue(record.id ?? record._id),
    serialNo: stringifyValue(record.serialNo ?? record.serial_no),
    date: normalizeDate(record.date),
    time: normalizeTime(record.time),
    rawMaterialName: stringifyValue(record.rawMaterialName),
    packagingType: stringifyValue(record.packagingType),
    level2: stringifyValue(record.level2),
    level3: stringifyValue(record.level3),
    level4: stringifyValue(record.level4),
    packagingBag: stringifyValue(record.packagingBag ?? record.level4),
    packagingBagColor: stringifyValue(record.packagingBagColor ?? record.bagColor),
    bucketSize: stringifyValue(record.bucketSize ?? record.level4),
    quantityPurchased: stringifyValue(record.quantityPurchased ?? record.purchaseStock),
    purchaseStock: stringifyValue(record.purchaseStock ?? record.quantityPurchased),
    unit: stringifyValue(record.unit),
    supplierName: stringifyValue(record.supplierName),
    invoiceNo: stringifyValue(record.invoiceNo),
    unloadBy: stringifyValue(record.unloadBy),
    currentStock: stringifyValue(record.currentStock ?? record.current_quantity ?? record.availableStock),
    usedInProduction: stringifyValue(record.usedInProduction ?? record.usedInProductionStock ?? record.used_stock),
    attachFile: stringifyValue(record.attachFile),
    remarks: stringifyValue(record.remarks),
  };
}

function normalizeManufacturingEntry(entry: unknown): ManufacturingEntry {
  const record = typeof entry === "object" && entry !== null ? (entry as Record<string, unknown>) : {};
  const rawMaterials = Array.isArray(record.rawMaterials) ? record.rawMaterials as Array<Record<string, unknown>> : [];
  return {
    id: stringifyValue(record.id ?? record._id),
    productionDate: normalizeDate(record.productionDate ?? record.date),
    tphBatch: stringifyValue(record.tphBatch),
    batchNo: stringifyValue(record.batchNo),
    productCategory: stringifyValue(record.productCategory),
    token: stringifyValue(record.token),
    color: stringifyValue(record.color ?? record.productColor),
    finishedProductName: stringifyValue(record.finishedProductName ?? record.productName),
    bagSize: stringifyValue(record.bagSize),
    totalBagsProduced: stringifyValue(record.totalBagsProduced),
    wastageQty: stringifyValue(record.wastageQty),
    wastageReason: stringifyValue(record.wastageReason),
    rawMaterialNames: rawMaterials.map((item) => stringifyValue(item.rawMaterialName)).filter(Boolean).join(", "),
    rawMaterialQty: rawMaterials.map((item) => stringifyValue(item.materialQuantity)).filter(Boolean).join(", "),
    rawMaterialUnits: rawMaterials.map((item) => stringifyValue(item.materialUnit)).filter(Boolean).join(", "),
    remarks: stringifyValue(record.remarks),
  };
}

function normalizeProductionMaterialLog(entry: unknown): ProductionMaterialLog {
  const record = typeof entry === "object" && entry !== null ? (entry as Record<string, unknown>) : {};
  return {
    id: stringifyValue(record.id ?? record._id),
    productCategory: stringifyValue(record.productCategory),
    productColor: stringifyValue(record.productColor ?? record.color),
    productName: stringifyValue(record.productName ?? record.finishedProductName),
    token: stringifyValue(record.token),
    bagSize: stringifyValue(record.bagSize),
    currentQuantity: stringifyValue(record.currentQuantity ?? 0),
    shippedQuantity: stringifyValue(record.shippedQuantity ?? 0),
    remarks: stringifyValue(record.remarks),
  };
}

function normalizeDispatchEntry(entry: unknown): DispatchEntry {
  const record = typeof entry === "object" && entry !== null ? (entry as Record<string, unknown>) : {};
  return {
    id: stringifyValue(record.id ?? record._id),
    date: normalizeDate(record.date),
    time: normalizeTime(record.time),
    challanNo: stringifyValue(record.challanNo),
    challanName: stringifyValue(record.challanName),
    vehicleNo: stringifyValue(record.vehicleNo),
    driverName: stringifyValue(record.driverName),
    driverContact: stringifyValue(record.driverContact),
    dispatchTime: normalizeTime(record.dispatchTime),
    dispatchSite: stringifyValue(record.dispatchSite),
    todayVehicleNo: stringifyValue(record.todayVehicleNo),
    token: stringifyValue(record.token),
    productCategory: stringifyValue(record.productCategory),
    bagSize: stringifyValue(record.bagSize),
    productColor: stringifyValue(record.productColor),
    productName: stringifyValue(record.productName),
    quantity: stringifyValue(record.quantity),
    totalBags: stringifyValue(record.totalBags),
  };
}

function stringifyValue(value: unknown) {
  return value == null ? "" : String(value);
}

function normalizeDate(value: unknown) {
  const text = stringifyValue(value);
  if (!text) return "";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleDateString("en-CA", { timeZone: "UTC" });
}

function normalizeTime(value: unknown) {
  const text = stringifyValue(value);
  if (!text) return "";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

function safeParseJson(text: string): ApiResponse {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
