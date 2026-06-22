export const formatDateDDMMYYYY = (date: string) => {
  if (!date) return "";
  return date.split("-").reverse().join("-");
};