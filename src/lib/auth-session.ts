import { cookies, headers } from "next/headers";
import { adminAuth, adminDb } from "./firebase-admin";

export type Role = "ADMIN" | "VOLUNTEER" | "STUDENT";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  image?: string | null;
  rollNumber?: string | null;
  role: Role;
  phoneNumber?: string | null;
  mustChangePassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__session")?.value || cookieStore.get("token")?.value;
    
    let uid: string | null = null;

    if (token) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        uid = decodedToken.uid;
      } catch (err) {
        // Token verification failed or expired
      }
    }

    if (!uid) {
      // Check Authorization header fallback
      const reqHeaders = await headers();
      const authHeader = reqHeaders.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const bearerToken = authHeader.split("Bearer ")[1];
        try {
          const decoded = await adminAuth.verifyIdToken(bearerToken);
          uid = decoded.uid;
        } catch {}
      }
    }

    if (!uid) return null;

    // Fetch user document from Firestore
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return null;
    }

    const data = userDoc.data() as any;
    return {
      id: userDoc.id,
      name: data.name || "User",
      email: data.email || "",
      emailVerified: data.emailVerified || false,
      image: data.image || null,
      rollNumber: data.rollNumber || null,
      role: (data.role as Role) || "STUDENT",
      phoneNumber: data.phoneNumber || null,
      mustChangePassword: data.mustChangePassword || false,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}

export async function verifyAdmin(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized. Active session required.");
  }
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden. Admin rights required.");
  }
  return user;
}

export async function verifyStaff(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized. Active session required.");
  }
  if (user.role !== "ADMIN" && user.role !== "VOLUNTEER") {
    throw new Error("Forbidden. Staff rights required.");
  }
  return user;
}

export async function verifyStudent(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized. Active session required.");
  }
  return user;
}
