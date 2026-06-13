export function normalizeDateValue(value: string) {
  const trimmed = String(value || "").trim();

  if (!trimmed) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const date = new Date(trimmed);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-CA", { timeZone: "UTC" });
}

export function isWithinDateRange(value: string, fromDate: string, toDate: string) {
  const normalized = normalizeDateValue(value);

  if (!normalized) {
    return false;
  }

  return normalized >= fromDate && normalized <= toDate;
}

export function normalizeLabel(value: string) {
  return value.trim().toLowerCase();
}

export function getTodayKey() {
  return new Date().toLocaleDateString("en-CA");
}
