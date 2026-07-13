"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma, Prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/db";
import crypto from "crypto";

// ─── Auth helpers ─────────────────────────────────────────────────────────────

async function verifyAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized. Active session required.");
  }

  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden. Admin rights required.");
  }

  return session.user;
}

/** Admin or Volunteer — used for actions that both roles should be able to perform. */
async function verifyStaff() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized. Active session required.");
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "VOLUNTEER") {
    throw new Error("Forbidden. Staff rights required.");
  }

  return session.user;
}

// ─── User listing ─────────────────────────────────────────────────────────────

export async function getUsersAction(search?: string, roleFilter?: string) {
  // Both admins and volunteers may list users (for password reset).
  await verifyStaff();

  const whereClause: Prisma.UserWhereInput = {};

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { rollNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  if (roleFilter && roleFilter !== "ALL") {
    whereClause.role = roleFilter as Role;
  }

  return await prisma.user.findMany({
    where: whereClause,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      rollNumber: true,
      role: true,
      createdAt: true,
      mustChangePassword: true,
    },
  });
}

// ─── Role management (Admin only) ─────────────────────────────────────────────

export async function updateUserRoleAction(userId: string, newRole: Role) {
  const currentUser = await verifyAdmin();

  // Safety check: prevent self-demotion
  if (userId === currentUser.id) {
    throw new Error("Safety lock: You cannot modify your own administrator role.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

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

  // Guarantee at least one from each class
  const pick = (chars: string) => chars[crypto.randomInt(chars.length)];

  const guaranteed = [pick(upper), pick(lower), pick(digits)];
  const rest = Array.from({ length: 9 }, () => pick(all));

  // Shuffle with crypto-secure Fisher-Yates
  const chars = [...guaranteed, ...rest];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

/**
 * Generates a temporary password for a user and forces them to change it on next login.
 * Can be called by ADMIN or VOLUNTEER.
 * Returns the plaintext temp password — shown once on screen, not stored.
 */
export async function resetUserPasswordAction(userId: string) {
  const caller = await verifyStaff();

  // A user may not reset their own password this way (use profile settings instead).
  if (userId === caller.id) {
    throw new Error("Use the Profile settings to change your own password.");
  }

  const tempPassword = generateTempPassword();

  // Let Better Auth hash and store the password properly.
  await auth.api.setUserPassword({
    body: { userId, newPassword: tempPassword },
  });

  // Mark the user as needing a password change on next login.
  await prisma.user.update({
    where: { id: userId },
    data: { mustChangePassword: true },
  });

  revalidatePath("/admin/users");
  revalidatePath("/volunteer/users");

  return { success: true, tempPassword };
}

// ─── Forced first-login password change ───────────────────────────────────────

/**
 * Sets a new password for the currently logged-in user and clears the
 * mustChangePassword flag. Used on the /change-password page.
 */
export async function forceSetNewPasswordAction(newPassword: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized. You must be logged in.");
  }

  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  await auth.api.setUserPassword({
    body: { userId: session.user.id, newPassword },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { mustChangePassword: false },
  });

  return { success: true };
}
