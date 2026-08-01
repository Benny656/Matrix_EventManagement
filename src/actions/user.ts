"use server";

import { revalidatePath } from "next/cache";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { verifyAdmin, verifyStaff, getCurrentUser, Role } from "@/lib/auth-session";
import crypto from "crypto";

// ─── User listing ─────────────────────────────────────────────────────────────

export async function getUsersAction(search?: string, roleFilter?: string) {
  await verifyStaff();

  let query = adminDb.collection("users");

  if (roleFilter && roleFilter !== "ALL") {
    query = query.where("role", "==", roleFilter) as any;
  }

  const snapshot = await query.get();
  let users = snapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || "",
      email: data.email || "",
      rollNumber: data.rollNumber || null,
      phoneNumber: data.phoneNumber || null,
      department: data.department || null,
      programType: data.programType || null,
      degree: data.degree || null,
      yearOfStudy: data.yearOfStudy || null,
      role: (data.role as Role) || "STUDENT",
      onboardingCompleted: data.onboardingCompleted ?? false,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || null,
      mustChangePassword: data.mustChangePassword || false,
    };
  });

  if (search) {
    const lowerSearch = search.toLowerCase();
    users = users.filter(
      (u: any) =>
        u.name.toLowerCase().includes(lowerSearch) ||
        u.email.toLowerCase().includes(lowerSearch) ||
        (u.rollNumber && u.rollNumber.toLowerCase().includes(lowerSearch)) ||
        (u.department && u.department.toLowerCase().includes(lowerSearch)) ||
        (u.degree && u.degree.toLowerCase().includes(lowerSearch))
    );
  }

  users.sort((a: any, b: any) => a.name.localeCompare(b.name));
  return users;
}

export interface AdminUpdateUserProfileInput {
  name?: string;
  rollNumber?: string | null;
  phoneNumber?: string | null;
  department?: string | null;
  programType?: "UG" | "PG" | string | null;
  degree?: string | null;
  yearOfStudy?: string | null;
  role?: Role;
}

export async function updateUserProfileAdminAction(userId: string, input: AdminUpdateUserProfileInput) {
  const currentUser = await verifyAdmin();

  const userDoc = await adminDb.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    throw new Error("User not found.");
  }

  const existingData = userDoc.data() || {};

  // Safety check: prevent changing own role away from ADMIN/FACULTY_ADMIN
  if (userId === currentUser.id && input.role && input.role !== currentUser.role) {
    throw new Error("Safety lock: You cannot modify your own administrator role.");
  }

  const updates: Record<string, any> = {
    updatedAt: new Date().toISOString(),
  };

  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (!trimmed) throw new Error("Full name cannot be empty.");
    updates.name = trimmed;
  }

  if (input.rollNumber !== undefined) {
    updates.rollNumber = input.rollNumber ? input.rollNumber.trim().toUpperCase() : null;
  }

  if (input.phoneNumber !== undefined) {
    if (input.phoneNumber) {
      const cleanedPhone = input.phoneNumber.replace(/\D/g, "");
      if (cleanedPhone && !/^[6-9]\d{9}$/.test(cleanedPhone)) {
        throw new Error("Phone number must be a valid 10-digit mobile number starting with 6-9.");
      }
      updates.phoneNumber = cleanedPhone || null;
    } else {
      updates.phoneNumber = null;
    }
  }

  if (input.department !== undefined) {
    updates.department = input.department ? input.department.trim() : null;
  }

  if (input.programType !== undefined) {
    updates.programType = input.programType || null;
  }

  if (input.degree !== undefined) {
    updates.degree = input.degree ? input.degree.trim() : null;
  }

  if (input.yearOfStudy !== undefined) {
    updates.yearOfStudy = input.yearOfStudy || null;
  }

  if (input.role !== undefined && input.role !== existingData.role) {
    updates.role = input.role;
    try {
      await adminAuth.setCustomUserClaims(userId, { role: input.role });
    } catch (err) {
      console.error("Failed to set custom claims:", err);
    }
  }

  await adminDb.collection("users").doc(userId).update(updates);

  revalidatePath("/admin/users");
  revalidatePath("/volunteer/users");
  return { success: true };
}

// ─── Role management (Admin only) ─────────────────────────────────────────────

export async function updateUserRoleAction(userId: string, newRole: Role) {
  const currentUser = await verifyAdmin();

  // Safety check: prevent self-demotion
  if (userId === currentUser.id) {
    throw new Error("Safety lock: You cannot modify your own administrator role.");
  }

  await adminDb.collection("users").doc(userId).update({
    role: newRole,
    updatedAt: new Date().toISOString(),
  });

  // Set custom claims in Firebase Auth as well
  try {
    await adminAuth.setCustomUserClaims(userId, { role: newRole });
  } catch (err) {
    console.error("Failed to set custom claims:", err);
  }

  revalidatePath("/admin/users");
  return { success: true };
}

// ─── Password reset (Admin or Volunteer) ──────────────────────────────────────

/** Generates a cryptographically secure temporary password: 12 chars, mixed case + digits. */
function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;

  const pick = (chars: string) => chars[crypto.randomInt(chars.length)];

  const guaranteed = [pick(upper), pick(lower), pick(digits)];
  const rest = Array.from({ length: 9 }, () => pick(all));

  const chars = [...guaranteed, ...rest];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

export async function resetUserPasswordAction(userId: string) {
  const caller = await verifyStaff();

  if (userId === caller.id) {
    throw new Error("Use the Profile settings to change your own password.");
  }

  const tempPassword = generateTempPassword();

  // Update password in Firebase Auth
  await adminAuth.updateUser(userId, {
    password: tempPassword,
  });

  // Mark the user as needing a password change on next login
  await adminDb.collection("users").doc(userId).update({
    mustChangePassword: true,
    updatedAt: new Date().toISOString(),
  });

  revalidatePath("/admin/users");
  revalidatePath("/volunteer/users");

  return { success: true, tempPassword };
}

// ─── Forced first-login password change ───────────────────────────────────────

export async function forceSetNewPasswordAction(newPassword: string) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("Unauthorized. You must be logged in.");
  }

  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  await adminAuth.updateUser(currentUser.id, {
    password: newPassword,
  });

  await adminDb.collection("users").doc(currentUser.id).update({
    mustChangePassword: false,
    updatedAt: new Date().toISOString(),
  });

  return { success: true };
}
