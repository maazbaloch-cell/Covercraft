"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import Spinner from "@/components/Spinner";

/* ---------------------------------------------------------------- constants */

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
const CATEGORIES = ["ORDERING", "SHIPPING", "TRACKING", "CUSTOMIZATION", "PAYMENTS", "RETURNS", "OTHER"] as const;

const STATUS_BADGE: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-sky-100 text-sky-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-200 text-slate-600",
};
const CATEGORY_LABEL: Record<string, string> = {
  ORDERING: "Ordering", SHIPPING: "Shipping & Delivery", TRACKING: "Tracking",
  CUSTOMIZATION: "Customization", PAYMENTS: "Payments", RETURNS: "Returns & Refunds", OTHER: "General",
};

const fmtDate = (iso: string) => {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
};

/* ---------------------------------------------------------------- module
 * Support Management, embedded as a section inside the Admin Dashboard.
 * The panels are built with light utility classes; the `.support-admin`
 * wrapper lets globals.css adapt them to the dark dashboard theme without
 * touching this markup/logic. All data + mutations go through the real,
 * admin-protected /api/admin/support/* endpoints. */

export default function SupportManagement() {
  const [tab, setTab] = useState<"tickets" | "faqs">("tickets");
  return (
    <div className="support-admin">
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {(["tickets", "faqs"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${tab === t ? "bg-accent-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {t === "tickets" ? "Support Requests" : "FAQ Manager"}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "tickets" ? <TicketsPanel /> : <FaqsPanel />}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- tickets */

function TicketsPanel() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    if (debouncedQ) params.set("q", debouncedQ);
    try {
      const res = await fetch(`/api/admin/support/tickets?${params.toString()}`, { credentials: "include" });
      if (res.status === 401) { window.location.href = "/admin"; return; }
      if (!res.ok) { setError("Could not load support requests."); return; }
      const body = await res.json();
      setTickets(body.tickets || []);
    } catch {
      setError("Could not load support requests.");
    } finally {
      setLoading(false);
    }
  }, [status, category, debouncedQ]);

  useEffect(() => { void load(); }, [load]);

  const updateTicket = async (id: string, patch: { status?: string; adminNotes?: string }) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });
      if (res.status === 401) { window.location.href = "/admin"; return; }
      if (res.ok) {
        const body = await res.json();
        setTickets((prev) => prev.map((t) => (t.id === id ? body.ticket : t)));
      }
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto_auto]">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search ticket #, subject, name, email, order…"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-accent-500">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-accent-500">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
        </select>
      </div>

      {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-4 space-y-3">
        {loading && (
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm"><Spinner /> Loading requests…</div>
        )}
        {!loading && tickets.length === 0 && !error && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">No support requests match these filters.</div>
        )}
        {!loading && tickets.map((t) => {
          const open = openId === t.id;
          return (
            <div key={t.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => { setOpenId(open ? null : t.id); setNotes((n) => ({ ...n, [t.id]: t.adminNotes || "" })); }}
                aria-expanded={open}
                className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
              >
                <span className="font-mono text-xs font-bold text-slate-500">{t.ticketNumber}</span>
                <span className="flex-1 truncate font-semibold text-slate-900">{t.subject}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold ${STATUS_BADGE[t.status] || "bg-slate-200 text-slate-600"}`}>{t.status.replace("_", " ")}</span>
                <span className="hidden text-xs text-slate-400 sm:inline">{fmtDate(t.createdAt)}</span>
              </button>

              {open && (
                <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4">
                  <div className="grid gap-4 text-sm sm:grid-cols-2">
                    <Detail label="From">{t.name} &lt;{t.email}&gt;</Detail>
                    <Detail label="Category">{CATEGORY_LABEL[t.category] || t.category}</Detail>
                    <Detail label="Order reference">{t.orderNumber || "—"}</Detail>
                    <Detail label="Account">{t.customerId ? "Signed-in customer" : "Guest"}</Detail>
                  </div>
                  <div className="mt-3">
                    <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Message</p>
                    <p className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">{t.message}</p>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-[220px_1fr]">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Status</label>
                      <select
                        value={t.status}
                        onChange={(e) => updateTicket(t.id, { status: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-accent-500"
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Internal notes (not visible to customer)</label>
                      <textarea
                        value={notes[t.id] ?? (t.adminNotes || "")}
                        onChange={(e) => setNotes((n) => ({ ...n, [t.id]: e.target.value }))}
                        rows={2}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-accent-500"
                        placeholder="Add a private note for the team…"
                      />
                      <button
                        type="button"
                        onClick={() => updateTicket(t.id, { adminNotes: notes[t.id] ?? "" })}
                        disabled={savingId === t.id}
                        className="mt-2 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-slate-700 disabled:opacity-60"
                      >
                        {savingId === t.id ? "Saving…" : "Save notes"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-slate-800">{children}</p>
    </div>
  );
}

/* ---------------------------------------------------------------- FAQs */

function FaqsPanel() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ question: "", answer: "", category: "OTHER", sortOrder: "0", isPublished: true });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/support/faqs", { credentials: "include" });
      if (res.status === 401) { window.location.href = "/admin"; return; }
      if (!res.ok) { setError("Could not load FAQs."); return; }
      const body = await res.json();
      setFaqs(body.faqs || []);
    } catch {
      setError("Could not load FAQs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (form.question.trim().length < 3 || form.answer.trim().length < 3) {
      setCreateError("Question and answer are required.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/support/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          question: form.question.trim(),
          answer: form.answer.trim(),
          category: form.category,
          sortOrder: Number(form.sortOrder) || 0,
          isPublished: form.isPublished,
        }),
      });
      if (res.status === 401) { window.location.href = "/admin"; return; }
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setForm({ question: "", answer: "", category: "OTHER", sortOrder: "0", isPublished: true });
        void load();
      } else {
        setCreateError(body.error || "Could not create FAQ.");
      }
    } finally {
      setCreating(false);
    }
  };

  const togglePublish = async (faq: any) => {
    setBusyId(faq.id);
    try {
      const res = await fetch(`/api/admin/support/faqs/${faq.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isPublished: !faq.isPublished }),
      });
      if (res.status === 401) { window.location.href = "/admin"; return; }
      if (res.ok) { const body = await res.json(); setFaqs((prev) => prev.map((f) => (f.id === faq.id ? body.faq : f))); }
    } finally { setBusyId(null); }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this FAQ? This cannot be undone.")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/support/faqs/${id}`, { method: "DELETE", credentials: "include" });
      if (res.status === 401) { window.location.href = "/admin"; return; }
      if (res.ok) setFaqs((prev) => prev.filter((f) => f.id !== id));
    } finally { setBusyId(null); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* List */}
      <div>
        {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {loading && <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm"><Spinner /> Loading FAQs…</div>}
        {!loading && faqs.length === 0 && !error && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">No FAQs yet. Create one on the right.</div>
        )}
        <div className="space-y-3">
          {!loading && faqs.map((f) => (
            <div key={f.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[0.68rem] font-bold text-slate-600">{CATEGORY_LABEL[f.category] || f.category}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold ${f.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>{f.isPublished ? "Published" : "Hidden"}</span>
                    <span className="text-[0.68rem] text-slate-400">order {f.sortOrder}</span>
                  </div>
                  <p className="mt-2 font-semibold text-slate-900">{f.question}</p>
                  <p className="mt-1 text-sm text-slate-600">{f.answer}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => togglePublish(f)} disabled={busyId === f.id} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60">
                  {f.isPublished ? "Unpublish" : "Publish"}
                </button>
                <button type="button" onClick={() => remove(f.id)} disabled={busyId === f.id} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create */}
      <form onSubmit={create} className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-bold text-slate-900">Add a FAQ</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Question</label>
            <input value={form.question} onChange={(e) => setForm((s) => ({ ...s, question: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-accent-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Answer</label>
            <textarea value={form.answer} onChange={(e) => setForm((s) => ({ ...s, answer: e.target.value }))} rows={4} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-accent-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Category</label>
              <select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-accent-500">
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Sort order</label>
              <input type="number" min={0} value={form.sortOrder} onChange={(e) => setForm((s) => ({ ...s, sortOrder: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-accent-500" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((s) => ({ ...s, isPublished: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-accent-600 focus:ring-accent-500" />
            Publish immediately
          </label>
          {createError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{createError}</p>}
          <button type="submit" disabled={creating} className="w-full rounded-lg bg-accent-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-500 disabled:opacity-60">
            {creating ? "Adding…" : "Add FAQ"}
          </button>
        </div>
      </form>
    </div>
  );
}
