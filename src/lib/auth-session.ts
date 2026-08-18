import { cache } from "react";
import { cookies, headers } from "next/headers";
import { adminAuth, adminDb } from "./firebase-admin";

import { HARDCODED_ADMIN_EMAILS } from "./constants";

export type Role = "ADMIN" | "FACULTY_ADMIN" | "FACULTY" | "STUDENT" | "VOLUNTEER";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  image?: string | null;
  rollNumber?: string | null;
  programType?: "UG" | "PG" | string | null;
  degree?: string | null;
  department?: string | null;
  yearOfStudy?: string | null;
  onboardingCompleted?: boolean;
  role: Role;
  phoneNumber?: string | null;
  mustChangePassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const getCurrentUser = cache(async (): Promise<UserProfile | null> => {
  try {
    // 1. Check if user data was already verified and passed by proxy layer
    try {
      const reqHeaders = await headers();
      const encodedUserData = reqHeaders.get("x-user-data");
      if (encodedUserData) {
        const decodedJson = Buffer.from(encodedUserData, "base64").toString("utf-8");
        const cachedUser = JSON.parse(decodedJson);
        if (cachedUser && cachedUser.id) {
          return cachedUser as UserProfile;
        }
      }
    } catch {}

    const cookieStore = await cookies();
    const token = cookieStore.get("__session")?.value || cookieStore.get("token")?.value;
    
    let uid: string | null = null;

    if (token) {
      try {
        const decodedToken = await adminAuth.verifySessionCookie(token, true);
        uid = decodedToken.uid;
      } catch (err) {
        try {
          const decodedToken = await adminAuth.verifyIdToken(token);
          uid = decodedToken.uid;
        } catch (idErr) {
          // Token verification failed or expired
        }
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
    const isHardcodedAdmin = HARDCODED_ADMIN_EMAILS.includes(data.email?.toLowerCase());

    return {
      id: userDoc.id,
      name: data.name || "User",
      email: data.email || "",
      emailVerified: data.emailVerified || false,
      image: data.image || null,
      rollNumber: data.rollNumber || null,
      programType: data.programType || null,
      degree: data.degree || null,
      department: data.department || null,
      yearOfStudy: data.yearOfStudy || null,
      onboardingCompleted: isHardcodedAdmin ? true : (data.onboardingCompleted ?? undefined),
      role: isHardcodedAdmin ? "ADMIN" : ((data.role as Role) || "STUDENT"),
      phoneNumber: data.phoneNumber || null,
      mustChangePassword: data.mustChangePassword || false,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
});

export async function verifyAdmin(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized. Active session required.");
  }
  if (user.role !== "ADMIN" && user.role !== "FACULTY_ADMIN") {
    throw new Error("Forbidden. Admin rights required.");
  }
  return user;
}

export async function verifyFacultyAdmin(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized. Active session required.");
  }
  if (user.role !== "ADMIN" && user.role !== "FACULTY_ADMIN") {
    throw new Error("Forbidden. Admin rights required.");
  }
  return user;
}

export async function verifyFaculty(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized. Active session required.");
  }
  if (user.role !== "FACULTY" && user.role !== "FACULTY_ADMIN" && user.role !== "ADMIN") {
    throw new Error("Forbidden. Faculty rights required.");
  }
  return user;
}

export async function verifyStaff(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized. Active session required.");
  }
  if (user.role !== "ADMIN" && user.role !== "FACULTY_ADMIN" && user.role !== "VOLUNTEER") {
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
