import { NextRequest, NextResponse } from "next/server";

// Edge-safe, best-effort check of a JWT's shape and expiry. This does NOT verify the
// signature (Node crypto/jsonwebtoken can't run in the Edge middleware runtime) — the real
// gate is verifyToken() inside each /api/admin route. This only stops an expired or malformed
// cookie from producing misleading redirects (e.g. bouncing to a dashboard that immediately
// kicks you back to login).
function tokenLooksLive(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const live = tokenLooksLive(req.cookies.get("admin_token")?.value);

  if (pathname === "/admin" && live) {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  if (pathname.startsWith("/api/admin") && pathname !== "/api/admin/login" && pathname !== "/api/admin/logout") {
    if (!live) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (pathname.startsWith("/admin/dashboard") || pathname.startsWith("/admin/orders")) {
    if (!live) return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
