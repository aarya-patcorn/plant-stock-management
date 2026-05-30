export type { PurchaseEntry } from "@/lib/api";

import type { PurchaseEntry } from "@/lib/api";

const PURCHASE_ENTRIES_STORAGE_KEY = "purchaseEntries";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getPurchaseEntries(): PurchaseEntry[] {
  if (!canUseStorage()) {
    return [];
  }

  const savedEntries = window.localStorage.getItem(PURCHASE_ENTRIES_STORAGE_KEY);

  if (!savedEntries) {
    return [];
  }

  try {
    const parsedEntries = JSON.parse(savedEntries);
    return Array.isArray(parsedEntries) ? parsedEntries : [];
  } catch {
    return [];
  }
}

export function savePurchaseEntries(entries: PurchaseEntry[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(PURCHASE_ENTRIES_STORAGE_KEY, JSON.stringify(entries));
}

export function addPurchaseEntry(entry: PurchaseEntry) {
  const nextEntries = [entry, ...getPurchaseEntries()];
  savePurchaseEntries(nextEntries);
  return nextEntries;
}

export function updatePurchaseEntry(updatedEntry: PurchaseEntry) {
  const nextEntries = getPurchaseEntries().map((entry) =>
    entry.id === updatedEntry.id ? updatedEntry : entry,
  );
  savePurchaseEntries(nextEntries);
  return nextEntries;
}

export function deletePurchaseEntry(entryId: string) {
  const nextEntries = getPurchaseEntries().filter((entry) => entry.id !== entryId);
  savePurchaseEntries(nextEntries);
  return nextEntries;
}
