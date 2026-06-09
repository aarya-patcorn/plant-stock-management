import { useEffect, useState } from "react";
import {
  BarChart3,
  Factory,
  LayoutDashboard,
  LogOut,
  Menu,
  PackagePlus,
  SendToBack,
  X,
  type LucideIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { BrowserRouter, Link, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { LoginPage } from "@/components/auth/LoginPage";
import { PrivateRoute, PublicRoute } from "@/components/auth/RouteGuards";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { InventoryEntriesPage } from "@/components/dashboard/InventoryEntriesPage";
import { ProductionMaterialLogsPage } from "@/components/dashboard/ProductionMaterialLogsPage";
import { DispatchEntriesPage } from "@/components/departure/DispatchEntriesPage";
import { ProductDepartureForm } from "@/components/departure/ProductDepartureForm";
import { ManufacturingEntryForm } from "@/components/manufacturing/ManufacturingEntryForm";
import { ManufacturingEntriesPage } from "@/components/manufacturing/ManufacturingEntriesPage";
import { PurchaseEntryForm } from "@/components/purchase/PurchaseEntryForm";
import { PurchaseEntriesPage } from "@/components/purchase/PurchaseEntriesPage";
import { ReportsPage } from "@/components/reports/ReportsPage";
import { Button } from "@/components/ui/button";
import newLogo from "@/assets/new_logo.png";
import { AUTH_STORAGE_KEY } from "@/lib/auth";
import ScrollToTop from "./hooks/ScrollToTop";

const navItems: Array<{ icon: LucideIcon; label: string; path: string }> = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: PackagePlus, label: "Purchase Entry", path: "/purchase-entry" },
  { icon: Factory, label: "Production", path: "/manufacturing-entry" },
  { icon: SendToBack, label: "Dispatch", path: "/product-departure" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
];

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold tracking-normal">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">This route is ready for the next screen.</p>
    </div>
  );
}

