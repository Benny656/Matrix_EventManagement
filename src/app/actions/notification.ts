"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

async function verifyUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized. Active session required.");
  }

  return session.user;
}

export async function getNotificationsAction() {
  const user = await verifyUser();

  return await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function markNotificationReadAction(id: string) {
  const user = await verifyUser();

  await prisma.notification.update({
    where: {
      id,
      userId: user.id,
    },
    data: { read: true },
  });

  revalidatePath("/student");
  revalidatePath("/volunteer");
  revalidatePath("/admin");
  revalidatePath("/student/notifications");
  revalidatePath("/volunteer/notifications");
  revalidatePath("/admin/notifications");

  return { success: true };
}

export async function markAllNotificationsReadAction() {
  const user = await verifyUser();

  await prisma.notification.updateMany({
    where: {
      userId: user.id,
      read: false,
    },
    data: { read: true },
  });

  revalidatePath("/student");
  revalidatePath("/volunteer");
  revalidatePath("/admin");
  revalidatePath("/student/notifications");
  revalidatePath("/volunteer/notifications");
  revalidatePath("/admin/notifications");

  return { success: true };
}
