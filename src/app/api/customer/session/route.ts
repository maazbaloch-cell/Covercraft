import { NextRequest, NextResponse } from "next/server";
import { verifyCustomer } from "@/lib/customerAuth";

export async function GET(req: NextRequest) {
  const customer = verifyCustomer(req);
  if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ customer });
}
