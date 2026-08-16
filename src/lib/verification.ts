import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getJwtSecret } from "@/lib/jwt";

export type VerificationPurpose = "email_verify" | "password_reset" | "checkout";

/** How long a freshly issued code stays valid. */
const TTL_MINUTES: Record<VerificationPurpose, number> = {
  email_verify: 30,
  password_reset: 20,
  checkout: 10,
};

const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 45_000;

function generateCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * Codes are stored HMAC'd with the server secret, so a database leak alone cannot be used
 * to derive or verify a live code. The email + purpose are mixed in to bind the hash to context.
 */
function hashCode(email: string, purpose: VerificationPurpose, code: string): string {
  return crypto.createHmac("sha256", getJwtSecret()).update(`${purpose}:${email.toLowerCase()}:${code}`).digest("hex");
}

export type IssueResult = { ok: true; code: string } | { ok: false; retryAfterMs: number };

/** Issues a fresh code, invalidating any previous unconsumed code for the same email+purpose. */
export async function issueCode(email: string, purpose: VerificationPurpose): Promise<IssueResult> {
  const normalized = email.toLowerCase();
  const recent = await prisma.verificationCode.findFirst({
    where: { email: normalized, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    const age = Date.now() - recent.createdAt.getTime();
    if (age < RESEND_COOLDOWN_MS) return { ok: false, retryAfterMs: RESEND_COOLDOWN_MS - age };
  }
  await prisma.verificationCode.updateMany({ where: { email: normalized, purpose, consumedAt: null }, data: { consumedAt: new Date() } });
  const code = generateCode();
  await prisma.verificationCode.create({
    data: {
      email: normalized,
      purpose,
      codeHash: hashCode(normalized, purpose, code),
      expiresAt: new Date(Date.now() + TTL_MINUTES[purpose] * 60_000),
    },
  });
  return { ok: true, code };
}

export type VerifyResult = "ok" | "invalid" | "expired" | "locked";

/** Verifies a submitted code. Consumes it on success; counts failures toward a per-code lockout. */
export async function verifyCode(email: string, purpose: VerificationPurpose, code: string): Promise<VerifyResult> {
  const normalized = email.toLowerCase();
  const record = await prisma.verificationCode.findFirst({
    where: { email: normalized, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return "invalid";
  if (record.expiresAt.getTime() < Date.now()) return "expired";
  if (record.attempts >= MAX_ATTEMPTS) return "locked";
  const expected = hashCode(normalized, purpose, code);
  const matches = record.codeHash.length === expected.length && crypto.timingSafeEqual(Buffer.from(record.codeHash), Buffer.from(expected));
  if (!matches) {
    await prisma.verificationCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return "invalid";
  }
  await prisma.verificationCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
  return "ok";
}
