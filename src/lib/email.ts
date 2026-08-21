import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
// Resend rejects any send from an unverified sender, so a placeholder "from" would fail every
// email silently. Treat email as configured only when BOTH the API key AND a real from-address
// are present; otherwise every sender below cleanly no-ops (returns null) instead of throwing.
const EMAIL_FROM = process.env.EMAIL_FROM;

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  totalAmount: number; // cents
  items: { title: string; quantity: number; price: number }[];
}

const money = (paisas: number) => `Rs. ${(paisas / 100).toFixed(0)}`;
const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// Sent to the ADMIN as soon as payment is confirmed
export async function sendAdminOrderNotification(data: OrderEmailData) {
  if (!resend || !EMAIL_FROM || !process.env.ADMIN_EMAIL) return null;
  const itemsHtml = data.items
    .map((i) => `<li>${escapeHtml(i.title)} x${i.quantity} — ${money(i.price * i.quantity)}</li>`)
    .join("");

  return resend.emails.send({
    from: EMAIL_FROM!,
    to: process.env.ADMIN_EMAIL!,
    subject: `New Order Confirmed — ${data.orderNumber}`,
    html: `
      <h2>New order confirmed</h2>
      <p><b>Order #:</b> ${escapeHtml(data.orderNumber)}</p>
      <p><b>Customer:</b> ${escapeHtml(data.customerName)}</p>
      <p><b>Email:</b> ${escapeHtml(data.customerEmail)}</p>
      <p><b>Phone:</b> ${escapeHtml(data.customerPhone)}</p>
      <p><b>Address:</b> ${escapeHtml(data.shippingAddress)}, ${escapeHtml(data.city)}</p>
      <p><b>Total:</b> ${money(data.totalAmount)}</p>
      <p><b>Items:</b></p>
      <ul>${itemsHtml}</ul>
      <p>View and update this order in the admin dashboard.</p>
    `,
  });
}

// Sent to the CUSTOMER confirming their order
export async function sendCustomerOrderConfirmation(data: OrderEmailData) {
  if (!resend || !EMAIL_FROM) return null;
  return resend.emails.send({
    from: EMAIL_FROM!,
    to: data.customerEmail,
    subject: `Your order ${data.orderNumber} is confirmed!`,
    html: `
      <h2>Thanks for your order, ${escapeHtml(data.customerName)}!</h2>
      <p>Your order <b>${escapeHtml(data.orderNumber)}</b> has been confirmed and payment received.</p>
      <p><b>Total:</b> ${money(data.totalAmount)}</p>
      <p>You can track your order anytime at:
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/track?order=${encodeURIComponent(data.orderNumber)}">
          ${process.env.NEXT_PUBLIC_BASE_URL}/track?order=${escapeHtml(data.orderNumber)}
        </a>
      </p>
      <p>We'll also send updates on WhatsApp.</p>
    `,
  });
}

type VerificationPurpose = "email_verify" | "password_reset" | "checkout";

// Customer-facing copy for order-status changes. PENDING/CANCELLED are handled elsewhere
// (order confirmation / cancellation), so only the fulfilment milestones get an email here.
const STATUS_EMAIL: Record<string, { subject: (n: string) => string; heading: string; body: string }> = {
  CONFIRMED: { subject: (n) => `Order ${n} confirmed`, heading: "Your order is confirmed", body: "We've received your order and it's now being prepared." },
  PROCESSING: { subject: (n) => `Order ${n} is being prepared`, heading: "We're preparing your order", body: "Your cover is being made and packed with care." },
  SHIPPED: { subject: (n) => `Order ${n} has shipped`, heading: "Your order is on its way", body: "Your parcel has been handed to the courier." },
  OUT_FOR_DELIVERY: { subject: (n) => `Order ${n} is out for delivery`, heading: "Out for delivery", body: "Your parcel is out for delivery and should arrive soon." },
  DELIVERED: { subject: (n) => `Order ${n} delivered`, heading: "Delivered — enjoy!", body: "Your order has been delivered. Thank you for choosing CoverCraft!" },
};

