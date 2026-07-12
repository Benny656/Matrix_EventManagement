"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma, Prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/db";

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

export async function getUsersAction(search?: string, roleFilter?: string) {
  await verifyAdmin();

  // (prisma-client-api skill: use Prisma.UserWhereInput instead of `any`)
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
      phone: true,
      role: true,
      createdAt: true,
    },
  });
}

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