function Brand({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full ${className}`}>
      <div className="border-b border-slate-200/80 px-2 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            <img alt="Kamdhenu Adhesive" className="h-full w-full object-contain" src={newLogo} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-[0.01em] text-foreground">Kamdhenu Adhesive</p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Inventory Management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarNav({ onNavigate, onLogout }: { onNavigate?: () => void; onLogout: () => void }) {
  const location = useLocation();

  return (
    <div className="mt-4 flex h-full min-h-0 flex-col">
      <div className="mb-4 px-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Workspace
        </p>
      </div>
      <nav className="flex h-full min-h-0 flex-col gap-1.5">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path;

          return (
            <Link
              className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${active
                ? "bg-slate-100 text-foreground"
                : "text-muted-foreground hover:bg-white hover:text-foreground"
                }`}
              key={label}
              onClick={onNavigate}
              to={path}
            >
              <span
                className={`absolute left-0 top-2 bottom-2 w-1 rounded-full transition-opacity ${active ? "bg-primary opacity-100" : "opacity-0 group-hover:opacity-100 bg-slate-300"}`}
              />
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors ${active
                  ? "bg-white text-primary shadow-sm"
                  : "bg-slate-100 text-muted-foreground group-hover:bg-slate-50 group-hover:text-foreground"
                  }`}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate">{label}</p>
              </div>
            </Link>
          );
        })}


        <div className="mt-auto pt-5">
          <div className="border-t border-slate-200/80 px-2 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Account
            </p>
            <Button
              className="mt-3 h-11 w-full justify-start gap-3 rounded-xl bg-white"
              onClick={onLogout}
              type="button"
              variant="outline"
            >
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
}

function AppShellLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  );
  const isPurchasePage = location.pathname === "/purchase-entry";
  const isReportsPage = location.pathname === "/reports";
  const isPurchaseEntriesPage = location.pathname === "/purchase-entries";
  const isInventoryEntriesPage = location.pathname === "/inventory-entries";
  const isProductionMaterialLogsPage = location.pathname === "/production-material-logs";
  const isManufacturingPage = location.pathname === "/manufacturing-entry";
  const isManufacturingEntriesPage = location.pathname === "/manufacturing-entries";
  const isDeparturePage = location.pathname === "/product-departure";
  const isDispatchEntriesPage = location.pathname === "/dispatch-entries";
  const pageTitle = isPurchasePage
    ? "Purchase Entry"
    : isReportsPage
      ? "Reports"
    : isPurchaseEntriesPage
      ? "Purchase Entries"
      : isInventoryEntriesPage
        ? "Inventory Entries"
        : isProductionMaterialLogsPage
          ? "Production Material Logs"
      : isManufacturingPage
        ? "Production Entry"
        : isManufacturingEntriesPage
          ? "Production Entries"
          : isDeparturePage
            ? "Product Dispatch"
            : isDispatchEntriesPage
              ? "Dispatch Entries"
              : "Dashboard";

  const handleLogout = () => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem("userName");
    window.sessionStorage.clear();
    setMobileSidebarOpen(false);
    toast.success("Logout Successful");
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const updateCurrentTime = () =>
      setCurrentTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );

    updateCurrentTime();
    const intervalId = window.setInterval(updateCurrentTime, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.12),_transparent_28rem),linear-gradient(180deg,_#f8fafc_0%,_#eef4f5_100%)]">
      <div className="flex w-full items-start gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <aside className="hidden w-[290px] shrink-0 rounded-[1.5rem] border border-white/70 bg-white/85 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur lg:sticky lg:top-5 lg:flex lg:h-[calc(100vh-2.5rem)] lg:flex-col">
          <Brand />
          <SidebarNav onLogout={handleLogout} />
        </aside>

        <div
          className={`fixed inset-0 z-50 transition-opacity duration-300 ease-out lg:hidden ${mobileSidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
        >
          <button
            aria-label="Close sidebar"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => setMobileSidebarOpen(false)}
            type="button"
          />
          <aside
            className={`relative h-full w-72 max-w-[85vw] border-r border-white/70 bg-white/95 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.12)] backdrop-blur transition-transform duration-300 ease-out ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`}
          >
            <div className="flex items-start justify-between gap-3">
              <Brand className="min-w-0 flex-1" />
              <Button
                aria-label="Close sidebar"
                className="mt-1 shrink-0"
                onClick={() => setMobileSidebarOpen(false)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X />
              </Button>
            </div>

            <hr className="mt-4 border-muted" />
            <SidebarNav onNavigate={() => setMobileSidebarOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>

        <section className="min-w-0 flex-1">
          <header className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Button
                aria-label="Open sidebar"
                className="mt-1 lg:hidden"
                onClick={() => setMobileSidebarOpen(true)}
                size="icon"
                type="button"
                variant="outline"
              >
                <Menu />
              </Button>
              <div>
                <h1 className="mt-1 text-3xl font-bold tracking-normal text-foreground">{pageTitle}</h1>
              </div>
            </div>
            <div className="inline-flex items-center rounded-xl border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-foreground shadow-sm backdrop-blur">
              {currentTime}
            </div>
          </header>
          <Outlet />
        </section>
      </div>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
    <ScrollToTop />
      <Routes>
        <Route element={<PublicRoute />}>
          <Route element={<LoginPage />} path="/login" />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route element={<AppShellLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/inventory-entries" element={<InventoryEntriesPage />} />
            <Route path="/production-material-logs" element={<ProductionMaterialLogsPage />} />
            <Route path="/purchase-entry" element={<PurchaseEntryForm />} />
            <Route path="/purchase-entries" element={<PurchaseEntriesPage />} />
            <Route path="/manufacturing-entry" element={<ManufacturingEntryForm />} />
            <Route path="/manufacturing-entries" element={<ManufacturingEntriesPage />} />
            <Route path="/product-departure" element={<ProductDepartureForm />} />
            <Route path="/dispatch-entries" element={<DispatchEntriesPage />} />
            <Route path="/orders" element={<PlaceholderPage title="Orders" />} />
            <Route path="/suppliers" element={<PlaceholderPage title="Suppliers" />} />
            <Route path="/sheets" element={<PlaceholderPage title="Sheets" />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
