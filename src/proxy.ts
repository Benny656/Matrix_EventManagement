import { NextRequest, NextResponse } from "next/server";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  // ── 0. /change-password — requires a session; skip if not logged in ──────
  if (pathname === "/change-password") {
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

  // ── 1. Unauthenticated guard ──────────────────────────────────────────────
  const isProtectedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/volunteer") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/profile");

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── 2. mustChangePassword — intercept before any dashboard access ─────────
  if (isProtectedRoute && user?.mustChangePassword) {
    return NextResponse.redirect(new URL("/change-password", request.url));
  }

  // ── 3. Role-based checks ──────────────────────────────────────────────────
  if (pathname.startsWith("/admin") && user?.role !== "ADMIN") {
    if (user?.role === "VOLUNTEER") return NextResponse.redirect(new URL("/volunteer", request.url));
    if (user?.role === "STUDENT") return NextResponse.redirect(new URL("/student", request.url));
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/volunteer") && user?.role !== "VOLUNTEER") {
    // Admins can access volunteer routes
    if (user?.role === "ADMIN") return NextResponse.next();
    if (user?.role === "STUDENT") return NextResponse.redirect(new URL("/student", request.url));
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/student") && user?.role !== "STUDENT") {
    // Admins can access student routes
    if (user?.role === "ADMIN") return NextResponse.next();
    if (user?.role === "VOLUNTEER") return NextResponse.redirect(new URL("/volunteer", request.url));
    return NextResponse.redirect(new URL("/login", request.url));
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
