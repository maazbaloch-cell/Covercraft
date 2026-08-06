import { prisma } from "@/lib/prisma";
import { sendAdminOrderNotification, sendCustomerOrderConfirmation } from "@/lib/email";
import { notifyAdminNewOrder } from "@/lib/whatsapp";

// Call this the moment a payment is confirmed, regardless of which gateway processed it.
export async function markOrderPaidAndNotify(orderId: string) {
  const existing = await prisma.order.findUnique({ where: { id: orderId }, select: { paymentStatus: true } });
  if (!existing) throw new Error("Order not found");
  if (existing.paymentStatus === "PAID") return prisma.order.findUniqueOrThrow({ where: { id: orderId } });

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "PAID",
      status: "CONFIRMED",
      trackingHistory: {
        create: { status: "CONFIRMED", note: "Payment received, order confirmed" },
      },
    },
    include: { items: { include: { product: true, customDesign: true } } },
  });

  const emailData = {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    shippingAddress: order.shippingAddress,
    city: order.city,
    totalAmount: order.totalAmount,
    items: order.items.map((i) => ({
      title: i.product?.title ?? `Custom ${i.customDesign?.mobileModel ?? "mobile"} cover`,
      quantity: i.quantity,
      price: i.price,
    })),
  };

  const results = await Promise.allSettled([
    sendAdminOrderNotification(emailData),
    sendCustomerOrderConfirmation(emailData),
    notifyAdminNewOrder(order.orderNumber, order.customerName, `Rs. ${(order.totalAmount / 100).toLocaleString()}`),
  ]);
  results.forEach((result) => { if (result.status === "rejected") console.error("Order notification failed", result.reason); });

  return order;
}
