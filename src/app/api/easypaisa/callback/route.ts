import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markOrderPaidAndNotify } from "@/lib/orderConfirmation";
import { logPaymentEvent, paymentService } from "@/lib/paymentService";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const fields: Record<string, string> = {};
  formData.forEach((value, key) => (fields[key] = String(value)));
  logPaymentEvent("callback received", fields);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const orderNumber = paymentService.orderReference(fields);
  const failedUrl = (reason?: string) => `${baseUrl}/checkout/failed?order=${encodeURIComponent(orderNumber)}${reason ? `&reason=${encodeURIComponent(reason)}` : ""}`;

  if (!baseUrl || !orderNumber || !paymentService.verifyCallback(fields)) {
    console.error("[payment:easypaisa] rejected callback", { orderNumber, validSignature: false });
    return NextResponse.redirect(baseUrl ? failedUrl("Unable to verify payment") : new URL("/checkout/failed", req.url));
  }
  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order) return NextResponse.redirect(failedUrl("Order not found"));

  const expectedAmount = (order.totalAmount / 100).toFixed(2);
  if (fields.amount && Number(fields.amount).toFixed(2) !== expectedAmount) {
    console.error("[payment:easypaisa] callback amount mismatch", { orderNumber, expectedAmount, receivedAmount: fields.amount });
    return NextResponse.redirect(failedUrl("Payment amount verification failed"));
  }

  if (paymentService.succeeded(fields)) {
    await markOrderPaidAndNotify(order.id);
    await prisma.payment.upsert({ where: { orderId: order.id }, update: { status: "PAID", transactionId: fields.transactionId || orderNumber, method: "EasyPaisa", amount: order.totalAmount }, create: { orderId: order.id, method: "EasyPaisa", status: "PAID", transactionId: fields.transactionId || orderNumber, amount: order.totalAmount } });
    logPaymentEvent("payment confirmed", fields);
    return NextResponse.redirect(`${baseUrl}/checkout/success?order=${encodeURIComponent(orderNumber)}`);
  }

  const reason = fields.responseDesc || fields.desc || (paymentService.cancelled(fields) ? "Payment cancelled" : "Payment failed");
  await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } });
  await prisma.payment.upsert({ where: { orderId: order.id }, update: { status: "FAILED", transactionId: fields.transactionId || orderNumber, method: "EasyPaisa", amount: order.totalAmount }, create: { orderId: order.id, method: "EasyPaisa", status: "FAILED", transactionId: fields.transactionId || orderNumber, amount: order.totalAmount } });
  logPaymentEvent(paymentService.cancelled(fields) ? "payment cancelled" : "payment failed", fields);
  return NextResponse.redirect(failedUrl(reason));
}
