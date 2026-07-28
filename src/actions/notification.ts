"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth-session";

async function verifyUser() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("Unauthorized. Active session required.");
  }
  return currentUser;
}

export async function getNotificationsAction() {
  const user = await verifyUser();

  const snapshot = await adminDb
    .collection("notifications")
    .where("userId", "==", user.id)
    .get();

  const notifications = snapshot.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    };
  });

  notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return notifications;
}

export async function getUnreadNotificationCountAction() {
  const user = await verifyUser();

  const snapshot = await adminDb
    .collection("notifications")
    .where("userId", "==", user.id)
    .where("read", "==", false)
    .get();

  return snapshot.size;
}

export async function markNotificationReadAction(id: string) {
  const user = await verifyUser();

  const docRef = adminDb.collection("notifications").doc(id);
  const doc = await docRef.get();

  if (doc.exists && doc.data()?.userId === user.id) {
    await docRef.update({ read: true });
  }

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

  const snapshot = await adminDb
    .collection("notifications")
    .where("userId", "==", user.id)
    .where("read", "==", false)
    .get();

  if (!snapshot.empty) {
    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();
  }

  revalidatePath("/student");
  revalidatePath("/volunteer");
  revalidatePath("/admin");
  revalidatePath("/student/notifications");
  revalidatePath("/volunteer/notifications");
  revalidatePath("/admin/notifications");

  return { success: true };
}
