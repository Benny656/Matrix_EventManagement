import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ session: null, user: null }, { status: 200 });
    }

    return NextResponse.json({
      session: {
        id: user.id,
        userId: user.id,
      },
      user,
    });
  } catch (error) {
    return NextResponse.json({ session: null, user: null }, { status: 200 });
  }
}
