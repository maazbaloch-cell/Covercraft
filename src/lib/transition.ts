/**
 * Cross-route transition handoff (Phase 6).
 *
 * The Sports world (home) and the catalog (/shop) live on separate routes, so a
 * "single continuous camera move" between them is faked with two coordinated
 * overlays: the launch side (CoverWorlds) covers the screen with an emerald
 * "dive", then the arrival side (CatalogArrival) starts fully covered and pulls
 * away. This module is the one-shot contract that hands the intent across the
 * navigation — a session-scoped flag armed right before router.push and
 * consumed exactly once on the catalog.
 *
 * sessionStorage (not a URL param) keeps it out of the address bar and away from
 * the catalog's ?category= filter + SSR. All access is guarded for SSR.
 */

const SPORTS_DIVE_KEY = "covercraft:sports-dive";

/** Arm the dive handoff. Call synchronously right before navigating to /shop. */
export function armSportsDive(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SPORTS_DIVE_KEY, "1");
  } catch {
    // Private-mode / storage-disabled: the transition simply degrades to a
    // plain navigation. Never let a storage error break the click.
  }
}

/**
 * Read and clear the dive flag. Returns true at most once per arming, so the
 * arrival animation plays only when we actually came from the Sports dive.
 */
export function consumeSportsDive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const armed = window.sessionStorage.getItem(SPORTS_DIVE_KEY) === "1";
    if (armed) window.sessionStorage.removeItem(SPORTS_DIVE_KEY);
    return armed;
  } catch {
    return false;
  }
}

/**
 * Product-entry FLIP handoff (Phase 9).
 *
 * Clicking a product card should read as the card's cover image flying into the
 * product-detail hero — one continuous move across the /shop → /products/[id]
 * route boundary. Unlike the Sports dive (a boolean), this carries a payload:
 * the clicked image's viewport rect + resolved src + corner radius, captured
 * synchronously on click. The receiver (<ProductFlip>) reads it once on the
 * detail page and animates a ghost from that rect to the hero's rect.
 *
 * Same session-scoped, SSR-guarded, storage-error-tolerant contract as the
 * Sports dive; the freshness timestamp lets the receiver ignore a stale flag
 * from an abandoned/slow navigation so a flip never plays out of context.
 */
const PRODUCT_FLIP_KEY = "covercraft:product-flip";

export interface ProductFlipPayload {
  id: string;
  src: string;
  /** Viewport-relative rect of the source image (getBoundingClientRect). */
  rect: { top: number; left: number; width: number; height: number };
  /** Corner radius (px) of the source image container, so the ghost matches. */
  radius: number;
  /** Capture time (epoch ms); the receiver ignores stale payloads. */
  ts: number;
}

/** Arm the flip handoff. Call synchronously on the card click, before navigating. */
export function armProductFlip(payload: ProductFlipPayload): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PRODUCT_FLIP_KEY, JSON.stringify(payload));
  } catch {
    // Storage disabled / quota: degrade to a plain navigation. Never break the click.
  }
}

/**
 * Read and clear the flip payload. Returns it at most once per arming, and only
 * when fresh (armed within `maxAgeMs`) so a slow or abandoned navigation can't
 * replay an out-of-context flip.
 */
export function consumeProductFlip(maxAgeMs = 1200): ProductFlipPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PRODUCT_FLIP_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(PRODUCT_FLIP_KEY);
    const payload = JSON.parse(raw) as ProductFlipPayload;
    if (!payload || typeof payload.ts !== "number") return null;
    // `Date.now()` here runs only in the browser at consume time (never SSR).
    if (Date.now() - payload.ts > maxAgeMs) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Peek — WITHOUT consuming — whether any bespoke cross-route transition is armed
 * for the arriving navigation (the Sports dive or the product FLIP). The global
 * page fade (template.tsx) uses this to step aside so it never dims the fixed
 * arrival overlay those transitions depend on. The real consumers
 * (consumeSportsDive / consumeProductFlip) still read + clear the flag, so this
 * peek leaves nothing stale behind.
 */
export function hasArmedTransition(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.sessionStorage.getItem(SPORTS_DIVE_KEY) !== null ||
      window.sessionStorage.getItem(PRODUCT_FLIP_KEY) !== null
    );
  } catch {
    return false;
  }
}
