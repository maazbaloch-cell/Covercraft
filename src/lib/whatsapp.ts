// Sends WhatsApp messages via Meta's official WhatsApp Cloud API (free tier).
// Setup: developers.facebook.com -> your app -> WhatsApp -> API Setup
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages

const waApiUrl = () => `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

async function sendWhatsAppText(to: string, body: string) {
  if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    console.warn("WhatsApp env vars not set — skipping WhatsApp send. Message would have been:", body);
    return null;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(waApiUrl(), {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body } }),
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) return res;
      console.error(`WhatsApp send attempt ${attempt + 1} failed with status ${res.status}`);
    } catch (error) {
      console.error(`WhatsApp send attempt ${attempt + 1} failed`, error instanceof Error ? error.message : "unknown error");
    }
    await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
  }
  return null;
}

// Notify the shop admin (your WhatsApp number) that a new paid order came in
export async function notifyAdminNewOrder(orderNumber: string, customerName: string, total: string) {
  const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;
  if (!adminNumber) return null;
  return sendWhatsAppText(
    adminNumber,
    `🛒 New paid order!\nOrder #: ${orderNumber}\nCustomer: ${customerName}\nTotal: ${total}\nCheck the dashboard for full details.`
  );
}

// Notify the customer their order status changed (e.g. Shipped, Out for delivery)
export async function notifyCustomerStatusUpdate(customerPhone: string, orderNumber: string, status: string) {
  return sendWhatsAppText(
    customerPhone,
    `📦 Order update: ${orderNumber}\nStatus: ${status}\nTrack it anytime: ${process.env.NEXT_PUBLIC_BASE_URL}/track?order=${orderNumber}`
  );
}

// Forward a customer complaint/feedback (received via WhatsApp webhook) — logged to DB elsewhere,
// this just pings the admin so they see it immediately.
export async function notifyAdminComplaint(fromNumber: string, message: string) {
  const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;
  if (!adminNumber) return null;
  return sendWhatsAppText(
    adminNumber,
    `⚠️ New complaint/feedback from ${fromNumber}:\n"${message}"`
  );
}
