import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
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
    console.error("Middleware session verification error:", error);
  }

  const session = sessionData?.session;
  const user = sessionData?.user;

  // 1. Gating unauthenticated users
  const isProtectedRoute = pathname.startsWith("/admin") || pathname.startsWith("/volunteer") || pathname.startsWith("/student");
  
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Role-based checks
  if (pathname.startsWith("/admin") && user?.role !== "ADMIN") {
    // If not admin, redirect to correct role dashboard if available, else to login
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
  ],
};
