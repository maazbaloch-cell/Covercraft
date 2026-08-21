"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, animate, useMotionValue, useReducedMotion } from "framer-motion";
import Skeleton from "@/components/Skeleton";
import Spinner from "@/components/Spinner";
import SupportManagement from "@/components/SupportManagement";
import { DUR, EASE_OUT_EXPO, fadeInUp, scaleIn, staggerGrid, viewportOnce } from "@/lib/motion";

const STATUS_OPTIONS = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

/** Count-up number for dashboard stats; snaps instantly under reduced motion. */
function AnimatedNumber({ value, prefix = "", format = (n: number) => Math.round(n).toLocaleString() }: { value: number; prefix?: string; format?: (n: number) => string }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (reduce) { setDisplay(value); return; }
    const controls = animate(mv, value, { duration: 0.6, ease: EASE_OUT_EXPO, onUpdate: (v) => setDisplay(v) });
    return () => controls.stop();
  }, [value, mv, reduce]);
  return <>{prefix}{format(display)}</>;
}

/** Tailwind palette for an order-status badge; colour transitions smoothly on change. */
const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-sky-100 text-sky-700",
  PROCESSING: "bg-cyan-100 text-cyan-700",
  SHIPPED: "bg-teal-100 text-teal-700",
  OUT_FOR_DELIVERY: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-rose-100 text-rose-700",
};

type TemplateFormState = {
  id: number;
  title: string;
  brand: string;
  model: string;
  category: string;
  price: string;
  stock: string;
  isAvailable: boolean;
  description: string;
  imageUrl: string;
  image: File | null;
};

const createTemplateForm = (): TemplateFormState => ({
  id: Date.now() + Math.random(),
  title: "",
  brand: "",
  model: "",
  category: "",
  price: "199900",
  stock: "10",
  isAvailable: true,
  description: "",
  imageUrl: "",
  image: null,
});

/* ------------------------------------------------------------------ *
 * Duxen-inspired admin shell — presentational primitives. These are
 * pure UI (icons, nav, section chrome); all data + mutations stay in
 * the AdminDashboard component below, untouched.
 * ------------------------------------------------------------------ */

type ViewId = "overview" | "products" | "catalog" | "orders" | "analytics" | "support";

/** Compact line icons, sized to font via `em`; inherit currentColor. */
function Icon({ name, className = "h-[1.15rem] w-[1.15rem]" }: { name: string; className?: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, React.ReactNode> = {
    overview: <><rect x="3" y="3" width="7" height="9" rx="1.5" {...p} /><rect x="14" y="3" width="7" height="5" rx="1.5" {...p} /><rect x="14" y="12" width="7" height="9" rx="1.5" {...p} /><rect x="3" y="16" width="7" height="5" rx="1.5" {...p} /></>,
    products: <><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" {...p} /><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" {...p} /></>,
    catalog: <><rect x="5" y="2.5" width="14" height="19" rx="2.5" {...p} /><path d="M10 18.5h4" {...p} /></>,
    orders: <><path d="M6 2.5h9l3.5 3.5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z" {...p} /><path d="M14 2.5V6h3.5M8.5 12h7M8.5 16h7" {...p} /></>,
    analytics: <><path d="M4 20V4M4 20h16" {...p} /><path d="M8 17l3.5-4 3 2.5L20 8" {...p} /></>,
    support: <><path d="M4 12a8 8 0 1 1 16 0v5a2 2 0 0 1-2 2h-2v-7h4M4 12v5a2 2 0 0 0 2 2h2v-7H4" {...p} /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" {...p} /></>,
    refresh: <><path d="M20 11a8 8 0 1 0-.7 4M20 4v5h-5" {...p} /></>,
    store: <><path d="M4 9V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M4 9l1.5 11a1 1 0 0 0 1 .9h11a1 1 0 0 0 1-.9L21 9M4 9h17M9 13h6" {...p} /></>,
    plus: <><path d="M12 5v14M5 12h14" {...p} /></>,
    search: <><circle cx="11" cy="11" r="7" {...p} /><path d="m20 20-3.5-3.5" {...p} /></>,
    close: <><path d="M6 6l12 12M18 6 6 18" {...p} /></>,
    trash: <><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" {...p} /></>,
    box: <><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" {...p} /><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" {...p} /></>,
    cash: <><rect x="2.5" y="6" width="19" height="12" rx="2" {...p} /><circle cx="12" cy="12" r="2.5" {...p} /></>,
    clock: <><circle cx="12" cy="12" r="8.5" {...p} /><path d="M12 7.5V12l3 1.8" {...p} /></>,
  };
  return <svg viewBox="0 0 24 24" className={className} aria-hidden>{paths[name]}</svg>;
}

const NAV: { id: ViewId; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "overview" },
  { id: "products", label: "Shop Products", icon: "products" },
  { id: "catalog", label: "Custom Catalog", icon: "catalog" },
  { id: "orders", label: "Orders", icon: "orders" },
  { id: "analytics", label: "Analytics", icon: "analytics" },
  { id: "support", label: "Support", icon: "support" },
];