// Sent to the CUSTOMER when an admin advances the order status (shipping / delivery updates).
// A no-op (returns null) when the status has no customer email or email isn't configured.
export async function sendOrderStatusUpdateEmail(data: {
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  status: string;
  note?: string | null;
  courier?: string | null;
  trackingNumber?: string | null;
}) {
  if (!resend || !EMAIL_FROM) return null;
  const copy = STATUS_EMAIL[data.status];
  if (!copy) return null; // no customer email for this status
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  const trackUrl = base ? `${base}/track?order=${encodeURIComponent(data.orderNumber)}` : "";
  const courierLine = data.courier && data.trackingNumber
    ? `<p><b>Courier:</b> ${escapeHtml(data.courier)} — ${escapeHtml(data.trackingNumber)}</p>` : "";
  return resend.emails.send({
    from: EMAIL_FROM!,
    to: data.customerEmail,
    subject: copy.subject(data.orderNumber),
    html: `
      <h2>${copy.heading}</h2>
      <p>Hi ${escapeHtml(data.customerName)},</p>
      <p>${copy.body}</p>
      <p><b>Order #:</b> ${escapeHtml(data.orderNumber)}</p>
      ${courierLine}
      ${data.note ? `<p>${escapeHtml(data.note)}</p>` : ""}
      ${trackUrl ? `<p>Track your order: <a href="${trackUrl}">${escapeHtml(trackUrl)}</a></p>` : ""}
    `,
  });
}

// Sent to the ADMIN when a customer submits a Support Center request. Reuses the
// same Resend client + env vars as the order emails; a no-op when unconfigured
// (returns null) so a missing mail provider never blocks ticket creation.
export async function sendSupportTicketNotification(data: {
  ticketNumber: string;
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  orderNumber?: string | null;
  authenticated: boolean;
}) {
  if (!resend || !EMAIL_FROM || !process.env.ADMIN_EMAIL) return null;
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  return resend.emails.send({
    from: EMAIL_FROM!,
    to: process.env.ADMIN_EMAIL!,
    subject: `New support request — ${escapeHtml(data.subject)} (${escapeHtml(data.ticketNumber)})`,
    html: `
      <h2>New support request</h2>
      <p><b>Ticket:</b> ${escapeHtml(data.ticketNumber)}</p>
      <p><b>Category:</b> ${escapeHtml(data.category)}</p>
      <p><b>From:</b> ${escapeHtml(data.name)} &lt;${escapeHtml(data.email)}&gt; ${data.authenticated ? "(signed-in customer)" : "(guest)"}</p>
      ${data.orderNumber ? `<p><b>Order #:</b> ${escapeHtml(data.orderNumber)}</p>` : ""}
      <p><b>Subject:</b> ${escapeHtml(data.subject)}</p>
      <p><b>Message:</b></p>
      <p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>
      ${base ? `<p><a href="${base}/admin/dashboard">Open Support Management</a></p>` : ""}
    `,
  });
}

const VERIFICATION_COPY: Record<VerificationPurpose, { subject: string; heading: string; intro: string }> = {
  email_verify: { subject: "Verify your CoverCraft email", heading: "Confirm your email", intro: "Use this code to verify your CoverCraft account:" },
  password_reset: { subject: "Reset your CoverCraft password", heading: "Password reset", intro: "Use this code to reset your password. If you didn't request this, you can ignore this email:" },
  checkout: { subject: "Your CoverCraft checkout code", heading: "Confirm it's you", intro: "Enter this code to confirm your order and continue to payment:" },
};

// One-time codes for email verification, password reset, and checkout confirmation.
// The code is NEVER returned in an API response — it only reaches the user via this email.
// In non-production we also log it so the flow is testable without an email provider configured.
export async function sendVerificationCodeEmail(to: string, code: string, purpose: VerificationPurpose) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.info(`[verification:${purpose}] code for ${to}: ${code}`);
  }
  if (!resend || !EMAIL_FROM) return null;
  const copy = VERIFICATION_COPY[purpose];
  return resend.emails.send({
    from: EMAIL_FROM!,
    to,
    subject: copy.subject,
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto">
        <h2 style="margin:0 0 8px">${copy.heading}</h2>
        <p style="color:#475569;margin:0 0 16px">${copy.intro}</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:8px;background:#f1f5f9;border-radius:12px;padding:16px;text-align:center">${escapeHtml(code)}</div>
        <p style="color:#94a3b8;font-size:13px;margin:16px 0 0">This code expires shortly. Never share it with anyone — CoverCraft staff will never ask for it.</p>
      </div>
    `,
  });
}

export async function sendMonthlyReportEmail() {
  if (!resend || !EMAIL_FROM || !process.env.ADMIN_EMAIL) return null;
  const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lte: end } },
    include: { items: true },
  });

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalProductsSold = orders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

  return resend.emails.send({
    from: EMAIL_FROM!,
    to: process.env.ADMIN_EMAIL!,
    subject: `Monthly Sales Report — ${start.toLocaleString("en-US", { month: "long", year: "numeric" })}`,
    html: `
      <h2>Monthly Sales Report</h2>
      <p><b>Total orders:</b> ${totalOrders}</p>
      <p><b>Revenue:</b> ${money(totalRevenue)}</p>
      <p><b>Products sold:</b> ${totalProductsSold}</p>
      <p>View the admin dashboard for the full breakdown.</p>
    `,
  });
}
