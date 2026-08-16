import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { generateOrderNumber } from "@/lib/orderNumber";
import { logPaymentEvent, paymentService } from "@/lib/paymentService";
import { checkoutSchema } from "@/lib/validation";
import { isRateLimited } from "@/lib/rateLimit";
import { verifyCustomer } from "@/lib/customerAuth";
import { CHECKOUT_TICKET_COOKIE, hasValidCheckoutTicket } from "@/lib/checkoutTicket";

// Receives a normal browser form POST, then hands off to EasyPaisa Hosted Checkout.
export async function POST(req: NextRequest) {
  const customerSession = verifyCustomer(req);
  if (isRateLimited(req, "checkout", 5, 10 * 60_000)) return new NextResponse("Too many checkout attempts. Please try again later.", { status: 429 });
  const formData = await req.formData();
  const customer = checkoutSchema.safeParse({
    name: formData.get("name"), email: formData.get("email"), phone: formData.get("phone"),
    address: formData.get("address"), city: formData.get("city"),
  });
  const cartJson = formData.get("cart") as string;
  if (!customer.success || !cartJson || cartJson.length > 250_000) {
    return new NextResponse("Missing required fields", { status: 400 });
  }
  const { name, email, phone, address, city } = customer.data;

  // Every checkout must be confirmed with an emailed OTP first (see /api/checkout/otp).
  if (!hasValidCheckoutTicket(req, email)) {
    return new NextResponse("Please confirm the code we emailed you before continuing to payment.", { status: 403 });
  }

  type CartEntry = {
    productId: string;
    quantity: number;
    productType?: "standard" | "customized_cover";
    customDesign?: { mobileModel: string; templateId?: string; templateName: string; canvasJson: string; previewImage: string; uploadedAssets?: string[]; coverColor: string; colorHex: string; selectedColorName: string; textDetails?: Record<string, unknown> };
  };
  let cart: CartEntry[];
  try {
    cart = JSON.parse(cartJson);
  } catch {
    return new NextResponse("Invalid cart data", { status: 400 });
  }
  if (!Array.isArray(cart) || !cart.length || cart.length > 50 || cart.some((item) => !item || typeof item.productId !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20)) {
    return new NextResponse("Invalid cart data", { status: 400 });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: cart.filter((item) => item.productType !== "customized_cover").map((i) => i.productId) }, deletedAt: null, isActive: true, isAvailable: true },
  });

  if (!products.length && !cart.some((item) => item.productType === "customized_cover")) {
    return new NextResponse("No valid products found", { status: 400 });
  }

  let totalAmount = 0;
  try {
    for (const item of cart.filter((item) => item.productType !== "customized_cover")) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || product.stock < item.quantity) return new NextResponse("One or more items are unavailable or out of stock.", { status: 409 });
      totalAmount += product.price * item.quantity;
    }
    for (const item of cart.filter((item) => item.productType === "customized_cover")) {
      const design = item.customDesign;
      if (!design?.mobileModel || !design.templateName || !design.canvasJson || !design.previewImage || design.canvasJson.length > 150_000 || design.previewImage.length > 2_000_000) return new NextResponse("Invalid custom design", { status: 400 });
      const template = design.templateId ? await prisma.coverTemplate.findFirst({ where: { id: design.templateId, isActive: true } }) : null;
      if (!template) return new NextResponse("Selected custom-cover template is unavailable.", { status: 409 });
      totalAmount += template.price * item.quantity;
    }
    if (!Number.isSafeInteger(totalAmount) || totalAmount <= 0) return new NextResponse("Invalid order amount", { status: 400 });
  } catch { return new NextResponse("Invalid cart data", { status: 400 }); }

  const order = await prisma.$transaction(async (tx) => {
    const orderNumber = generateOrderNumber();
    const items = [] as Prisma.OrderItemCreateWithoutOrderInput[];
    for (const item of cart) {
      if (item.productType === "customized_cover") {
        const design = item.customDesign!;
        const template = await tx.coverTemplate.findFirstOrThrow({ where: { id: design.templateId, isActive: true } });
        const customDesign = await tx.customDesign.create({ data: { mobileModel: design.mobileModel.slice(0, 100), templateName: design.templateName.slice(0, 100), templateId: template.id, designJson: design.canvasJson, previewImage: design.previewImage, uploadedAssets: design.uploadedAssets ?? [], coverColor: design.coverColor.slice(0, 40), colorHex: design.colorHex.slice(0, 20), selectedColorName: design.selectedColorName.slice(0, 40), textDetails: design.textDetails ? JSON.parse(JSON.stringify(design.textDetails)) as Prisma.InputJsonValue : undefined } });
        items.push({ customDesign: { connect: { id: customDesign.id } }, productType: "CUSTOMIZED_COVER", quantity: item.quantity, price: template.price });
      } else {
        const updated = await tx.product.updateMany({ where: { id: item.productId, stock: { gte: item.quantity }, isAvailable: true, isActive: true, deletedAt: null }, data: { stock: { decrement: item.quantity } } });
        if (updated.count !== 1) throw new Error("OUT_OF_STOCK");
        const product = products.find((p) => p.id === item.productId)!;
        items.push({ product: { connect: { id: product.id } }, productType: "STANDARD", quantity: item.quantity, price: product.price });
      }
    }
    return tx.order.create({ data: { orderNumber, customerName: name, customerEmail: email, customerPhone: phone, shippingAddress: address, city, totalAmount, customerId: customerSession?.customerId, trackingHistory: { create: { status: "PENDING", note: "Order created; awaiting payment" } }, items: { create: items }, payment: { create: { method: "EasyPaisa", status: "UNPAID", amount: totalAmount } } } });
  }).catch((error) => {
    if (error instanceof Error && error.message === "OUT_OF_STOCK") return null;
    throw error;
  });
  if (!order) return new NextResponse("One or more items just sold out. Please refresh your cart.", { status: 409 });

  let checkout: ReturnType<typeof paymentService.initiate>;
  try {
    checkout = paymentService.initiate({ orderNumber: order.orderNumber, amountInPaisas: totalAmount, callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/easypaisa/callback`, email, phone });
  } catch (error) {
    console.error("[payment:easypaisa] initiation failed", { orderNumber: order.orderNumber, error: error instanceof Error ? error.message : "Unknown error" });
    return new NextResponse("Payment service is temporarily unavailable. Please try again later.", { status: 503 });
  }
  logPaymentEvent("checkout initiated", checkout.fields);

  const inputsHtml = Object.entries(checkout.fields)
    .map(([key, value]) => `<input type="hidden" name="${key}" value="${escapeHtml(value)}" />`)
    .join("\n");

  // Auto-submitting form — the browser lands here for a split second, then JS submits it
  // straight to the hosted payment page.
  const html = `
    <!DOCTYPE html>
    <html>
      <body onload="document.forms[0].submit()">
        <p>Redirecting to secure payment page...</p>
        <form method="POST" action="${checkout.url}">
          ${inputsHtml}
        </form>
      </body>
    </html>
  `;

  const response = new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  // One ticket per confirmed checkout — clear it so it can't be replayed for another order.
  response.cookies.set(CHECKOUT_TICKET_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 0, path: "/" });
  return response;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
