"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth-session";

async function verifyStaff() {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "VOLUNTEER" && currentUser.role !== "ADMIN")) {
    throw new Error("Unauthorized. Staff access required.");
  }
  return currentUser;
}

export async function postUpdateAction(params: {
  scope: "EVENT" | "DEPARTMENT";
  eventId?: string;
  content: string;
}) {
  const staff = await verifyStaff();
  const { scope, eventId, content } = params;

  if (scope === "EVENT" && !eventId) {
    throw new Error("Event selection is required for event-scoped updates.");
  }

  let eventTitle = "Event";
  if (eventId) {
    const eDoc = await adminDb.collection("events").doc(eventId).get();
    if (eDoc.exists) {
      eventTitle = eDoc.data()?.title || "Event";
    }
  }

  const updateRef = adminDb.collection("updates").doc();
  const updateData = {
    id: updateRef.id,
    authorId: staff.id,
    scope,
    eventId: scope === "EVENT" ? eventId : null,
    content,
    attachmentUrls: [],
    createdAt: new Date().toISOString(),
  };

  await updateRef.set(updateData);

  // Dispatch Notifications
  if (scope === "EVENT" && eventId) {
    const regSnapshot = await adminDb
      .collection("registrations")
      .where("eventId", "==", eventId)
      .get();

    const recipientIds = regSnapshot.docs
      .map((d) => d.data())
      .filter((r) => r.status === "REGISTERED" || r.status === "WAITLISTED")
      .map((r) => r.studentId);

    if (recipientIds.length > 0) {
      const batch = adminDb.batch();
      recipientIds.forEach((uid) => {
        const nRef = adminDb.collection("notifications").doc();
        batch.set(nRef, {
          id: nRef.id,
          userId: uid,
          type: "UPDATE_POSTED",
          message: `[${eventTitle}] Update posted: "${content.slice(0, 60)}..."`,
          read: false,
          linkUrl: `/student/events/${eventId}`,
          createdAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    }
  } else {
    const usersSnapshot = await adminDb
      .collection("users")
      .where("role", "==", "STUDENT")
      .get();

    if (!usersSnapshot.empty) {
      const batch = adminDb.batch();
      usersSnapshot.docs.forEach((uDoc) => {
        const nRef = adminDb.collection("notifications").doc();
        batch.set(nRef, {
          id: nRef.id,
          userId: uDoc.id,
          type: "UPDATE_POSTED",
          message: `Department Announcement: "${content.slice(0, 65)}..."`,
          read: false,
          linkUrl: `/student/updates`,
          createdAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    }
  }

  revalidatePath("/student");
  revalidatePath("/student/updates");
  revalidatePath("/volunteer/updates");
  revalidatePath("/admin/updates");
  if (eventId) {
    revalidatePath(`/student/events/${eventId}`);
  }

  return { success: true };
}

export async function getUpdatesAction(eventId?: string) {
  let query = adminDb.collection("updates");

  if (eventId) {
    query = query.where("eventId", "==", eventId) as any;
  }

  const snapshot = await query.get();

  const usersSnapshot = await adminDb.collection("users").get();
  const userMap = new Map<string, any>();
  usersSnapshot.docs.forEach((d: any) => userMap.set(d.id, d.data()));

  const eventsSnapshot = await adminDb.collection("events").get();
  const eventMap = new Map<string, any>();
  eventsSnapshot.docs.forEach((d: any) => eventMap.set(d.id, d.data()));

  const updates = snapshot.docs.map((doc: any) => {
    const data = doc.data() as any;
    const author = userMap.get(data.authorId);
    const event = data.eventId ? eventMap.get(data.eventId) : null;

    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      author: {
        name: author?.name || "Unknown Staff",
        role: author?.role || "VOLUNTEER",
      },
      event: event ? { title: event.title } : null,
    };
  });

  updates.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
  return updates;
}

export async function getActiveEventOptionsAction() {
  await verifyStaff();
  const snapshot = await adminDb
    .collection("events")
    .where("status", "!=", "ARCHIVED")
    .get();

  const events = snapshot.docs.map((doc) => ({
    id: doc.id,
    title: doc.data().title || "",
  }));

  events.sort((a, b) => a.title.localeCompare(b.title));
  return events;
}
