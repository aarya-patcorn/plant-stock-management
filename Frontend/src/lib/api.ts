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
  user: string;
  date: string;
  time: string;
  rawMaterialName: string;
  packagingType: string;
  level2: string;
  level3: string;
  level4: string;
  packagingBag: string;
  packagingBagColor: string;
  bagColor: string;
  sandEpoxyColor: string;
  coupon?: string;
  bucketSize: string;
  quantityPurchased: string;
  purchaseStock: string;
  unit: string;
  supplierName: string;
  invoiceNo: string;
  unloadBy: string;
  currentStock: string;
  usedInProduction: string;
  attachFile?: string;
  attachFileName?: string;
  attachFileId?: string;
  remarks: string;
};

export type InventoryEntry = {
  id: string;
  rawMaterialName: string;
  packagingType: string;
  level2: string;
  level3: string;
  level4: string;
  coupon: string;
  sandEpoxyColor: string;
  packagingBagColor: string;
  bagColor: string;
  purchaseStock: number;
  usedInProduction: number;
  currentStock: number;
  unit: string;
};

export type ManufacturingProductItem = {
  token: string;
  bagSize: string;
  totalBagsProduced: string;
};

export type ManufacturingEntry = {
  id: string;
  productionDate: string;
  user: string;
  tphBatch: string;
  batchNo: string;
  productCategory: string;
  token: string;
  color: string;
  finishedProductName: string;
  bagSize: string;
  totalBagsProduced: string;
  canSize: string;
  totalCan: string;
  productItems: ManufacturingProductItem[];
  wastageQty: string;
  wastageTotalBags: string;
  wastageReason: string;
  rawMaterialNames: string;
  rawMaterialQty: string;
  rawMaterialUnits: string;
  remarks: string;
};

export type DashboardReportCategory = {
  productCategory: string;
  totalProductionKg: number;
  totalBagsProduced: number;
  totalEntries: number;
  productsCount: number;
  totalCurrentStock: number;
};

export type DashboardReportProductStock = {
  productCategory: string;
  productName: string;
  color: string;
  token: string;
  bagSize: string;
  currentQuantity: number;
  currentStock: number;
  totalBagsProduced: number;
  availableBags: number;
  dispatchedBags: number;
  shippedQuantity: number;
};

export type DashboardReports = {
  productionByCategory: DashboardReportCategory[];
  productStocksByCategory: Record<string, DashboardReportProductStock[]>;
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
  createdAt: string;
  updatedAt: string;
  remarks: string;
};

export type DispatchEntry = {
  id: string;
  date: string;
  time: string;
  user: string;
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
  wastageQty: string;
  remarks: string;
};

const endpointByFormType: Record<FormType, string> = {
  purchase: "/api/purchases",
  manufacturing: "/api/manufacturing",
  dispatch: "/api/dispatch",
};

function apiUrl(endpoint: string) {
  return (API_BASE_URL || "").replace(/\/$/, "") + endpoint;
}

function getApiErrorMessage(responseData: ApiResponse, fallback: string) {
  if (!responseData) return fallback;
  if (typeof responseData.message === "string" && responseData.message.trim()) return responseData.message;
  if (typeof responseData.data === "string" && responseData.data.trim()) return responseData.data;
  return fallback;
}

async function requestApi(endpoint: string, options: RequestInit = {}, fallbackMessage = "Request failed.") {
  const isFormDataBody = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = new Headers(options.headers ?? {});

  if (!isFormDataBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(apiUrl(endpoint), {
    ...options,
    headers,
  });

  const responseText = await response.text();
  const responseData = responseText ? safeParseJson(responseText) : null;

  if (!response.ok || responseData?.success === false || responseData?.status === "error") {
    throw new Error(getApiErrorMessage(responseData, responseText || fallbackMessage));
  }

  return responseData;
}

export async function submitEntry(
  formType: FormType,
  payload: FormPayload,
  file?: File | null,
) {
  const user = window.sessionStorage.getItem("userName") || "User";

  const payloadWithUser = {
    ...payload,
    user,
  };

  let response;

  if (formType !== "purchase") {
    response = await requestApi(
      endpointByFormType[formType],
      {
        method: "POST",
        body: JSON.stringify(payloadWithUser),
      },
      "Unable to save entry.",
    );
  } else {
    const formData = new FormData();

    Object.entries(payloadWithUser).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        formData.append(key, "");
        return;
      }

      const isFileValue = typeof File !== "undefined" && value != null && (value as unknown as File) instanceof File;

      if (Array.isArray(value) || (typeof value === "object" && value !== null && !isFileValue)) {
        formData.append(key, JSON.stringify(value));
        return;
      }

      formData.append(key, String(value));
    });

    if (file) {
      formData.append("attachFile", file);
    }

    response = await requestApi(
      endpointByFormType[formType],
      {
        method: "POST",
        body: formData,
      },
      "Unable to save entry.",
    );
  }
  setTimeout(() => {
    window.location.reload();
  }, 3000);

  return response;
}

