import { Navigate, Outlet } from "react-router-dom";
import { hasAuthenticatedUser } from "@/lib/auth";

export function PrivateRoute() {
  if (!hasAuthenticatedUser()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  if (hasAuthenticatedUser()) {
    return <Navigate to="/purchase-entry" replace />;
  }

  return <Outlet />;
}

