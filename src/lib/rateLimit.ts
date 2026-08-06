import { NextRequest } from "next/server";

type Entry = { count: number; resetAt: number };
const buckets = new Map<string, Entry>();

/** A lightweight edge-safe guard. Use a shared store (e.g. Upstash) for multi-instance production deployments. */
export function isRateLimited(req: NextRequest, scope: string, limit = 10, windowMs = 60_000) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = `${scope}:${forwarded || "unknown"}`;
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}
