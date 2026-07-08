import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { UserRole } from "@prisma/client";

// Route → allowed roles mapping
const routeRoles: Record<string, UserRole[]> = {
  "/admin": ["ADMIN"],
  "/volunteer": ["VOLUNTEER", "ADMIN"],
  "/student": ["STUDENT", "ADMIN"],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth routes: redirect to dashboard if already logged in
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password");

  // API auth routes: always allow
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Get session
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Redirect unauthenticated users to login
  if (!session) {
    if (isAuthRoute) return NextResponse.next();
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = (session.user as { role: UserRole }).role ?? "STUDENT";

  // Redirect authenticated users away from auth pages
  if (isAuthRoute) {
    const dashboardUrl = getDashboardUrl(userRole);
    return NextResponse.redirect(new URL(dashboardUrl, request.url));
  }

  // Root redirect
  if (pathname === "/") {
    return NextResponse.redirect(new URL(getDashboardUrl(userRole), request.url));
  }

  // Role-based access control
  for (const [prefix, allowedRoles] of Object.entries(routeRoles)) {
    if (pathname.startsWith(prefix)) {
      if (!allowedRoles.includes(userRole)) {
        // Redirect to their own dashboard
        const dashboardUrl = getDashboardUrl(userRole);
        return NextResponse.redirect(new URL(dashboardUrl, request.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

function getDashboardUrl(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "VOLUNTEER":
      return "/volunteer";
    case "STUDENT":
    default:
      return "/student";
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
