import { NextRequest, NextResponse } from "next/server";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 0. Check if this is a protected route or change-password route ──
  const isProtectedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/volunteer") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/profile");

  const isChangePassword = pathname === "/change-password";

  // Skip session fetch and parsing for public routes
  if (!isProtectedRoute && !isChangePassword) {
    return NextResponse.next();
  }

  const cookieHeader = request.headers.get("cookie") || "";

  let sessionData: any = null;
  try {
    const response = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
      headers: {
        cookie: cookieHeader,
      },
    });
    if (response.ok) {
      sessionData = await response.json();
    }
  } catch (error) {
    console.error("Proxy session verification error:", error);
  }

  const session = sessionData?.session;
  const user = sessionData?.user;

  // ── 1. /change-password — requires a session; skip if not logged in ──────
  if (isChangePassword) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // If they don't actually need to change their password, send them home.
    if (!user?.mustChangePassword) {
      const role = user?.role;
      if (role === "ADMIN") return NextResponse.redirect(new URL("/admin", request.url));
      if (role === "VOLUNTEER") return NextResponse.redirect(new URL("/volunteer", request.url));
      return NextResponse.redirect(new URL("/student", request.url));
    }
    return NextResponse.next();
  }

  // ── 2. Unauthenticated guard ──────────────────────────────────────────────
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── 3. mustChangePassword — intercept before any dashboard access ─────────
  if (user?.mustChangePassword) {
    return NextResponse.redirect(new URL("/change-password", request.url));
  }

  // ── 4. Role-based checks ──────────────────────────────────────────────────
  if (pathname.startsWith("/admin") && user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (pathname.startsWith("/volunteer") && user?.role !== "VOLUNTEER" && user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (pathname.startsWith("/student") && user?.role !== "STUDENT" && user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/volunteer/:path*",
    "/student/:path*",
    "/profile",
    "/change-password",
  ],
};
