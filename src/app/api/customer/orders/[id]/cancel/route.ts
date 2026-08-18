import { NextRequest, NextResponse } from "next/server";
import { verifyCustomer } from "@/lib/customerAuth";
import { cancelCustomerOrder } from "@/lib/orderConfirmation";

// Customer-initiated cancellation. Allowed while the order is still PENDING or CONFIRMED;
// reserved standard-product stock is returned and a paid order is flagged REFUNDED for
// manual refund. Ownership is enforced via the signed customer session.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = verifyCustomer(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await cancelCustomerOrder(params.id, session.customerId);
  if (result === "not_found") return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (result === "not_cancellable") return NextResponse.json({ error: "This order can no longer be cancelled." }, { status: 409 });
  return NextResponse.json({ ok: true });
}
