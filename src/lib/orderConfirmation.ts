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

/**
 * Marks an unpaid order as FAILED and returns the stock that checkout had decremented.
 * Standard-product stock is decremented up front at checkout, so a failed/cancelled/expired
 * payment must give it back — otherwise inventory leaks on every abandoned payment.
 *
 * The UNPAID -> FAILED transition is claimed atomically, so this is safe to call more than
 * once (duplicate gateway callbacks) and from more than one place (callback + release cron):
 * only the first caller restores stock. Returns true if this call performed the restore.
 */
export async function failOrderAndRestoreStock(orderId: string, note = "Payment failed; reserved stock released"): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({ where: { id: orderId, paymentStatus: "UNPAID" }, data: { paymentStatus: "FAILED" } });
    if (claimed.count !== 1) return false; // already paid, failed, or released elsewhere

    const items = await tx.orderItem.findMany({ where: { orderId, productType: "STANDARD", productId: { not: null } } });
    for (const item of items) {
      if (item.productId) await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
    }
    await tx.trackingEvent.create({ data: { orderId, status: "PENDING", note } });
    return true;
  });
}

export type CancelOrderResult = "ok" | "not_found" | "not_cancellable";

/**
 * Cancels an order on behalf of its owner. Allowed only while PENDING or CONFIRMED.
 *
 * The status PENDING/CONFIRMED -> CANCELLED transition is claimed atomically so the body runs
 * at most once. Reserved standard-product stock is returned exactly once, guarded by a second
 * CAS on paymentStatus: whether the customer cancels, a duplicate callback fails the order, or
 * the release cron sweeps it, only the first mover flips paymentStatus away from its held value
 * and restores stock — the others match zero rows and skip it. A paid order becomes REFUNDED
 * (the actual refund is issued manually through EasyPaisa); an unpaid one becomes FAILED.
 */
export async function cancelCustomerOrder(orderId: string, customerId: string): Promise<CancelOrderResult> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({ where: { id: orderId, customerId }, select: { status: true, paymentStatus: true } });
    if (!order) return "not_found";
    if (order.status !== "PENDING" && order.status !== "CONFIRMED") return "not_cancellable";

    const claim = await tx.order.updateMany({ where: { id: orderId, customerId, status: { in: ["PENDING", "CONFIRMED"] } }, data: { status: "CANCELLED" } });
    if (claim.count !== 1) return "not_cancellable"; // raced with another cancel

    if (order.paymentStatus === "UNPAID" || order.paymentStatus === "PAID") {
      const target = order.paymentStatus === "PAID" ? "REFUNDED" : "FAILED";
      const payClaim = await tx.order.updateMany({ where: { id: orderId, paymentStatus: order.paymentStatus }, data: { paymentStatus: target } });
      if (payClaim.count === 1) {
        const items = await tx.orderItem.findMany({ where: { orderId, productType: "STANDARD", productId: { not: null } } });
        for (const item of items) {
          if (item.productId) await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        }
        await tx.payment.updateMany({ where: { orderId }, data: { status: target } });
      }
    }
    await tx.trackingEvent.create({ data: { orderId, status: "CANCELLED", note: "Order cancelled by customer" } });
    return "ok";
  });
}