export async function updatePurchaseEntry(payload: PurchaseEntry | FormData) {
  const body = typeof FormData !== "undefined" && payload instanceof FormData
    ? payload
    : JSON.stringify(payload);

  return requestApi("/api/purchases/" + (payload instanceof FormData ? String(payload.get("id") || "") : payload.id), { method: "PUT", body }, "Unable to update purchase entry.");
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
  return entries.map(normalizeInventoryEntry);
}

export async function fetchManufacturingEntries() {
  const responseData = await requestApi("/api/manufacturing", {}, "Unable to fetch manufacturing entries.");
  const entries = Array.isArray(responseData?.data) ? responseData.data : [];
  return entries.map(normalizeManufacturingEntry);
}

export async function fetchDashboardReports(fromDate: string, toDate: string) {
  const query = new URLSearchParams({ fromDate, toDate });
  const responseData = await requestApi(
    `/api/dashboard/reports?${query.toString()}`,
    { method: "GET" },
    "Unable to fetch reports.",
  );
  const data = typeof responseData?.data === "object" && responseData?.data !== null
    ? responseData.data as Record<string, unknown>
    : {};

  const productionByCategory = Array.isArray(data.productionByCategory)
    ? data.productionByCategory.map(normalizeDashboardReportCategory)
    : [];
  const productStocksByCategorySource = typeof data.productStocksByCategory === "object" && data.productStocksByCategory !== null
    ? data.productStocksByCategory as Record<string, unknown>
    : {};
  const productStocksByCategory = Object.fromEntries(
    Object.entries(productStocksByCategorySource).map(([category, items]) => [
      category,
      Array.isArray(items) ? items.map(normalizeDashboardReportProductStock) : [],
    ]),
  );

  return {
    productionByCategory,
    productStocksByCategory,
  };
}

export async function fetchProductionMaterialLogs() {
  const responseData = await requestApi("/api/manufacturing/logs/production-materials", {}, "Unable to fetch production material logs.");
  const entries = Array.isArray(responseData?.data) ? responseData.data : [];
  return entries.map(normalizeProductionMaterialLog);
}

export async function fetchWastageQty(params: {
  tphBatch: string;
  productCategory: string;
  finishedProductName: string;
}) {
  const query = new URLSearchParams({
    tphBatch: params.tphBatch.trim(),
    productCategory: params.productCategory.trim(),
    finishedProductName: params.finishedProductName.trim(),
  });

  const responseData = await requestApi(`/api/wastage?${query.toString()}`, {}, "Unable to fetch wastage quantity.");
  const data = typeof responseData?.data === "object" && responseData?.data !== null
    ? responseData.data as Record<string, unknown>
    : {};

  return Number(data.wastageQty || 0);
}

