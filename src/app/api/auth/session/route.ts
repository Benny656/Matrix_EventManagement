import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const fourteenDaysInMs = 60 * 60 * 24 * 14 * 1000; // 14 days in milliseconds
    let cookieValue = token;

    try {
      cookieValue = await adminAuth.createSessionCookie(token, {
        expiresIn: fourteenDaysInMs,
      });
    } catch (err) {
      console.warn("createSessionCookie failed, falling back to idToken:", err);
    }

    const response = NextResponse.json({ success: true });
    // Set 14 day cookie
    response.cookies.set("__session", cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Failed to set session" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("__session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
  return response;
}

