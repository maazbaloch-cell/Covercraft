import crypto from "crypto";

export type EasyPaisaFields = Record<string, string>;

const environment = () => process.env.EASYPAISA_ENV === "production" ? "production" : "sandbox";

export function getEasyPaisaCheckoutUrl() {
  if (process.env.EASYPAISA_CHECKOUT_URL) return process.env.EASYPAISA_CHECKOUT_URL;
  return environment() === "production"
    ? "https://easypay.easypaisa.com.pk/easypay/Index.jsf"
    : "https://easypaystg.easypaisa.com.pk/easypay/Index.jsf";
}

function config() {
  const storeId = process.env.EASYPAISA_STORE_ID;
  const hashKey = process.env.EASYPAISA_HASH_KEY;
  if (!storeId || !hashKey) throw new Error("EasyPaisa is not configured. Set EASYPAISA_STORE_ID and EASYPAISA_HASH_KEY.");
  if (![16, 24, 32].includes(Buffer.byteLength(hashKey, "utf8"))) {
    throw new Error("EASYPAISA_HASH_KEY must be the 16, 24, or 32-byte key issued by EasyPaisa.");
  }
  return { storeId, hashKey };
}

function expiryDate() {
  const date = new Date(Date.now() + 30 * 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

// EasyPaisa Hosted Checkout signs the alphabetically sorted key=value request fields
// with AES/ECB/PKCS5Padding and Base64 encodes the ciphertext.
function encryptRequest(fields: EasyPaisaFields, hashKey: string) {
  const payload = Object.keys(fields).sort().map((key) => `${key}=${fields[key]}`).join("&");
  const algorithm = `aes-${Buffer.byteLength(hashKey, "utf8") * 8}-ecb`;
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(hashKey, "utf8"), null);
  cipher.setAutoPadding(true);
  return Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]).toString("base64");
}

export function createEasyPaisaCheckout(input: {
  orderNumber: string; amountInPaisas: number; callbackUrl: string; email: string; phone: string;
}) {
  if (!Number.isSafeInteger(input.amountInPaisas) || input.amountInPaisas <= 0) throw new Error("Invalid payment amount.");
  if (!/^https:\/\//.test(input.callbackUrl)) throw new Error("EasyPaisa callback URL must use HTTPS.");
  const { storeId, hashKey } = config();
  const fields: EasyPaisaFields = {
    amount: (input.amountInPaisas / 100).toFixed(2),
    autoRedirect: "1",
    emailAddr: input.email,
    expiryDate: expiryDate(),
    mobileNum: input.phone,
    orderRefNum: input.orderNumber,
    paymentMethod: process.env.EASYPAISA_PAYMENT_METHOD || "MA_PAYMENT_METHOD",
    postBackURL: input.callbackUrl,
    storeId,
  };
  return { url: getEasyPaisaCheckoutUrl(), fields: { ...fields, merchantHashedReq: encryptRequest(fields, hashKey) } };
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

// EasyPaisa's current callback signature is an HMAC-SHA256 Base64 value over these
// response fields. The merchant portal is the source of truth for the enabled flow.
export function verifyEasyPaisaCallback(fields: EasyPaisaFields) {
  const { storeId, hashKey } = config();
  const signature = fields.merchantHashedResp || fields.merchantHashedResponse || fields.signature;
  if (!signature || fields.storeId !== storeId) return false;
  const orderRefNum = fields.orderRefNum || fields.orderRefNumber || fields.orderId || "";
  const responseCode = fields.responseCode || fields.status || "";
  const responseDesc = fields.responseDesc || fields.desc || "";
  const payload = `orderRefNum=${orderRefNum}&responseCode=${responseCode}&responseDesc=${responseDesc}&storeId=${storeId}`;
  const expected = crypto.createHmac("sha256", hashKey).update(payload).digest("base64");
  return safeEqual(signature, expected);
}

export function easyPaisaOrderReference(fields: EasyPaisaFields) {
  return fields.orderRefNum || fields.orderRefNumber || fields.orderId || "";
}

export function easyPaisaSucceeded(fields: EasyPaisaFields) {
  return fields.responseCode === "0000" || /^success$/i.test(fields.status || "");
}

export function easyPaisaCancelled(fields: EasyPaisaFields) {
  return /cancel/i.test(`${fields.responseCode || ""} ${fields.responseDesc || ""} ${fields.status || ""} ${fields.desc || ""}`);
}
