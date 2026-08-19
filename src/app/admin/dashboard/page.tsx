"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, animate, useMotionValue, useReducedMotion } from "framer-motion";
import Skeleton from "@/components/Skeleton";
import Spinner from "@/components/Spinner";
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

  if (!data) {
    if (loadError) return <div className="admin-dashboard mx-auto max-w-6xl px-6 py-10 text-rose-600">{loadError}</div>;
    return (
      <div className="admin-dashboard mx-auto max-w-6xl px-6 py-10">
        <Skeleton className="h-8 w-56" />
        <div className="mt-6 grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-32" />
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
          <Skeleton className="h-5 w-40" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
        </div>
        <div className="mt-8 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="mt-3 h-4 w-2/3" />
              <Skeleton className="mt-2 h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <motion.div variants={staggerGrid} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 mb-8">
        <motion.div variants={scaleIn} className="bg-white border rounded-xl p-6 transition-shadow duration-300 hover:shadow-md">
          <p className="text-sm text-gray-500">Total Sales</p>
          <p className="text-2xl font-bold"><AnimatedNumber value={data.totalSales / 100} prefix="Rs. " /></p>
        </motion.div>
        <motion.div variants={scaleIn} className="bg-white border rounded-xl p-6 transition-shadow duration-300 hover:shadow-md">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold"><AnimatedNumber value={data.totalOrders} /></p>
        </motion.div>
      </motion.div>

      <section className="mb-10 bg-white border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Shop Products</h2>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} type="button" onClick={addTemplateForm} className="rounded border border-brand px-3 py-2 text-sm text-brand transition-colors hover:bg-brand hover:text-white">Add another template</motion.button>
        </div>
        <AnimatePresence initial={false}>
          {saveMessage && <motion.p key="save-msg" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }} className="mb-3 overflow-hidden text-sm text-green-600">{saveMessage}</motion.p>}
          {saveError && <motion.p key="save-err" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }} className="mb-3 overflow-hidden text-sm text-red-600">{saveError}</motion.p>}
        </AnimatePresence>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {templateForms.map((templateForm) => (
              <form key={templateForm.id} onSubmit={(event) => { event.preventDefault(); void saveTemplate(templateForm.id); }} className="space-y-2 border rounded-lg p-3">
                <p className="text-sm font-medium">Add new cover</p>
                <input required placeholder="Cover title" value={templateForm.title} onChange={(e) => updateTemplateForm(templateForm.id, { title: e.target.value })} className="w-full border rounded px-3 py-2" />
                <input required placeholder="Brand" value={templateForm.brand} onChange={(e) => updateTemplateForm(templateForm.id, { brand: e.target.value })} className="w-full border rounded px-3 py-2" />
                <input required placeholder="Model" value={templateForm.model} onChange={(e) => updateTemplateForm(templateForm.id, { model: e.target.value })} className="w-full border rounded px-3 py-2" />
                <input placeholder="Category" value={templateForm.category} onChange={(e) => updateTemplateForm(templateForm.id, { category: e.target.value })} className="w-full border rounded px-3 py-2" />
                <input placeholder="Description" value={templateForm.description} onChange={(e) => updateTemplateForm(templateForm.id, { description: e.target.value })} className="w-full border rounded px-3 py-2" />
                <input required type="number" min="1" placeholder="Price in rupees" value={templateForm.price} onChange={(e) => updateTemplateForm(templateForm.id, { price: e.target.value })} className="w-full border rounded px-3 py-2" />
                <input required type="number" min="0" placeholder="Stock" value={templateForm.stock} onChange={(e) => updateTemplateForm(templateForm.id, { stock: e.target.value })} className="w-full border rounded px-3 py-2" />
                <label className="text-sm block"><input type="checkbox" checked={templateForm.isAvailable} onChange={(e) => updateTemplateForm(templateForm.id, { isAvailable: e.target.checked })} className="mr-2" />Available</label>
                <input type="file" accept="image/*" onChange={(e) => updateTemplateForm(templateForm.id, { image: e.target.files?.[0] || null })} className="w-full border rounded px-3 py-2" />
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} type="submit" className="bg-brand text-white rounded px-3 py-2 text-sm transition-colors hover:bg-brand-accent">Save Template</motion.button>
              </form>
            ))}
          </div>
          <div className="space-y-2">
            {products.map((product: any) => (
              <motion.div key={product.id} whileHover={{ y: -2 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} className="border rounded p-3 transition-colors duration-300 hover:border-brand/40 hover:bg-slate-50">
                <div className="flex justify-between"><p className="font-medium">{product.title}</p><motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteProduct(product.id)} className="text-xs text-red-500 transition-colors hover:text-red-700">Remove</motion.button></div>
                <p className="text-sm text-gray-500">{product.brand} · {product.model} · {product.category}</p>
                <p className="text-sm text-gray-500">Price: Rs. {(product.price / 100).toFixed(0)} · Stock: {product.stock}</p>
                <p className="text-sm text-gray-500">{product.isAvailable ? "Available" : "Unavailable"}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-10 bg-white border rounded-xl p-5">
        <h2 className="font-semibold mb-1">Custom Cover Catalog</h2>
        <p className="text-sm text-gray-500 mb-4">Phone models and cover templates customers personalise at <span className="font-medium">/customize-cover</span>. Without at least one model — and a template on it — the customiser has nothing to show.</p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <form onSubmit={addModel} className="space-y-2 border rounded-lg p-3">
              <p className="text-sm font-medium">Add phone model</p>
              <input required placeholder="Model name (e.g. iPhone 15 Pro)" value={modelForm.name} onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })} className="w-full border rounded px-3 py-2" />
              <input required placeholder="Brand (e.g. Apple)" value={modelForm.brand} onChange={(e) => setModelForm({ ...modelForm, brand: e.target.value })} className="w-full border rounded px-3 py-2" />
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} type="submit" className="bg-brand text-white rounded px-3 py-2 text-sm transition-colors hover:bg-brand-accent">Add model</motion.button>
            </form>
            <form onSubmit={addTemplate} className="space-y-2 border rounded-lg p-3">
              <p className="text-sm font-medium">Add cover template</p>
              <select required value={templateCatForm.mobileModelId} onChange={(e) => setTemplateCatForm({ ...templateCatForm, mobileModelId: e.target.value })} className="w-full border rounded px-3 py-2">
                <option value="">Select phone model…</option>
                {catalog.map((m: any) => (<option key={m.id} value={m.id}>{m.brand} · {m.name}</option>))}
              </select>
              <input required placeholder="Template name" value={templateCatForm.name} onChange={(e) => setTemplateCatForm({ ...templateCatForm, name: e.target.value })} className="w-full border rounded px-3 py-2" />
              <input required type="number" min="1" placeholder="Price in rupees" value={templateCatForm.price} onChange={(e) => setTemplateCatForm({ ...templateCatForm, price: e.target.value })} className="w-full border rounded px-3 py-2" />
              <input placeholder="Image URL (optional)" value={templateCatForm.imageUrl} onChange={(e) => setTemplateCatForm({ ...templateCatForm, imageUrl: e.target.value })} className="w-full border rounded px-3 py-2" />
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} type="submit" disabled={catalog.length === 0} className="bg-brand text-white rounded px-3 py-2 text-sm transition-colors hover:bg-brand-accent disabled:opacity-50">Add template</motion.button>
              {catalog.length === 0 && <p className="text-xs text-gray-400">Add a phone model first.</p>}
            </form>
          </div>
          <div className="space-y-2">
            {catalog.length === 0 ? (
              <p className="text-sm text-gray-500 border border-dashed rounded-lg p-6 text-center">No phone models yet. Add one so customers can start customising.</p>
            ) : (
              catalog.map((m: any) => (
                <motion.div key={m.id} whileHover={{ y: -2 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} className="border rounded p-3 transition-colors duration-300 hover:border-brand/40 hover:bg-slate-50">
                  <div className="flex justify-between items-start">
                    <p className="font-medium">{m.brand} · {m.name}</p>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeCatalogItem("model", m.id)} className="text-xs text-red-500 transition-colors hover:text-red-700">Remove model</motion.button>
                  </div>
                  {m.templates?.length ? (
                    <ul className="mt-2 space-y-1">
                      {m.templates.map((t: any) => (
                        <li key={t.id} className="flex justify-between items-center text-sm text-gray-600">
                          <span>{t.name} — Rs. {(t.price / 100).toFixed(0)}</span>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeCatalogItem("template", t.id)} className="text-xs text-red-500 transition-colors hover:text-red-700">Remove</motion.button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-gray-400">No templates yet for this model.</p>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mb-10 bg-white border rounded-xl p-5">
        <h2 className="font-semibold mb-4">Analytics</h2>
        <motion.div variants={staggerGrid} initial="hidden" whileInView="show" viewport={viewportOnce} className="grid md:grid-cols-4 gap-4 mb-4">
          <motion.div variants={scaleIn} className="border rounded p-3 transition-shadow duration-300 hover:shadow-sm"><p className="text-sm text-gray-500">Orders</p><p className="text-xl font-bold"><AnimatedNumber value={report?.totalOrders ?? 0} /></p></motion.div>
          <motion.div variants={scaleIn} className="border rounded p-3 transition-shadow duration-300 hover:shadow-sm"><p className="text-sm text-gray-500">Revenue</p><p className="text-xl font-bold"><AnimatedNumber value={(report?.totalRevenue ?? 0) / 100} prefix="Rs. " /></p></motion.div>
          <motion.div variants={scaleIn} className="border rounded p-3 transition-shadow duration-300 hover:shadow-sm"><p className="text-sm text-gray-500">Products sold</p><p className="text-xl font-bold"><AnimatedNumber value={report?.totalProductsSold ?? 0} /></p></motion.div>
          <motion.div variants={scaleIn} className="border rounded p-3 transition-shadow duration-300 hover:shadow-sm"><p className="text-sm text-gray-500">Pending</p><p className="text-xl font-bold"><AnimatedNumber value={report?.pendingOrders ?? 0} /></p></motion.div>
        </motion.div>
        <div className="flex flex-wrap gap-2 mb-3">
          <input type="date" value={reportRange.start} onChange={(e) => setReportRange({ ...reportRange, start: e.target.value })} className="border rounded px-2 py-1 text-sm" />
          <input type="date" value={reportRange.end} onChange={(e) => setReportRange({ ...reportRange, end: e.target.value })} className="border rounded px-2 py-1 text-sm" />
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} onClick={() => loadReport()} className="bg-brand text-white rounded px-3 py-2 text-sm transition-colors hover:bg-brand-accent">Apply</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => emailReport()} disabled={emailingReport} className="relative rounded border border-brand px-3 py-2 text-sm text-brand transition-colors hover:bg-brand hover:text-white disabled:opacity-60">
            <span className={emailingReport ? "opacity-0" : ""}>Email monthly report</span>
            {emailingReport && <span className="absolute inset-0 flex items-center justify-center"><Spinner /></span>}
          </motion.button>
        </div>
        <AnimatePresence initial={false}>
          {reportNote && <motion.p key={reportNote} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }} className="mb-2 overflow-hidden text-sm text-gray-600">{reportNote}</motion.p>}
        </AnimatePresence>
        <div className="text-sm text-gray-500">Completed: {report?.completedOrders ?? 0} · Cancelled: {report?.cancelledOrders ?? 0}</div>
      </section>

      <h2 className="font-semibold mb-3">Orders</h2>
      <motion.div variants={staggerGrid} initial="hidden" animate="show" className="space-y-3">
        {data.orders.map((o: any) => (
          <motion.div key={o.id} variants={fadeInUp} whileHover={{ y: -2 }} className="bg-white border rounded-xl p-4 transition-shadow duration-300 hover:border-brand/40 hover:shadow-md">
            <div className="flex flex-col md:flex-row justify-between gap-3 mb-3">
              <div>
                <p className="font-semibold">{o.orderNumber} — {o.customerName}</p>
                <p className="text-sm text-gray-500">{o.customerEmail} · {o.customerPhone}</p>
                <p className="text-sm text-gray-500">{o.shippingAddress}, {o.city}</p>
              </div>
              <div className="text-left md:text-right">
                <p className="font-bold">Rs. {(o.totalAmount / 100).toFixed(0)}</p>
                <div className="mt-1 flex flex-wrap gap-1.5 md:justify-end">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold transition-colors duration-300 ${o.paymentStatus === "PAID" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-600"}`}>{o.paymentStatus}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold transition-colors duration-300 ${STATUS_BADGE[o.status] || "bg-slate-100 text-slate-600"}`}>{o.status.replace(/_/g, " ")}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">Placed {new Date(o.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-sm border-t pt-3">
              <div className="space-y-1">
                <p className="font-semibold">Customer</p>
                <p className="text-gray-600">Name: {o.customerName}</p>
                <p className="text-gray-600">Email: {o.customerEmail}</p>
                <p className="text-gray-600">Phone: {o.customerPhone}</p>
                <p className="text-gray-600">Address: {o.shippingAddress}</p>
                <p className="text-gray-600">City: {o.city}</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold">Order</p>
                <p className="text-gray-600">Order number: {o.orderNumber}</p>
                <p className="text-gray-600">Items: {o.items.map((item: any) => `${item.product?.title || "Custom cover"} × ${item.quantity}`).join(", ")}</p>
                <p className="text-gray-600">Total amount: Rs. {(o.totalAmount / 100).toFixed(0)}</p>
                <p className="text-gray-600">Date: {new Date(o.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-sm mt-3 border-t pt-3">
              <div className="space-y-1">
                <p className="font-semibold">Payment</p>
                <p className="text-gray-600">Method: {o.paymentMethod || "EasyPaisa"}</p>
                <p className="text-gray-600">Status: {o.paymentStatus}</p>
                <p className="text-gray-600">Reference ID: {o.paymentReference || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold">Delivery</p>
                <p className="text-gray-600">Courier: {o.courier || "Not assigned"}</p>
                <p className="text-gray-600">CN number: {o.trackingNumber || "—"}</p>
                <p className="text-gray-600">Order status: {o.status}</p>
                <p className="text-gray-600">Location: {o.deliveryLocation || "—"}</p>
                <p className="text-gray-600">Tracking notes: {o.trackingHistory?.length ? o.trackingHistory[o.trackingHistory.length - 1].note || "—" : "—"}</p>
              </div>
            </div>

            {o.items.filter((item: any) => item.customDesign).map((item: any) => (
              <div key={item.id} className="mt-3 border-t pt-3 flex flex-col md:flex-row gap-3 items-start">
                {/* eslint-disable-next-line @next/next/no-img-element -- fabric.js toDataURL() produces a data: URL, which next/image cannot render */}
                <img src={item.customDesign.previewImage} alt="Custom cover preview" loading="lazy" className="w-24 h-28 object-cover border rounded" />
                <div className="text-sm space-y-1">
                  <p className="font-semibold">Custom cover: {item.customDesign.mobileModel}</p>
                  <p className="text-gray-500">Template: {item.customDesign.templateName} · Qty {item.quantity}</p>
                  <p className="text-gray-500">Color: {item.customDesign.selectedColorName} ({item.customDesign.colorHex})</p>
                  <p className="text-gray-500">Font/style: {item.customDesign.textDetails?.fontFamily || "—"} / {item.customDesign.textDetails?.styleName || "—"}</p>
                  <p className="text-gray-500">Custom text: {item.customDesign.textDetails?.text || "—"}</p>
                  <a className="text-brand-accent" href={item.customDesign.previewImage} download={`custom-cover-${o.orderNumber}.png`}>Download preview</a>
                  <details className="mt-1"><summary className="cursor-pointer">View design JSON</summary><pre className="mt-1 max-h-32 overflow-auto bg-gray-50 p-2 text-xs">{item.customDesign.designJson}</pre></details>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 items-center mt-3">
              <select
                defaultValue={o.status}
                onChange={(e) => updateStatus(o.id, e.target.value)}
                className="border rounded px-2 py-1 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
              <input
                placeholder="Location (optional, for tracking)"
                className="border rounded px-2 py-1 text-sm flex-1 min-w-[180px] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                value={locationInput[o.id] || ""}
                onChange={(e) => setLocationInput({ ...locationInput, [o.id]: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center mt-3 border-t pt-3">
              <select value={shipmentInput[o.id]?.courier || o.courier || ""} onChange={(e) => setShipmentInput({ ...shipmentInput, [o.id]: { courier: e.target.value, trackingNumber: shipmentInput[o.id]?.trackingNumber || o.trackingNumber || "" } })} className="border rounded px-2 py-1 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20">
                <option value="">Select courier</option><option value="TCS">TCS</option><option value="LEOPARDS">Leopards</option>
              </select>
              <input placeholder="Courier consignment / tracking number" value={shipmentInput[o.id]?.trackingNumber || o.trackingNumber || ""} onChange={(e) => setShipmentInput({ ...shipmentInput, [o.id]: { courier: shipmentInput[o.id]?.courier || o.courier || "", trackingNumber: e.target.value } })} className="border rounded px-2 py-1 text-sm flex-1 min-w-[220px] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} onClick={() => saveShipment(o.id)} className="bg-brand text-white rounded px-3 py-1 text-sm transition-colors hover:bg-brand-accent">Save shipment</motion.button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
