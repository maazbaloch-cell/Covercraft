import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
  if (!resend || !process.env.ADMIN_EMAIL) return null;
  const itemsHtml = data.items
    .map((i) => `<li>${escapeHtml(i.title)} x${i.quantity} — ${money(i.price * i.quantity)}</li>`)
    .join("");

  return resend.emails.send({
    from: process.env.EMAIL_FROM || "orders@yourdomain.com",
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
  if (!resend) return null;
  return resend.emails.send({
    from: process.env.EMAIL_FROM || "orders@yourdomain.com",
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

export async function sendMonthlyReportEmail() {
  if (!resend || !process.env.ADMIN_EMAIL) return null;
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
    from: process.env.EMAIL_FROM || "orders@yourdomain.com",
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
