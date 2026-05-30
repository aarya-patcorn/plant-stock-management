export function sanitizeTextOnly(value: string) {
  return value.replace(/[^\p{L}\s.,'&()-]/gu, "");
}

export function sanitizeNumberOnly(value: string, options?: { allowDecimal?: boolean }) {
  const allowDecimal = options?.allowDecimal ?? false;
  const stripped = value.replace(/[^\d.]/g, "");

  if (!allowDecimal) {
    return stripped.replace(/\./g, "");
  }

  const [whole = "", ...rest] = stripped.split(".");
  return rest.length > 0 ? `${whole}.${rest.join("")}` : whole;
}

export function isTextOnly(value: string) {
  return sanitizeTextOnly(value) === value;
}
