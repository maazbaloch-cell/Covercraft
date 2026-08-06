"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

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
  const [templateForms, setTemplateForms] = useState<TemplateFormState[]>([createTemplateForm()]);
  const [report, setReport] = useState<any>(null);
  const [reportRange, setReportRange] = useState({ start: "", end: "" });
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
  }, [router]);

  const addModel = async (event: React.FormEvent) => { event.preventDefault(); const res = await fetch("/api/admin/custom-cover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "model", ...modelForm }), credentials: "include" }); if (res.ok) { setModelForm({ name: "", brand: "" }); loadCatalog(); } };
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

  if (!data) return <div className="px-6 py-10">{loadError || "Loading dashboard..."}</div>;

  return (
    <div className="admin-dashboard max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border rounded-xl p-6">
          <p className="text-sm text-gray-500">Total Sales</p>
          <p className="text-2xl font-bold">Rs. {(data.totalSales / 100).toFixed(0)}</p>
        </div>
        <div className="bg-white border rounded-xl p-6">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold">{data.totalOrders}</p>
        </div>
      </div>

      <section className="mb-10 bg-white border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Cover Templates</h2>
          <button type="button" onClick={addTemplateForm} className="rounded border border-brand px-3 py-2 text-sm text-brand">Add another template</button>
        </div>
        {saveMessage && <p className="mb-3 text-sm text-green-600">{saveMessage}</p>}
        {saveError && <p className="mb-3 text-sm text-red-600">{saveError}</p>}
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
                <button type="submit" className="bg-brand text-white rounded px-3 py-2 text-sm">Save Template</button>
              </form>
            ))}
          </div>
          <div className="space-y-2">
            {products.map((product: any) => (
              <div key={product.id} className="border rounded p-3">
                <div className="flex justify-between"><p className="font-medium">{product.title}</p><button onClick={() => deleteProduct(product.id)} className="text-xs text-red-500">Remove</button></div>
                <p className="text-sm text-gray-500">{product.brand} · {product.model} · {product.category}</p>
                <p className="text-sm text-gray-500">Price: Rs. {(product.price / 100).toFixed(0)} · Stock: {product.stock}</p>
                <p className="text-sm text-gray-500">{product.isAvailable ? "Available" : "Unavailable"}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-10 bg-white border rounded-xl p-5">
        <h2 className="font-semibold mb-4">Analytics</h2>
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <div className="border rounded p-3"><p className="text-sm text-gray-500">Orders</p><p className="text-xl font-bold">{report?.totalOrders ?? 0}</p></div>
          <div className="border rounded p-3"><p className="text-sm text-gray-500">Revenue</p><p className="text-xl font-bold">Rs. {((report?.totalRevenue ?? 0) / 100).toFixed(0)}</p></div>
          <div className="border rounded p-3"><p className="text-sm text-gray-500">Products sold</p><p className="text-xl font-bold">{report?.totalProductsSold ?? 0}</p></div>
          <div className="border rounded p-3"><p className="text-sm text-gray-500">Pending</p><p className="text-xl font-bold">{report?.pendingOrders ?? 0}</p></div>
        </div>
        <div className="flex gap-2 mb-3">
          <input type="date" value={reportRange.start} onChange={(e) => setReportRange({ ...reportRange, start: e.target.value })} className="border rounded px-2 py-1 text-sm" />
          <input type="date" value={reportRange.end} onChange={(e) => setReportRange({ ...reportRange, end: e.target.value })} className="border rounded px-2 py-1 text-sm" />
          <button onClick={() => loadReport()} className="bg-brand text-white rounded px-3 py-2 text-sm">Apply</button>
        </div>
        <div className="text-sm text-gray-500">Completed: {report?.completedOrders ?? 0} · Cancelled: {report?.cancelledOrders ?? 0}</div>
      </section>

      <h2 className="font-semibold mb-3">Orders</h2>
      <div className="space-y-3">
        {data.orders.map((o: any) => (
          <div key={o.id} className="bg-white border rounded-xl p-4">
            <div className="flex flex-col md:flex-row justify-between gap-3 mb-3">
              <div>
                <p className="font-semibold">{o.orderNumber} — {o.customerName}</p>
                <p className="text-sm text-gray-500">{o.customerEmail} · {o.customerPhone}</p>
                <p className="text-sm text-gray-500">{o.shippingAddress}, {o.city}</p>
              </div>
              <div className="text-left md:text-right">
                <p className="font-bold">Rs. {(o.totalAmount / 100).toFixed(0)}</p>
                <p className={`text-xs ${o.paymentStatus === "PAID" ? "text-green-600" : "text-orange-500"}`}>
                  {o.paymentStatus}
                </p>
                <p className="text-xs text-gray-500">Placed {new Date(o.createdAt).toLocaleString()}</p>
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
                <img src={item.customDesign.previewImage} alt="Custom cover preview" className="w-24 h-28 object-cover border rounded" />
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
                className="border rounded px-2 py-1 text-sm"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
              <input
                placeholder="Location (optional, for tracking)"
                className="border rounded px-2 py-1 text-sm flex-1 min-w-[180px]"
                value={locationInput[o.id] || ""}
                onChange={(e) => setLocationInput({ ...locationInput, [o.id]: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center mt-3 border-t pt-3">
              <select value={shipmentInput[o.id]?.courier || o.courier || ""} onChange={(e) => setShipmentInput({ ...shipmentInput, [o.id]: { courier: e.target.value, trackingNumber: shipmentInput[o.id]?.trackingNumber || o.trackingNumber || "" } })} className="border rounded px-2 py-1 text-sm">
                <option value="">Select courier</option><option value="TCS">TCS</option><option value="LEOPARDS">Leopards</option>
              </select>
              <input placeholder="Courier consignment / tracking number" value={shipmentInput[o.id]?.trackingNumber || o.trackingNumber || ""} onChange={(e) => setShipmentInput({ ...shipmentInput, [o.id]: { courier: shipmentInput[o.id]?.courier || o.courier || "", trackingNumber: e.target.value } })} className="border rounded px-2 py-1 text-sm flex-1 min-w-[220px]" />
              <button onClick={() => saveShipment(o.id)} className="bg-brand text-white rounded px-3 py-1 text-sm">Save shipment</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
