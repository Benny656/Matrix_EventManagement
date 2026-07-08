"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function getNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markNotificationRead(
  notificationId: string
): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.userId !== session.user.id) {
      return { success: false, error: "Notification not found" };
    }
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
    revalidatePath("/student/notifications");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("markNotificationRead error:", error);
    return { success: false, error: "Failed to mark notification" };
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();
    await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    });
    revalidatePath("/student/notifications");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("markAllNotificationsRead error:", error);
    return { success: false, error: "Failed to mark notifications" };
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, read: false } });
}