export async function reduceWastageQty(payload: {
  tphBatch: string;
  finishedProductName: string;
  remainingWastageQty: number;
}) {
  return requestApi("/api/wastage/update-remaining", {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, "Unable to reduce wastage quantity.");
}

export async function fetchDispatchEntries() {
  const responseData = await requestApi("/api/dispatch", {}, "Unable to fetch dispatch entries.");
  const entries = Array.isArray(responseData?.data) ? responseData.data : [];
  return entries.map(normalizeDispatchEntry);
}

function normalizePurchaseEntry(entry: unknown): PurchaseEntry {
  const record = typeof entry === "object" && entry !== null ? entry as Record<string, unknown> : {};
  const legacyAttachment = typeof record.attachFile === "object" && record.attachFile !== null
    ? record.attachFile as Record<string, unknown>
    : null;
  const attachFile = stringifyValue(
    typeof record.attachFile === "string"
      ? record.attachFile
      : legacyAttachment?.url,
  );
  const attachFileName = stringifyValue(record.attachFileName ?? legacyAttachment?.fileName);
  const attachFileId = stringifyValue(record.attachFileId ?? legacyAttachment?.fileId ?? legacyAttachment?.publicId);

  return {
    id: stringifyValue(record.id ?? record._id),
    user: stringifyValue(record.user ?? record.userName),
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
    bagColor: stringifyValue(record.bagColor),
    sandEpoxyColor: stringifyValue(record.sandEpoxyColor ?? record.colorOfSandEpoxy),
    coupon: stringifyValue(record.coupon),
    bucketSize: stringifyValue(record.bucketSize ?? record.level4),
    quantityPurchased: stringifyValue(record.quantityPurchased ?? record.purchaseStock),
    purchaseStock: stringifyValue(record.purchaseStock ?? record.quantityPurchased),
    unit: stringifyValue(record.unit),
    supplierName: stringifyValue(record.supplierName),
    invoiceNo: stringifyValue(record.invoiceNo),
    unloadBy: stringifyValue(record.unloadBy),
    currentStock: stringifyValue(record.currentStock ?? record.current_quantity ?? record.availableStock),
    usedInProduction: stringifyValue(record.usedInProduction ?? record.usedInProductionStock ?? record.used_stock),
    attachFile: attachFile || undefined,
    attachFileName: attachFileName || undefined,
    attachFileId: attachFileId || undefined,
    remarks: stringifyValue(record.remarks),
  };
}

function normalizeInventoryEntry(entry: unknown): InventoryEntry {
  const record =
    typeof entry === "object" && entry !== null
      ? (entry as Record<string, unknown>)
      : {};

  return {
    id: stringifyValue(record.id ?? record._id),
    rawMaterialName: stringifyValue(record.rawMaterialName),
    packagingType: stringifyValue(record.packagingType),
    level2: stringifyValue(record.level2),
    level3: stringifyValue(record.level3),
    level4: stringifyValue(record.level4),
    coupon: stringifyValue(record.coupon),
    sandEpoxyColor: stringifyValue(
      record.sandEpoxyColor ?? record.colorOfSandEpoxy
    ),
    packagingBagColor: stringifyValue(record.packagingBagColor),
    bagColor: stringifyValue(record.bagColor),
    purchaseStock: parseNumber(
      record.purchaseStock ?? record.quantityPurchased
    ),
    usedInProduction: parseNumber(
      record.usedInProduction ?? record.used_stock
    ),
    currentStock: parseNumber(
      record.currentStock ?? record.availableStock ?? record.current_quantity
    ),
    unit: stringifyValue(record.unit),
  };
}

function normalizeManufacturingEntry(entry: unknown): ManufacturingEntry {
  const record = typeof entry === "object" && entry !== null ? (entry as Record<string, unknown>) : {};
  const rawMaterials = Array.isArray(record.rawMaterials) ? record.rawMaterials as Array<Record<string, unknown>> : [];
  const productItemsSource = Array.isArray(record.productItems)
    ? record.productItems as Array<Record<string, unknown>>
    : [];
  const productItems = productItemsSource.length > 0
    ? productItemsSource.map((item) => ({
      token: stringifyValue(item.token),
      bagSize: stringifyValue(item.bagSize),
      totalBagsProduced: stringifyValue(item.totalBagsProduced),
    }))
    : [{
      token: stringifyValue(record.token),
      bagSize: stringifyValue(record.bagSize ?? record.canSize),
      totalBagsProduced: stringifyValue(record.totalBagsProduced ?? record.totalCan),
    }].filter((item) => item.token || item.bagSize || item.totalBagsProduced);
  const totalBagsProduced = productItems.length > 0
    ? String(productItems.reduce((sum, item) => sum + (Number(item.totalBagsProduced) || 0), 0))
    : stringifyValue(record.totalBagsProduced);
  const rawFinishedProductName = stringifyValue(record.finishedProductName ?? record.productName);
  const normalizedTileCleanerProductName =
    rawFinishedProductName.replace(/\s+/g, "").toLowerCase().startsWith("shinex")
      ? "ShineX"
      : rawFinishedProductName.replace(/\s+/g, "").toLowerCase().startsWith("crystalx")
        ? "CrystalX"
        : rawFinishedProductName;
  const derivedTileCleanerCanSize =
    stringifyValue(record.canSize) ||
    (rawFinishedProductName.includes("1L") ? "1L" : rawFinishedProductName.includes("5L") ? "5L" : "");
  const derivedTileCleanerTotalCan = stringifyValue(record.totalCan) || totalBagsProduced;
  const isTileCleanerCategory = stringifyValue(record.productCategory) === "Tile Cleaner";

  return {
    id: stringifyValue(record.id ?? record._id),
    user: stringifyValue(record.user ?? record.userName),
    productionDate: normalizeDate(record.productionDate ?? record.date),
    tphBatch: stringifyValue(record.tphBatch),
    batchNo: stringifyValue(record.batchNo),
    productCategory: stringifyValue(record.productCategory),
    token: productItems.map((item) => item.token).filter(Boolean).join(", ") || stringifyValue(record.token),
    color: stringifyValue(record.color ?? record.productColor),
    finishedProductName: isTileCleanerCategory ? normalizedTileCleanerProductName : rawFinishedProductName,
    bagSize: productItems.map((item) => item.bagSize).filter(Boolean).join(", ") || stringifyValue(record.bagSize),
    totalBagsProduced,
    canSize: isTileCleanerCategory ? derivedTileCleanerCanSize : stringifyValue(record.canSize),
    totalCan: isTileCleanerCategory ? derivedTileCleanerTotalCan : stringifyValue(record.totalCan),
    productItems,
    wastageQty: stringifyValue(record.wastageQty),
    wastageTotalBags: stringifyValue(record.wastageTotalBags),
    wastageReason: stringifyValue(record.wastageReason),
    rawMaterialNames: rawMaterials.map((item) => stringifyValue(item.rawMaterialName)).filter(Boolean).join(", "),
    rawMaterialQty: rawMaterials.map((item) => stringifyValue(item.materialQuantity)).filter(Boolean).join(", "),
    rawMaterialUnits: rawMaterials.map((item) => stringifyValue(item.materialUnit)).filter(Boolean).join(", "),
    remarks: stringifyValue(record.remarks),
  };
}

function normalizeDashboardReportCategory(entry: unknown): DashboardReportCategory {
  const record = typeof entry === "object" && entry !== null ? (entry as Record<string, unknown>) : {};
  return {
    productCategory: stringifyValue(record.productCategory),
    totalProductionKg: Number(record.totalProductionKg ?? 0) || 0,
    totalBagsProduced: Number(record.totalBagsProduced ?? 0) || 0,
    totalEntries: Number(record.totalEntries ?? 0) || 0,
    productsCount: Number(record.productsCount ?? 0) || 0,
    totalCurrentStock: Number(record.totalCurrentStock ?? 0) || 0,
  };
}

function normalizeDashboardReportProductStock(entry: unknown): DashboardReportProductStock {
  const record = typeof entry === "object" && entry !== null ? (entry as Record<string, unknown>) : {};
  return {
    productCategory: stringifyValue(record.productCategory),
    productName: stringifyValue(record.productName ?? record.finishedProductName),
    color: stringifyValue(record.color ?? record.productColor),
    token: stringifyValue(record.token),
    bagSize: stringifyValue(record.bagSize),
    currentQuantity: Number(record.currentQuantity ?? record.currentStock ?? 0) || 0,
    currentStock: Number(record.currentStock ?? record.currentQuantity ?? 0) || 0,
    totalBagsProduced: Number(record.totalBagsProduced ?? record.currentQuantity ?? record.currentStock ?? 0) || 0,
    availableBags: Number(record.availableBags ?? record.currentQuantity ?? 0) || 0,
    dispatchedBags: Number(record.dispatchedBags ?? record.shippedQuantity ?? 0) || 0,
    shippedQuantity: Number(record.shippedQuantity ?? record.dispatchedBags ?? 0) || 0,
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
    createdAt: stringifyValue(record.createdAt),
    updatedAt: stringifyValue(record.updatedAt),
    remarks: stringifyValue(record.remarks),
  };
}

function normalizeDispatchEntry(entry: unknown): DispatchEntry {
  const record = typeof entry === "object" && entry !== null ? (entry as Record<string, unknown>) : {};
  return {
    id: stringifyValue(record.id ?? record._id),
    user: stringifyValue(record.user ?? record.userName),
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
    wastageQty: stringifyValue(record.wastageQty),
    remarks: stringifyValue(record.remarks),
  };
}

function stringifyValue(value: unknown) {
  return value == null ? "" : String(value);
}

export function parseNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
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

