import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";
import { notifyCustomerStatusUpdate } from "@/lib/whatsapp";
import { sendOrderStatusUpdateEmail } from "@/lib/email";
import { orderStatusSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = orderStatusSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid order status update" }, { status: 400 });
  const { status, note, location } = parsed.data;
  const cleanedLocation = location || "";

  const order = await prisma.order.update({
    where: { id: params.id },
    data: {
      status,
      deliveryLocation: cleanedLocation || undefined,
      trackingHistory: {
        create: {
          status,
          note: typeof note === "string" ? note.trim() : null,
          location: cleanedLocation || null,
        },
      },
    },
  });

  // Notify the customer on both channels; neither failure should block the status update.
  await Promise.allSettled([
    notifyCustomerStatusUpdate(order.customerPhone, order.orderNumber, status),
    sendOrderStatusUpdateEmail({
      orderNumber: order.orderNumber,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      status,
      note: typeof note === "string" ? note.trim() : null,
      courier: order.courier,
      trackingNumber: order.trackingNumber,
    }),
  ]);

  return NextResponse.json({ order });
}
