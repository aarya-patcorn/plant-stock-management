const pad = (value: number) => String(value).padStart(2, "0");

export function getCurrentLocalDateInputValue(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function getCurrentLocalTimeInputValue(now = new Date()) {
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}