const VIEW_TITLE: Record<ViewId, string> = {
  overview: "Dashboard Overview",
  products: "Shop Products",
  catalog: "Custom Cover Catalog",
  orders: "Orders",
  analytics: "Analytics & Reports",
  support: "Support Management",
};

/** Sidebar nav button — active state uses the brand accent. */
function NavButton({ item, active, collapsed, onClick, badge }: { item: { id: ViewId; label: string; icon: string }; active: boolean; collapsed: boolean; onClick: () => void; badge?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${collapsed ? "justify-center" : ""} ${active ? "bg-accent-600/15 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"}`}
    >
      {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent-500" />}
      <Icon name={item.icon} className={`h-[1.15rem] w-[1.15rem] shrink-0 ${active ? "text-accent-300" : ""}`} />
      {!collapsed && <span className="flex-1 truncate text-left font-medium">{item.label}</span>}
      {!collapsed && badge != null && badge > 0 && (
        <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[0.65rem] font-bold text-slate-200">{badge}</span>
      )}
    </button>
  );
}

/** Section heading used at the top of each view's content blocks. */
function Panel({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="admin-surface overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

/** Real-data KPI tile. */
function Kpi({ label, icon, children, tone = "accent" }: { label: string; icon: string; children: React.ReactNode; tone?: "accent" | "emerald" | "amber" | "sky" }) {
  const tones: Record<string, string> = {
    accent: "text-accent-300 bg-accent-600/15",
    emerald: "text-emerald-300 bg-emerald-500/15",
    amber: "text-amber-300 bg-amber-500/15",
    sky: "text-sky-300 bg-sky-500/15",
  };
  return (
    <motion.div variants={scaleIn} className="admin-card flex items-center gap-4 p-4">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}><Icon name={icon} /></span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-white sm:text-2xl">{children}</p>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [locationInput, setLocationInput] = useState<Record<string, string>>({});
  const [shipmentInput, setShipmentInput] = useState<Record<string, { courier: string; trackingNumber: string }>>({});
  const [catalog, setCatalog] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [modelForm, setModelForm] = useState({ name: "", brand: "" });
  const [templateCatForm, setTemplateCatForm] = useState({ mobileModelId: "", name: "", price: "1999", imageUrl: "" });
  const [templateForms, setTemplateForms] = useState<TemplateFormState[]>([createTemplateForm()]);
  const [report, setReport] = useState<any>(null);
  const [reportRange, setReportRange] = useState({ start: "", end: "" });
  const [emailingReport, setEmailingReport] = useState(false);
  const [reportNote, setReportNote] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [loadError, setLoadError] = useState("");

  // UI-only shell state (no backend impact)
  const [view, setView] = useState<ViewId>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [orderQuery, setOrderQuery] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/orders", { credentials: "include" });
    if (res.status === 401) {
      window.location.href = "/admin";
      return;
    }
    if (res.ok) setData(await res.json());
    else setLoadError("Dashboard data could not be loaded. Please refresh the page.");
  };
  const loadCatalog = async () => {
    const res = await fetch("/api/admin/custom-cover", { credentials: "include" });
    if (res.status === 401) {
      window.location.href = "/admin";
      return;
    }
    if (res.ok) {
      const body = await res.json();
      setCatalog(body.models);
    }
  };
  const loadProducts = async () => {
    const res = await fetch("/api/admin/products", { credentials: "include" });
    if (res.ok) {
      const body = await res.json();
      setProducts(body.products || []);
    }
  };
  const loadReport = async () => {
    const params = new URLSearchParams();
    if (reportRange.start) params.set("start", reportRange.start);
    if (reportRange.end) params.set("end", reportRange.end);
    const res = await fetch(`/api/admin/reports?${params.toString()}`, { credentials: "include" });
    if (res.ok) {
      setReport(await res.json());
    }
  };
  const emailReport = async () => {
    setEmailingReport(true);
    setReportNote("");
    try {
      const res = await fetch("/api/admin/reports/email", { method: "POST", credentials: "include" });
      setReportNote(res.ok ? "Monthly report emailed to the store owner." : "Could not send the report right now.");
    } catch {
      setReportNote("Could not send the report right now.");
    } finally {
      setEmailingReport(false);
    }
  };

  useEffect(() => {
    const ensureAuth = async () => {
      try {
        const res = await fetch("/api/admin/orders", { credentials: "include" });
        if (res.status === 401) { router.replace("/admin"); return; }
        if (!res.ok) { setLoadError("Dashboard data could not be loaded. Please refresh the page."); return; }
        load();
        loadCatalog();
        loadProducts();
        loadReport();
      } catch { setLoadError("Dashboard data could not be loaded. Please refresh the page."); }
    };

    ensureAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- authenticate and load dashboard data once on mount
  }, [router]);

  const addModel = async (event: React.FormEvent) => { event.preventDefault(); const res = await fetch("/api/admin/custom-cover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "model", ...modelForm }), credentials: "include" }); if (res.ok) { setModelForm({ name: "", brand: "" }); loadCatalog(); } };
  const addTemplate = async (event: React.FormEvent) => { event.preventDefault(); const price = Math.round(Number(templateCatForm.price) * 100); if (!templateCatForm.mobileModelId || !templateCatForm.name.trim() || !(price > 0)) return; const res = await fetch("/api/admin/custom-cover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "template", name: templateCatForm.name.trim(), mobileModelId: templateCatForm.mobileModelId, price, imageUrl: templateCatForm.imageUrl.trim() || undefined }), credentials: "include" }); if (res.ok) { setTemplateCatForm({ mobileModelId: "", name: "", price: "1999", imageUrl: "" }); loadCatalog(); } };
  const updateTemplateForm = (formId: number, updates: Partial<TemplateFormState>) => {
    setTemplateForms((prev) => prev.map((form) => (form.id === formId ? { ...form, ...updates } : form)));
  };
  const addTemplateForm = () => {
    setSaveMessage("");
    setSaveError("");
    setTemplateForms((prev) => [...prev, createTemplateForm()]);
  };
  const saveTemplate = async (formId: number) => {
    const templateForm = templateForms.find((item) => item.id === formId);
    if (!templateForm) return;

    setSaveMessage("");
    setSaveError("");

    const formData = new FormData();
    formData.set("title", templateForm.title);
    formData.set("brand", templateForm.brand);
    formData.set("model", templateForm.model);
    formData.set("category", templateForm.category);
    formData.set("description", templateForm.description);
    formData.set("price", String(Number(templateForm.price) * 100));
    formData.set("stock", String(templateForm.stock));
    formData.set("isAvailable", String(templateForm.isAvailable));
    if (templateForm.image) formData.set("image", templateForm.image);

    const res = await fetch("/api/admin/products", { method: "POST", body: formData, credentials: "include" });

    if (res.ok) {
      setSaveMessage(`Saved ${templateForm.title || "template"} to the shop.`);
      setTemplateForms((prev) => prev.filter((item) => item.id !== formId));
      setTemplateForms((prev) => [...prev, createTemplateForm()]);
      loadProducts();
    } else {
      const body = await res.json().catch(() => ({}));
      setSaveError(body.error || "Template could not be saved right now.");
    }
  };
  const deleteProduct = async (id: string) => {
    if (!window.confirm("Remove this template from the shop?")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) loadProducts();
  };
  const removeCatalogItem = async (type: "model" | "template", id: string) => { if (!window.confirm("Remove this item? Existing custom designs will remain, but this item will no longer be selectable.")) return; await fetch(`/api/admin/custom-cover?type=${type}&id=${id}`, { method: "DELETE", credentials: "include" }); loadCatalog(); };

  const updateStatus = async (orderId: string, status: string) => {
    await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, location: locationInput[orderId] || undefined }),
      credentials: "include",
    });
    load();
  };
  const saveShipment = async (orderId: string) => {
    const shipment = shipmentInput[orderId];
    if (!shipment?.courier || !shipment.trackingNumber) return;
    const res = await fetch(`/api/admin/orders/${orderId}/shipment`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(shipment), credentials: "include" });
    if (res.ok) load();
  };

  const refreshAll = () => { load(); loadCatalog(); loadProducts(); loadReport(); };

  const go = (id: ViewId) => { setView(id); setMobileNav(false); };

  /* --------------------------------------------------------- loading / error */
  if (!data) {
    if (loadError) {
      return (
        <div className="admin-dashboard min-h-screen w-full">
          <div className="mx-auto max-w-md px-6 py-24 text-center">
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-300">{loadError}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="admin-dashboard min-h-screen w-full">
        <div className="flex">
          <aside className="hidden w-64 shrink-0 self-start border-r border-white/10 p-4 lg:block" style={{ position: "sticky", top: 57, height: "calc(100vh - 57px)" }}>
            <Skeleton className="h-8 w-40" />
            <div className="mt-6 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          </aside>
          <div className="min-w-0 flex-1 p-4 sm:p-6">
            <Skeleton className="h-9 w-56" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
            <div className="mt-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = report?.pendingOrders ?? data.orders.filter((o: any) => o.status === "PENDING").length;
  const q = orderQuery.trim().toLowerCase();
  const filteredOrders = q
    ? data.orders.filter((o: any) => [o.orderNumber, o.customerName, o.customerEmail, o.customerPhone, o.city].some((f: any) => String(f || "").toLowerCase().includes(q)))
    : data.orders;

  /* --------------------------------------------------------------- shell */
  return (
    <div className="admin-dashboard min-h-screen w-full">
      <div className="flex">
        {/* ---------------------------------------------------- Sidebar (desktop) */}
        <aside
          className={`hidden shrink-0 self-start border-r border-white/10 transition-[width] duration-200 lg:flex lg:flex-col ${collapsed ? "w-[68px]" : "w-64"}`}
          style={{ position: "sticky", top: 57, height: "calc(100vh - 57px)" }}
        >
          <div className={`flex items-center gap-2.5 px-4 py-4 ${collapsed ? "justify-center px-0" : ""}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 text-sm font-black text-white shadow-glow-sm">C</span>
            {!collapsed && (
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-bold text-white">Cover Craft</p>
                <p className="truncate text-[0.68rem] text-slate-400">Admin Console</p>
              </div>
            )}
          </div>
          {!collapsed && <p className="px-5 pb-1 pt-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-slate-500">Manage</p>}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-1">
            {NAV.map((item) => (
              <NavButton key={item.id} item={item} active={view === item.id} collapsed={collapsed} onClick={() => go(item.id)} badge={item.id === "orders" ? data.totalOrders : item.id === "support" ? undefined : undefined} />
            ))}
          </nav>
          <div className="border-t border-white/10 p-3">
            <a href="/" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-100 ${collapsed ? "justify-center" : ""}`} title="View storefront">
              <Icon name="store" className="h-[1.15rem] w-[1.15rem] shrink-0" />
              {!collapsed && <span>View store</span>}
            </a>
          </div>
        </aside>

        {/* ---------------------------------------------------- Sidebar (mobile drawer) */}
        <AnimatePresence>
          {mobileNav && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: DUR.micro }} onClick={() => setMobileNav(false)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" />
              <motion.aside
                initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }}
                className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-ink-900 lg:hidden"
              >
                <div className="flex items-center justify-between px-4 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 text-sm font-black text-white">C</span>
                    <div className="leading-tight"><p className="text-sm font-bold text-white">Cover Craft</p><p className="text-[0.68rem] text-slate-400">Admin Console</p></div>
                  </div>
                  <button type="button" onClick={() => setMobileNav(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Close menu"><Icon name="close" /></button>
                </div>
                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
                  {NAV.map((item) => (
                    <NavButton key={item.id} item={item} active={view === item.id} collapsed={false} onClick={() => go(item.id)} />
                  ))}
                </nav>
                <div className="border-t border-white/10 p-3">
                  <a href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-100"><Icon name="store" className="h-[1.15rem] w-[1.15rem]" /> View store</a>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ---------------------------------------------------- Main column */}
        <div className="min-w-0 flex-1">
          {/* Header / toolbar */}
          <header className="sticky z-30 flex items-center gap-3 border-b border-white/10 bg-ink-950/70 px-3 py-3 backdrop-blur-xl sm:px-5" style={{ top: 57 }}>
            <button type="button" onClick={() => setMobileNav(true)} className="rounded-lg p-2 text-slate-300 hover:bg-white/5 hover:text-white lg:hidden" aria-label="Open menu"><Icon name="menu" /></button>
            <button type="button" onClick={() => setCollapsed((c) => !c)} className="hidden rounded-lg p-2 text-slate-300 hover:bg-white/5 hover:text-white lg:block" aria-label="Toggle sidebar"><Icon name="menu" /></button>
            <div className="min-w-0 flex-1">
              <p className="hidden text-[0.68rem] text-slate-500 sm:block">Admin <span className="text-slate-600">/</span> {VIEW_TITLE[view]}</p>
              <h1 className="truncate text-base font-bold text-white sm:text-lg">{VIEW_TITLE[view]}</h1>
            </div>
            <button type="button" onClick={refreshAll} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-accent-500/50 hover:text-white">
              <Icon name="refresh" className="h-4 w-4" /><span className="hidden sm:inline">Refresh</span>
            </button>
            <span className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 py-1 pl-1 pr-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-accent-400 to-accent-600 text-xs font-bold text-white">A</span>
              <span className="hidden text-xs font-semibold text-slate-200 sm:inline">Store Owner</span>
            </span>
          </header>

          {/* Content */}
          <div className="p-3 sm:p-5 lg:p-6">
            <AnimatePresence mode="wait">
              <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }}>

                {/* ============================================= OVERVIEW */}
                {view === "overview" && (
                  <div className="space-y-5">
                    <motion.div variants={staggerGrid} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <Kpi label="Total Sales" icon="cash" tone="emerald"><AnimatedNumber value={data.totalSales / 100} prefix="Rs. " /></Kpi>
                      <Kpi label="Total Orders" icon="orders" tone="accent"><AnimatedNumber value={data.totalOrders} /></Kpi>
                      <Kpi label="Products Sold" icon="box" tone="sky"><AnimatedNumber value={report?.totalProductsSold ?? 0} /></Kpi>
                      <Kpi label="Pending Orders" icon="clock" tone="amber"><AnimatedNumber value={pendingCount} /></Kpi>
                    </motion.div>

                    <div className="grid gap-5 xl:grid-cols-3">
                      <div className="xl:col-span-2">
                        <Panel title="Recent Orders" subtitle="Latest activity across the store" action={<button type="button" onClick={() => go("orders")} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-accent-500/50 hover:text-white">View all</button>}>
                          {data.orders.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">No orders yet.</p>
                          ) : (
                            <div className="-mx-1 overflow-x-auto">
                              <table className="w-full min-w-[520px] border-collapse text-sm">
                                <thead>
                                  <tr className="text-left text-[0.68rem] uppercase tracking-wide text-slate-500">
                                    <th className="px-2 py-2 font-semibold">Order</th>
                                    <th className="px-2 py-2 font-semibold">Customer</th>
                                    <th className="px-2 py-2 font-semibold">Total</th>
                                    <th className="px-2 py-2 font-semibold">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {data.orders.slice(0, 6).map((o: any) => (
                                    <tr key={o.id} className="border-t border-white/10">
                                      <td className="px-2 py-2.5 font-mono text-xs text-slate-300">{o.orderNumber}</td>
                                      <td className="px-2 py-2.5"><span className="block max-w-[160px] truncate text-slate-100">{o.customerName}</span><span className="block max-w-[160px] truncate text-xs text-slate-500">{o.city}</span></td>
                                      <td className="px-2 py-2.5 font-semibold text-white">Rs. {(o.totalAmount / 100).toFixed(0)}</td>
                                      <td className="px-2 py-2.5"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${STATUS_BADGE[o.status] || "bg-slate-100 text-slate-600"}`}>{o.status.replace(/_/g, " ")}</span></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </Panel>
                      </div>

                      <div className="space-y-5">
                        <Panel title="Catalog Snapshot">
                          <ul className="space-y-3 text-sm">
                            <li className="flex items-center justify-between"><span className="text-slate-400">Shop products</span><span className="font-bold text-white">{products.length}</span></li>
                            <li className="flex items-center justify-between"><span className="text-slate-400">Phone models</span><span className="font-bold text-white">{catalog.length}</span></li>
                            <li className="flex items-center justify-between"><span className="text-slate-400">Cover templates</span><span className="font-bold text-white">{catalog.reduce((n: number, m: any) => n + (m.templates?.length || 0), 0)}</span></li>
                          </ul>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button type="button" onClick={() => go("products")} className="rounded-lg bg-accent-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-500">Manage products</button>
                            <button type="button" onClick={() => go("catalog")} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-accent-500/50 hover:text-white">Edit catalog</button>
                          </div>
                        </Panel>
                        <Panel title="Order Health">
                          <ul className="space-y-3 text-sm">
                            <li className="flex items-center justify-between"><span className="text-slate-400">Completed</span><span className="font-bold text-emerald-300">{report?.completedOrders ?? 0}</span></li>
                            <li className="flex items-center justify-between"><span className="text-slate-400">Pending</span><span className="font-bold text-amber-300">{pendingCount}</span></li>
                            <li className="flex items-center justify-between"><span className="text-slate-400">Cancelled</span><span className="font-bold text-rose-300">{report?.cancelledOrders ?? 0}</span></li>
                          </ul>
                        </Panel>
                      </div>
                    </div>
                  </div>
                )}

                {/* ============================================= SHOP PRODUCTS */}
                {view === "products" && (
                  <div className="space-y-5">
                    <AnimatePresence initial={false}>
                      {saveMessage && <motion.p key="save-msg" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }} className="overflow-hidden rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">{saveMessage}</motion.p>}
                      {saveError && <motion.p key="save-err" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }} className="overflow-hidden rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">{saveError}</motion.p>}
                    </AnimatePresence>

                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                      <Panel title="Add New Cover" subtitle="Publish a ready-made cover to the shop" action={<button type="button" onClick={addTemplateForm} className="inline-flex items-center gap-1.5 rounded-lg border border-accent-500/50 bg-accent-600/10 px-3 py-1.5 text-xs font-semibold text-accent-300 transition-colors hover:bg-accent-600 hover:text-white"><Icon name="plus" className="h-3.5 w-3.5" />Another</button>}>
                        <div className="space-y-4">
                          {templateForms.map((templateForm) => (
                            <form key={templateForm.id} onSubmit={(event) => { event.preventDefault(); void saveTemplate(templateForm.id); }} className="space-y-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                              <div className="grid gap-2.5 sm:grid-cols-2">
                                <input required placeholder="Cover title" value={templateForm.title} onChange={(e) => updateTemplateForm(templateForm.id, { title: e.target.value })} className="w-full border px-3 py-2 text-sm" />
                                <input required placeholder="Brand" value={templateForm.brand} onChange={(e) => updateTemplateForm(templateForm.id, { brand: e.target.value })} className="w-full border px-3 py-2 text-sm" />
                                <input required placeholder="Model" value={templateForm.model} onChange={(e) => updateTemplateForm(templateForm.id, { model: e.target.value })} className="w-full border px-3 py-2 text-sm" />
                                <input placeholder="Category" value={templateForm.category} onChange={(e) => updateTemplateForm(templateForm.id, { category: e.target.value })} className="w-full border px-3 py-2 text-sm" />
                              </div>
                              <input placeholder="Description" value={templateForm.description} onChange={(e) => updateTemplateForm(templateForm.id, { description: e.target.value })} className="w-full border px-3 py-2 text-sm" />
                              <div className="grid gap-2.5 sm:grid-cols-2">
                                <input required type="number" min="1" placeholder="Price in rupees" value={templateForm.price} onChange={(e) => updateTemplateForm(templateForm.id, { price: e.target.value })} className="w-full border px-3 py-2 text-sm" />
                                <input required type="number" min="0" placeholder="Stock" value={templateForm.stock} onChange={(e) => updateTemplateForm(templateForm.id, { stock: e.target.value })} className="w-full border px-3 py-2 text-sm" />
                              </div>
                              <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={templateForm.isAvailable} onChange={(e) => updateTemplateForm(templateForm.id, { isAvailable: e.target.checked })} />Available in shop</label>
                              <input type="file" accept="image/*" onChange={(e) => updateTemplateForm(templateForm.id, { image: e.target.files?.[0] || null })} className="w-full border px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-xs file:text-slate-200" />
                              <button type="submit" className="bg-brand w-full rounded px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-accent">Save cover</button>
                            </form>
                          ))}
                        </div>
                      </Panel>

                      <Panel title="Live Products" subtitle={`${products.length} in the shop`}>
                        {products.length === 0 ? (
                          <p className="rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">No products yet. Add your first cover on the left.</p>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {products.map((product: any) => (
                              <motion.div key={product.id} whileHover={{ y: -2 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} className="admin-card flex flex-col gap-2 p-3.5">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="min-w-0 flex-1 truncate font-semibold text-white">{product.title}</p>
                                  <button type="button" onClick={() => deleteProduct(product.id)} className="shrink-0 rounded-md p-1 text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400" aria-label="Remove product"><Icon name="trash" className="h-4 w-4" /></button>
                                </div>
                                <p className="text-xs text-slate-400">{product.brand} · {product.model}{product.category ? ` · ${product.category}` : ""}</p>
                                <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                                  <span className="font-bold text-white">Rs. {(product.price / 100).toFixed(0)}</span>
                                  <span className="text-xs text-slate-500">Stock {product.stock}</span>
                                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${product.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{product.isAvailable ? "Available" : "Hidden"}</span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </Panel>
                    </div>
                  </div>
                )}

                {/* ============================================= CUSTOM CATALOG */}
                {view === "catalog" && (
                  <div className="space-y-5">
                    <p className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">Phone models and cover templates customers personalise at <span className="font-semibold text-slate-200">/customize-cover</span>. Without at least one model — and a template on it — the customiser has nothing to show.</p>

                    <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
                      <div className="space-y-5">
                        <Panel title="Add Phone Model">
                          <form onSubmit={addModel} className="space-y-2.5">
                            <input required placeholder="Model name (e.g. iPhone 15 Pro)" value={modelForm.name} onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })} className="w-full border px-3 py-2 text-sm" />
                            <input required placeholder="Brand (e.g. Apple)" value={modelForm.brand} onChange={(e) => setModelForm({ ...modelForm, brand: e.target.value })} className="w-full border px-3 py-2 text-sm" />
                            <button type="submit" className="bg-brand w-full rounded px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-accent">Add model</button>
                          </form>
                        </Panel>
                        <Panel title="Add Cover Template">
                          <form onSubmit={addTemplate} className="space-y-2.5">
                            <select required value={templateCatForm.mobileModelId} onChange={(e) => setTemplateCatForm({ ...templateCatForm, mobileModelId: e.target.value })} className="w-full border px-3 py-2 text-sm">
                              <option value="">Select phone model…</option>
                              {catalog.map((m: any) => (<option key={m.id} value={m.id}>{m.brand} · {m.name}</option>))}
                            </select>
                            <input required placeholder="Template name" value={templateCatForm.name} onChange={(e) => setTemplateCatForm({ ...templateCatForm, name: e.target.value })} className="w-full border px-3 py-2 text-sm" />
                            <input required type="number" min="1" placeholder="Price in rupees" value={templateCatForm.price} onChange={(e) => setTemplateCatForm({ ...templateCatForm, price: e.target.value })} className="w-full border px-3 py-2 text-sm" />
                            <input placeholder="Image URL (optional)" value={templateCatForm.imageUrl} onChange={(e) => setTemplateCatForm({ ...templateCatForm, imageUrl: e.target.value })} className="w-full border px-3 py-2 text-sm" />
                            <button type="submit" disabled={catalog.length === 0} className="bg-brand w-full rounded px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-accent disabled:opacity-50">Add template</button>
                            {catalog.length === 0 && <p className="text-xs text-slate-500">Add a phone model first.</p>}
                          </form>
                        </Panel>
                      </div>

                      <Panel title="Models & Templates" subtitle={`${catalog.length} model${catalog.length === 1 ? "" : "s"}`}>
                        {catalog.length === 0 ? (
                          <p className="rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">No phone models yet. Add one so customers can start customising.</p>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {catalog.map((m: any) => (
                              <motion.div key={m.id} whileHover={{ y: -2 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} className="admin-card flex flex-col p-3.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate font-semibold text-white">{m.name}</p>
                                    <p className="truncate text-xs text-slate-400">{m.brand}</p>
                                  </div>
                                  <button type="button" onClick={() => removeCatalogItem("model", m.id)} className="shrink-0 rounded-md p-1 text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400" aria-label="Remove model"><Icon name="trash" className="h-4 w-4" /></button>
                                </div>
                                <div className="mt-3 border-t border-white/10 pt-2.5">
                                  {m.templates?.length ? (
                                    <ul className="space-y-1.5">
                                      {m.templates.map((t: any) => (
                                        <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                                          <span className="min-w-0 flex-1 truncate text-slate-300">{t.name}</span>
                                          <span className="shrink-0 text-xs font-semibold text-slate-200">Rs. {(t.price / 100).toFixed(0)}</span>
                                          <button type="button" onClick={() => removeCatalogItem("template", t.id)} className="shrink-0 rounded p-0.5 text-slate-500 transition-colors hover:text-rose-400" aria-label="Remove template"><Icon name="close" className="h-3.5 w-3.5" /></button>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-xs text-slate-500">No templates yet.</p>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </Panel>
                    </div>
                  </div>
                )}

                {/* ============================================= ORDERS */}
                {view === "orders" && (
                  <div className="space-y-4">
                    <div className="admin-surface flex flex-wrap items-center gap-3 px-4 py-3">
                      <div className="relative min-w-0 flex-1">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Icon name="search" className="h-4 w-4" /></span>
                        <input value={orderQuery} onChange={(e) => setOrderQuery(e.target.value)} placeholder="Search order #, name, email, phone, city…" className="w-full border py-2 pl-9 pr-3 text-sm" />
                      </div>
                      <span className="text-xs text-slate-400">{filteredOrders.length} of {data.orders.length}</span>
                    </div>

                    {filteredOrders.length === 0 ? (
                      <p className="admin-surface p-10 text-center text-sm text-slate-400">No orders match your search.</p>
                    ) : (
                      <motion.div variants={staggerGrid} initial="hidden" animate="show" className="space-y-3">
                        {filteredOrders.map((o: any) => (
                          <motion.div key={o.id} variants={fadeInUp} className="admin-surface p-4">
                            <div className="mb-3 flex flex-col justify-between gap-3 md:flex-row">
                              <div className="min-w-0">
                                <p className="font-semibold text-white">{o.orderNumber} — {o.customerName}</p>
                                <p className="text-sm text-slate-400">{o.customerEmail} · {o.customerPhone}</p>
                                <p className="text-sm text-slate-400">{o.shippingAddress}, {o.city}</p>
                              </div>
                              <div className="text-left md:text-right">
                                <p className="text-lg font-bold text-white">Rs. {(o.totalAmount / 100).toFixed(0)}</p>
                                <div className="mt-1 flex flex-wrap gap-1.5 md:justify-end">
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold transition-colors duration-300 ${o.paymentStatus === "PAID" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-600"}`}>{o.paymentStatus}</span>
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold transition-colors duration-300 ${STATUS_BADGE[o.status] || "bg-slate-100 text-slate-600"}`}>{o.status.replace(/_/g, " ")}</span>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">Placed {new Date(o.createdAt).toLocaleString()}</p>
                              </div>
                            </div>

                            <div className="grid gap-4 border-t border-white/10 pt-3 text-sm md:grid-cols-2">
                              <div className="space-y-1">
                                <p className="font-semibold text-slate-200">Customer</p>
                                <p className="text-slate-400">Name: {o.customerName}</p>
                                <p className="text-slate-400">Email: {o.customerEmail}</p>
                                <p className="text-slate-400">Phone: {o.customerPhone}</p>
                                <p className="text-slate-400">Address: {o.shippingAddress}</p>
                                <p className="text-slate-400">City: {o.city}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="font-semibold text-slate-200">Order</p>
                                <p className="text-slate-400">Order number: {o.orderNumber}</p>
                                <p className="text-slate-400">Items: {o.items.map((item: any) => `${item.product?.title || "Custom cover"} × ${item.quantity}`).join(", ")}</p>
                                <p className="text-slate-400">Total amount: Rs. {(o.totalAmount / 100).toFixed(0)}</p>
                                <p className="text-slate-400">Date: {new Date(o.createdAt).toLocaleString()}</p>
                              </div>
                            </div>

                            <div className="mt-3 grid gap-4 border-t border-white/10 pt-3 text-sm md:grid-cols-2">
                              <div className="space-y-1">
                                <p className="font-semibold text-slate-200">Payment</p>
                                <p className="text-slate-400">Method: {o.paymentMethod || "EasyPaisa"}</p>
                                <p className="text-slate-400">Status: {o.paymentStatus}</p>
                                <p className="text-slate-400">Reference ID: {o.paymentReference || "—"}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="font-semibold text-slate-200">Delivery</p>
                                <p className="text-slate-400">Courier: {o.courier || "Not assigned"}</p>
                                <p className="text-slate-400">CN number: {o.trackingNumber || "—"}</p>
                                <p className="text-slate-400">Order status: {o.status}</p>
                                <p className="text-slate-400">Location: {o.deliveryLocation || "—"}</p>
                                <p className="text-slate-400">Tracking notes: {o.trackingHistory?.length ? o.trackingHistory[o.trackingHistory.length - 1].note || "—" : "—"}</p>
                              </div>
                            </div>

                            {o.items.filter((item: any) => item.customDesign).map((item: any) => (
                              <div key={item.id} className="mt-3 flex flex-col items-start gap-3 border-t border-white/10 pt-3 md:flex-row">
                                {/* eslint-disable-next-line @next/next/no-img-element -- fabric.js toDataURL() produces a data: URL, which next/image cannot render */}
                                <img src={item.customDesign.previewImage} alt="Custom cover preview" loading="lazy" className="h-28 w-24 rounded border border-white/10 object-cover" />
                                <div className="space-y-1 text-sm">
                                  <p className="font-semibold text-slate-200">Custom cover: {item.customDesign.mobileModel}</p>
                                  <p className="text-slate-400">Template: {item.customDesign.templateName} · Qty {item.quantity}</p>
                                  <p className="text-slate-400">Color: {item.customDesign.selectedColorName} ({item.customDesign.colorHex})</p>
                                  <p className="text-slate-400">Font/style: {item.customDesign.textDetails?.fontFamily || "—"} / {item.customDesign.textDetails?.styleName || "—"}</p>
                                  <p className="text-slate-400">Custom text: {item.customDesign.textDetails?.text || "—"}</p>
                                  <a className="text-brand-accent" href={item.customDesign.previewImage} download={`custom-cover-${o.orderNumber}.png`}>Download preview</a>
                                  <details className="mt-1"><summary className="cursor-pointer">View design JSON</summary><pre className="mt-1 max-h-32 overflow-auto bg-gray-50 p-2 text-xs">{item.customDesign.designJson}</pre></details>
                                </div>
                              </div>
                            ))}

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <select
                                defaultValue={o.status}
                                onChange={(e) => updateStatus(o.id, e.target.value)}
                                className="border px-2 py-1 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                                ))}
                              </select>
                              <input
                                placeholder="Location (optional, for tracking)"
                                className="min-w-[180px] flex-1 border px-2 py-1 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                                value={locationInput[o.id] || ""}
                                onChange={(e) => setLocationInput({ ...locationInput, [o.id]: e.target.value })}
                              />
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                              <select value={shipmentInput[o.id]?.courier || o.courier || ""} onChange={(e) => setShipmentInput({ ...shipmentInput, [o.id]: { courier: e.target.value, trackingNumber: shipmentInput[o.id]?.trackingNumber || o.trackingNumber || "" } })} className="border px-2 py-1 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20">
                                <option value="">Select courier</option><option value="TCS">TCS</option><option value="LEOPARDS">Leopards</option>
                              </select>
                              <input placeholder="Courier consignment / tracking number" value={shipmentInput[o.id]?.trackingNumber || o.trackingNumber || ""} onChange={(e) => setShipmentInput({ ...shipmentInput, [o.id]: { courier: shipmentInput[o.id]?.courier || o.courier || "", trackingNumber: e.target.value } })} className="min-w-[220px] flex-1 border px-2 py-1 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
                              <button type="button" onClick={() => saveShipment(o.id)} className="bg-brand rounded px-3 py-1 text-sm font-semibold text-white transition-colors hover:bg-brand-accent">Save shipment</button>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ============================================= ANALYTICS */}
                {view === "analytics" && (
                  <div className="space-y-5">
                    <motion.div variants={staggerGrid} initial="hidden" whileInView="show" viewport={viewportOnce} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <Kpi label="Orders" icon="orders" tone="accent"><AnimatedNumber value={report?.totalOrders ?? 0} /></Kpi>
                      <Kpi label="Revenue" icon="cash" tone="emerald"><AnimatedNumber value={(report?.totalRevenue ?? 0) / 100} prefix="Rs. " /></Kpi>
                      <Kpi label="Products Sold" icon="box" tone="sky"><AnimatedNumber value={report?.totalProductsSold ?? 0} /></Kpi>
                      <Kpi label="Pending" icon="clock" tone="amber"><AnimatedNumber value={report?.pendingOrders ?? 0} /></Kpi>
                    </motion.div>

                    <Panel title="Reporting" subtitle="Filter by date range and email the monthly summary">
                      <div className="flex flex-wrap items-center gap-2">
                        <input type="date" value={reportRange.start} onChange={(e) => setReportRange({ ...reportRange, start: e.target.value })} className="border px-2 py-1.5 text-sm" />
                        <input type="date" value={reportRange.end} onChange={(e) => setReportRange({ ...reportRange, end: e.target.value })} className="border px-2 py-1.5 text-sm" />
                        <button type="button" onClick={() => loadReport()} className="bg-brand rounded px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-accent">Apply</button>
                        <button type="button" onClick={() => emailReport()} disabled={emailingReport} className="relative rounded border border-brand px-4 py-1.5 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-white disabled:opacity-60">
                          <span className={emailingReport ? "opacity-0" : ""}>Email monthly report</span>
                          {emailingReport && <span className="absolute inset-0 flex items-center justify-center"><Spinner /></span>}
                        </button>
                      </div>
                      <AnimatePresence initial={false}>
                        {reportNote && <motion.p key={reportNote} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }} className="mt-3 overflow-hidden text-sm text-slate-300">{reportNote}</motion.p>}
                      </AnimatePresence>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300">Completed <span className="font-bold text-emerald-300">{report?.completedOrders ?? 0}</span></span>
                        <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300">Cancelled <span className="font-bold text-rose-300">{report?.cancelledOrders ?? 0}</span></span>
                      </div>
                    </Panel>
                  </div>
                )}

                {/* ============================================= SUPPORT */}
                {view === "support" && (
                  <div className="space-y-4">
                    <SupportManagement />
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
