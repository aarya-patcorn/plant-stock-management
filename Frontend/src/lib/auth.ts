export const AUTH_STORAGE_KEY = "inventory-auth-user";

export function hasAuthenticatedUser() {
  return typeof window !== "undefined" && Boolean(window.sessionStorage.getItem(AUTH_STORAGE_KEY));
}
