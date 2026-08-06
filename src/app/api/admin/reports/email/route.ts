import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import { sendMonthlyReportEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await sendMonthlyReportEmail();
  return NextResponse.json({ success: true });
}
