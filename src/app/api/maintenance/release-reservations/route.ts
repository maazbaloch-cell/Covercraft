import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { failOrderAndRestoreStock } from "@/lib/orderConfirmation";

// Releases stock held by orders that started checkout but never completed payment.
// Checkout decrements standard-product stock up front; if the buyer abandons payment and no
// callback ever arrives, that stock would stay reserved forever. EasyPaisa checkouts expire
// after 30 minutes, so anything still UNPAID past that window is safe to release.
const RESERVATION_TTL_MS = 30 * 60_000;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  // Constant-time compare so the secret can't be recovered by timing the response.
  return a.length === b.length && timingSafeEqual(a, b);
}

async function releaseExpiredReservations() {
  const cutoff = new Date(Date.now() - RESERVATION_TTL_MS);
  const stale = await prisma.order.findMany({ where: { paymentStatus: "UNPAID", createdAt: { lt: cutoff } }, select: { id: true } });
  let released = 0;
  for (const order of stale) {
    const didRelease = await failOrderAndRestoreStock(order.id, "Payment not completed in time; reserved stock released");
    if (didRelease) {
      released += 1;
      await prisma.payment.updateMany({ where: { orderId: order.id, status: "UNPAID" }, data: { status: "FAILED" } });
    }
  }
  return { scanned: stale.length, released };
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await releaseExpiredReservations()) });
}

// Vercel Cron issues GET requests; support both.
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await releaseExpiredReservations()) });
}
