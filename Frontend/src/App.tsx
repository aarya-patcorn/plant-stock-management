import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Factory,
  Layers,
  LayoutDashboard,
  Container,
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
import { TooltipProvider } from "@/components/ui/tooltip";
import newLogo from "@/assets/new_logo.png";
import { AUTH_STORAGE_KEY } from "@/lib/auth";
import ScrollToTop from "./hooks/ScrollToTop";

const navSections: Array<{
  items: Array<{ icon: LucideIcon; label: string; path: string }>;
  title: string;
}> = [
  {
    title: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/" },
      { icon: BarChart3, label: "Reports", path: "/reports" },
    ],
  },
  {
    title: "Operations",
    items: [
      { icon: PackagePlus, label: "Purchase Entry", path: "/purchase-entry" },
      { icon: Factory, label: "Production", path: "/manufacturing-entry" },
      { icon: SendToBack, label: "Dispatch", path: "/product-departure" },
    ],
  },
  {
    title: "Inventory",
    items: [
      { icon: Layers, label: "Raw Material", path: "/inventory-entries" },
      { icon: Container, label: "Finish Goods", path: "/production-material-logs" },
    ],
  },
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
      <div className="border-b border-slate-200 px-1 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
            <img alt="Kamdhenu Adhesive" className="h-full w-full object-contain" src={newLogo} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-[0.01em] text-slate-950">Kamdhenu Adhesive</p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
              Plant ERP
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarNav({
  onNavigate,
  onLogout,
  userName,
}: {
  onNavigate?: () => void;
  onLogout: () => void;
  userName: string;
}) {
  const location = useLocation();

  return (
    <div className="mt-3 flex h-full min-h-0 flex-col sm:mt-4">
      <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1 sm:gap-5">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:mb-2">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map(({ icon: Icon, label, path }) => {
                const active = location.pathname === path;

                return (
                  <Link
                    className={`group relative flex w-full items-center gap-2.5 border-l-2 px-3 py-2 text-sm transition-colors sm:gap-3 sm:py-2.5 ${
                      active
                        ? "border-teal-600 bg-teal-50/80 font-semibold text-slate-950"
                        : "border-transparent font-medium text-slate-600 hover:bg-slate-100/80 hover:text-slate-950"
                    }`}
                    key={label}
                    onClick={onNavigate}
                    to={path}
                  >
                    <div
                      className={`flex size-7 shrink-0 items-center justify-center rounded-lg border transition-colors sm:size-8 ${
                        active
                          ? "border-teal-100 bg-white text-teal-700"
                          : "border-transparent bg-slate-100 text-slate-500 group-hover:border-slate-200 group-hover:bg-white group-hover:text-slate-800"
                      }`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-3 shrink-0 border-t border-slate-200 bg-[#f8fafc] pt-3 sm:mt-4 sm:pt-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Logged In</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-950">{userName}</p>
          <p className="text-[11px] text-slate-500 sm:text-xs">Plant operations workspace</p>
          <div className="mt-2 sm:mt-3">
            <Button
              className="h-9 w-full justify-start gap-3 rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-100 sm:h-10"
              onClick={onLogout}
              type="button"
              variant="outline"
            >
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppShellLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const userName = useMemo(() => window.localStorage.getItem("userName") || window.sessionStorage.getItem("userName") || "User", []);
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
          ? "Stock Material Logs"
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
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="flex min-h-screen w-full">
        <aside className="hidden h-screen w-[248px] shrink-0 border-r border-slate-200 bg-[#f8fafc] lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:flex-col">
          <div className="flex h-full min-h-0 flex-col overflow-hidden px-4 py-4">
          <Brand />
            <SidebarNav onLogout={handleLogout} userName={userName} />
          </div>
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
            className={`relative flex h-[100dvh] max-h-[100dvh] w-64 max-w-[86vw] flex-col overflow-hidden border-r border-slate-200 bg-[#f8fafc] px-3 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)] transition-transform duration-300 ease-out sm:px-4 sm:py-4 ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`}
          >
            <div className="flex shrink-0 items-start justify-between gap-3">
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
            <div className="min-h-0 flex-1 overflow-hidden">
              <SidebarNav onNavigate={() => setMobileSidebarOpen(false)} onLogout={handleLogout} userName={userName} />
            </div>
          </aside>
        </div>

        <section className="min-w-0 flex-1 lg:ml-[248px]">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-[#f5f7fb]/95 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Button
                aria-label="Open sidebar"
                className="mt-0.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-100 lg:hidden"
                onClick={() => setMobileSidebarOpen(true)}
                size="icon"
                type="button"
                variant="outline"
              >
                <Menu />
              </Button>
              <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Operations Workspace</p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{pageTitle}</h1>
              </div>
            </div>
              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              {currentTime}
              </div>
            </div>
          </header>
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </section>
      </div>
    </main>
  );
}

function App() {
  return (
    <TooltipProvider delayDuration={250}>
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
    </TooltipProvider>
  );
}

export default App;
