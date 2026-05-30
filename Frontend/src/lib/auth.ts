export const AUTH_STORAGE_KEY = "inventory-auth-user";

export function hasAuthenticatedUser() {
  return typeof window !== "undefined" && Boolean(window.localStorage.getItem(AUTH_STORAGE_KEY));
}

