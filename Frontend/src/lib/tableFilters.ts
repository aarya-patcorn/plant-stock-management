import type { Filter } from "@/components/reui/filters";

export type FilterAccessorMap<T> = Record<string, (row: T) => unknown>;

function normalizeText(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeDate(value: unknown) {
  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-CA", { timeZone: "UTC" });
}

function normalizeNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const text = String(value ?? "").trim();

  if (!text) {
    return null;
  }

  const parsed = Number(text.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function hasMeaningfulValues(values: unknown[]) {
  if (values.length === 0) {
    return false;
  }

  return values.some((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (value == null) {
      return false;
    }

    if (typeof value === "number") {
      return Number.isFinite(value);
    }

    return String(value).trim() !== "";
  });
}

export function getActiveFilters<T>(filters: Filter<T>[]) {
  return filters.filter((filter) => hasMeaningfulValues(filter.values));
}

function matchesTextOperator(operator: string, fieldValue: unknown, values: unknown[]) {
  const haystack = normalizeText(fieldValue);
  const needles = values.map(normalizeText).filter(Boolean);

  switch (operator) {
    case "is":
    case "equals":
      return haystack === (needles[0] ?? "");
    case "is_not":
    case "not_equals":
      return haystack !== (needles[0] ?? "");
    case "contains":
      return needles.some((needle) => haystack.includes(needle));
    case "not_contains":
      return !needles.some((needle) => haystack.includes(needle));
    case "starts_with":
      return needles.some((needle) => haystack.startsWith(needle));
    case "ends_with":
      return needles.some((needle) => haystack.endsWith(needle));
    case "is_any_of":
      return needles.includes(haystack);
    case "is_not_any_of":
      return !needles.includes(haystack);
    case "includes_all":
      return needles.every((needle) => haystack.includes(needle));
    case "excludes_all":
      return needles.every((needle) => !haystack.includes(needle));
    case "empty":
      return haystack === "";
    case "not_empty":
      return haystack !== "";
    default:
      return true;
  }
}

function matchesNumberOperator(operator: string, fieldValue: unknown, values: unknown[]) {
  const current = normalizeNumber(fieldValue);
  const first = normalizeNumber(values[0]);
  const second = normalizeNumber(values[1]);

  if (operator === "empty") {
    return current == null;
  }

  if (operator === "not_empty") {
    return current != null;
  }

  if (current == null) {
    return false;
  }

  switch (operator) {
    case "is":
    case "equals":
      return first != null ? current === first : true;
    case "is_not":
    case "not_equals":
      return first != null ? current !== first : true;
    case "greater_than":
      return first != null ? current > first : true;
    case "greater_than_or_equal":
      return first != null ? current >= first : true;
    case "less_than":
      return first != null ? current < first : true;
    case "less_than_or_equal":
      return first != null ? current <= first : true;
    case "between":
      if (first != null && second != null) {
        return current >= Math.min(first, second) && current <= Math.max(first, second);
      }
      return true;
    case "not_between":
      if (first != null && second != null) {
        return current < Math.min(first, second) || current > Math.max(first, second);
      }
      return true;
    default:
      return true;
  }
}

function matchesDateOperator(operator: string, fieldValue: unknown, values: unknown[]) {
  const current = normalizeDate(fieldValue);
  const first = normalizeDate(values[0]);
  const second = normalizeDate(values[1]);

  switch (operator) {
    case "empty":
      return current === "";
    case "not_empty":
      return current !== "";
  }

  if (!current) {
    return false;
  }

  switch (operator) {
    case "is":
    case "equals":
      return first ? current === first : true;
    case "before":
      return first ? current < first : true;
    case "after":
      return first ? current > first : true;
    case "between":
      if (first && second) {
        return current >= (first < second ? first : second) && current <= (first < second ? second : first);
      }
      return true;
    case "not_between":
      if (first && second) {
        const lower = first < second ? first : second;
        const upper = first < second ? second : first;
        return current < lower || current > upper;
      }
      return true;
    default:
      return true;
  }
}

export function applyTableFilters<T>(
  rows: T[],
  filters: Filter[],
  accessors: FilterAccessorMap<T>,
  fieldTypes: Record<string, "text" | "number" | "date"> = {},
) {
  const activeFilters = getActiveFilters(filters);

  if (activeFilters.length === 0) {
    return rows;
  }

  return rows.filter((row) =>
    activeFilters.every((filter) => {
      const accessor = accessors[filter.field];

      if (!accessor) {
        return true;
      }

      const fieldValue = accessor(row);
      const fieldType = fieldTypes[filter.field] ?? "text";

      if (fieldType === "number") {
        return matchesNumberOperator(filter.operator, fieldValue, filter.values);
      }

      if (fieldType === "date") {
        return matchesDateOperator(filter.operator, fieldValue, filter.values);
      }

      return matchesTextOperator(filter.operator, fieldValue, filter.values);
    }),
  );
}

