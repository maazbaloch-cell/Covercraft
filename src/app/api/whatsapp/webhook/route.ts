import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { notifyAdminComplaint } from "@/lib/whatsapp";

// Meta calls this GET once, to verify you own the webhook, when you set it up in the dashboard
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// Meta POSTs here every time a customer sends your WhatsApp number a message
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret || !signature) return NextResponse.json({ error: "Webhook signature is required" }, { status: 401 });
  const expectedSignature = `sha256=${crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  if (signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  let body: any;
  try { body = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  try {
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (message?.type === "text") {
      const from = message.from; // customer's WhatsApp number
      const text = message.text.body;
      const contactName = change.value.contacts?.[0]?.profile?.name || "Unknown";

      // Save as a complaint/feedback entry so it shows up for the admin
      await prisma.complaint.create({
        data: { name: contactName, phone: from, message: text, channel: "whatsapp" },
      });

      // Ping the admin's WhatsApp immediately
      await notifyAdminComplaint(from, text);
    }
  } catch (err) {
    console.error("WhatsApp webhook processing error:", err);
  }

  // Always respond 200 quickly so Meta doesn't retry
  return NextResponse.json({ received: true });
}
