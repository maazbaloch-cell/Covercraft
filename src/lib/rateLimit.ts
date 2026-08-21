import { NextRequest } from "next/server";

type Entry = { count: number; resetAt: number };
const buckets = new Map<string, Entry>();

// The Map lives in a single server process, so limits are per-instance and reset on redeploy.
// That's adequate for a single-instance deployment; for horizontally-scaled production use a
// shared store (e.g. Upstash Redis) keyed the same way. See docs/PRODUCTION-READINESS.
let lastSweep = 0;
const SWEEP_INTERVAL_MS = 60_000;

// Drop expired buckets so the Map can't grow unbounded under a spray of unique keys/IPs.
function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

/** A lightweight in-memory guard. Synchronous by design so callers can gate without awaiting. */
export function isRateLimited(req: NextRequest, scope: string, limit = 10, windowMs = 60_000) {
  // Prefer the platform-derived client IP (Vercel sets req.ip / x-real-ip at the edge, which a
  // client cannot forge); fall back to the left-most x-forwarded-for only when neither is set.
  const ip = req.ip || req.headers.get("x-real-ip")?.trim() || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = `${scope}:${ip || "unknown"}`;
  const now = Date.now();
  sweep(now);
  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}
