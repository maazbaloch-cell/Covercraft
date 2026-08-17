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
