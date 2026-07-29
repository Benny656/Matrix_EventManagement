"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth-session";
import * as z from "zod";

const sessionSchema = z.object({
  title: z.string().min(2, "Session title is required"),
  venue: z.string().min(2, "Session venue is required"),
  startTime: z.string().or(z.date()).transform((val) => new Date(val)),
  endTime: z.string().or(z.date()).transform((val) => new Date(val)),
});

const whatsappInviteLinkSchema = z
  .string()
  .nullable()
  .optional()
  .refine(
    (val) => {
      if (!val || val.trim() === "") return true;
      const trimmed = val.trim();
      return (
        trimmed.startsWith("https://chat.whatsapp.com/") ||
        trimmed.startsWith("https://www.whatsapp.com/channel/")
      );
    },
    {
      message:
        "WhatsApp invite link must start with https://chat.whatsapp.com/ or https://www.whatsapp.com/channel/",
    }
  );

const eventSchema = z.object({
  title: z.string().min(2, "Event title is required"),
  description: z.string().min(5, "Event description must be at least 5 characters"),
  posterUrl: z.string().optional().nullable(),
  venue: z.string().min(2, "Event venue is required"),
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  registrationOpen: z.boolean().default(true),
  maxParticipants: z.number().min(1, "Capacity must be at least 1"),
  category: z.string().min(2, "Category is required"),
  coordinatorName: z.string().min(2, "Coordinator name is required"),
  whatsappInviteLink: whatsappInviteLinkSchema,
  sessions: z.array(sessionSchema).optional().default([]),
});

export type EventInput = z.infer<typeof eventSchema>;

async function verifyAuth(allowedRoles: ("ADMIN" | "FACULTY_ADMIN" | "VOLUNTEER")[]) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (!allowedRoles.includes(currentUser.role as any) && currentUser.role !== "ADMIN" && currentUser.role !== "FACULTY_ADMIN")) {
    throw new Error("Unauthorized. Insufficient permissions.");
  }
  return currentUser;
}

export async function createEventAction(input: EventInput) {
  const user = await verifyAuth(["ADMIN", "FACULTY_ADMIN"]);
  const validated = eventSchema.parse(input);

  const eventRef = adminDb.collection("events").doc();
  const eventId = eventRef.id;

  const sessionList = validated.sessions.map((s) => {
    const sRef = adminDb.collection("sessions").doc();
    return {
      id: sRef.id,
      eventId,
      title: s.title,
      venue: s.venue,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const batch = adminDb.batch();

  batch.set(eventRef, {
    id: eventId,
    title: validated.title,
    description: validated.description,
    posterUrl: validated.posterUrl || null,
    venue: validated.venue,
    date: validated.date.toISOString(),
    registrationOpen: validated.registrationOpen,
    maxParticipants: validated.maxParticipants,
    category: validated.category,
    coordinatorName: validated.coordinatorName,
    whatsappInviteLink: validated.whatsappInviteLink ? validated.whatsappInviteLink.trim() : null,
    createdById: user.id,
    status: "UPCOMING",
    archivedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  for (const session of sessionList) {
    batch.set(adminDb.collection("sessions").doc(session.id), session);
  }

  await batch.commit();

  // Create notifications for users
  try {
    const usersSnapshot = await adminDb.collection("users").get();
    const registrationStr = validated.registrationOpen
      ? " Registration is open."
      : " Registration is currently closed.";

    const notifBatch = adminDb.batch();
    usersSnapshot.docs.forEach((uDoc) => {
      const nRef = adminDb.collection("notifications").doc();
      notifBatch.set(nRef, {
        id: nRef.id,
        userId: uDoc.id,
        type: "NEW_EVENT",
        message: `New event published: ${validated.title}.${registrationStr}`,
        read: false,
        linkUrl: `/student/events/${eventId}`,
        createdAt: new Date().toISOString(),
      });
    });
    await notifBatch.commit();
  } catch (err) {
    console.error("Failed to create new event notifications:", err);
  }

  revalidatePath("/student");
  revalidatePath("/volunteer");
  revalidatePath("/admin");
  return { success: true, eventId };
}

export async function updateEventAction(id: string, input: Omit<EventInput, "sessions">) {
  await verifyAuth(["ADMIN", "FACULTY_ADMIN"]);

  const baseSchema = eventSchema.omit({ sessions: true });
  const validated = baseSchema.parse(input);

  await adminDb.collection("events").doc(id).update({
    title: validated.title,
    description: validated.description,
    posterUrl: validated.posterUrl || null,
    venue: validated.venue,
    date: validated.date.toISOString(),
    registrationOpen: validated.registrationOpen,
    maxParticipants: validated.maxParticipants,
    category: validated.category,
    coordinatorName: validated.coordinatorName,
    whatsappInviteLink: validated.whatsappInviteLink ? validated.whatsappInviteLink.trim() : null,
    updatedAt: new Date().toISOString(),
  });

  revalidatePath(`/student/events/${id}`);
  revalidatePath(`/faculty/events/${id}`);
  revalidatePath(`/volunteer/events/${id}`);
  revalidatePath("/volunteer/events");
  revalidatePath("/admin/events");
  return { success: true };
}

export async function updateEventWhatsappLinkAction(id: string, whatsappInviteLink: string | null) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "FACULTY_ADMIN")) {
    throw new Error("Unauthorized. Only Admin or Faculty Admin can edit the WhatsApp invite link.");
  }

  const validatedLink = whatsappInviteLinkSchema.parse(whatsappInviteLink);
  const finalLink = validatedLink && validatedLink.trim() !== "" ? validatedLink.trim() : null;

  await adminDb.collection("events").doc(id).update({
    whatsappInviteLink: finalLink,
    updatedAt: new Date().toISOString(),
  });

  revalidatePath(`/student/events/${id}`);
  revalidatePath(`/faculty/events/${id}`);
  revalidatePath(`/admin/events/${id}`);
  revalidatePath("/faculty/events");
  revalidatePath("/admin/events");

  return { success: true };
}

export async function updateEventRegistrationStatusAction(id: string, registrationOpen: boolean) {
  await verifyAuth(["ADMIN"]);

  await adminDb.collection("events").doc(id).update({
    registrationOpen: registrationOpen,
    updatedAt: new Date().toISOString(),
  });

  revalidatePath(`/student/events/${id}`);
  revalidatePath(`/faculty/events/${id}`);
  revalidatePath(`/admin/events/${id}`);
  revalidatePath("/faculty/events");
  revalidatePath("/admin/events");
  return { success: true };
}

export async function updateEventCapacityAction(id: string, maxParticipants: number) {
  await verifyAuth(["ADMIN"]);

  if (!maxParticipants || maxParticipants < 1) {
    throw new Error("Capacity must be at least 1.");
  }

  const eventDoc = await adminDb.collection("events").doc(id).get();
  if (!eventDoc.exists) {
    throw new Error("Event not found.");
  }

  const eventData = eventDoc.data() as any;

  // Fetch confirmed registration count
  const regSnapshot = await adminDb
    .collection("registrations")
    .where("eventId", "==", id)
    .where("status", "==", "REGISTERED")
    .get();

  const confirmedCount = regSnapshot.size;

  if (maxParticipants < confirmedCount) {
    throw new Error(`Capacity cannot be set below current confirmed registrations (${confirmedCount}).`);
  }

  await adminDb.collection("events").doc(id).update({
    maxParticipants,
    updatedAt: new Date().toISOString(),
  });

  // Check waitlist promotion
  const availableSpots = maxParticipants - confirmedCount;
  if (availableSpots > 0) {
    const waitlistSnapshot = await adminDb
      .collection("registrations")
      .where("eventId", "==", id)
      .where("status", "==", "WAITLISTED")
      .get();

    const waitlistedDocs = waitlistSnapshot.docs;
    waitlistedDocs.sort((a, b) => (a.data().createdAt || "").localeCompare(b.data().createdAt || ""));
    const promoted = waitlistedDocs.slice(0, availableSpots);

    if (promoted.length > 0) {
      const batch = adminDb.batch();
      promoted.forEach((rDoc) => {
        batch.update(rDoc.ref, { status: "REGISTERED" });
        const nRef = adminDb.collection("notifications").doc();
        batch.set(nRef, {
          id: nRef.id,
          userId: rDoc.data().studentId,
          type: "REGISTRATION_CONFIRMED",
          message: `Good news! You have been promoted from the waitlist and registered for ${eventData.title}.`,
          read: false,
          linkUrl: `/student/events/${id}`,
          createdAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    }
  }

  revalidatePath(`/student/events/${id}`);
  revalidatePath(`/volunteer/events/${id}`);
  revalidatePath(`/admin/events/${id}`);
  revalidatePath("/volunteer/events");
  revalidatePath("/admin/events");

  return { success: true };
}

export async function archiveEventAction(id: string) {
  await verifyAuth(["ADMIN"]);

  await adminDb.collection("events").doc(id).update({
    status: "ARCHIVED",
    archivedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  revalidatePath("/student");
  revalidatePath("/volunteer");
  revalidatePath("/admin");
  revalidatePath(`/student/events/${id}`);
  revalidatePath(`/volunteer/events/${id}`);
  return { success: true };
}

export async function getEventsAction(includeArchived = false) {
  let query = adminDb.collection("events");

  const snapshot = await query.get();
  const now = new Date();

  const sessionsSnapshot = await adminDb.collection("sessions").get();
  const allSessions = sessionsSnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[];

  const registrationsSnapshot = await adminDb.collection("registrations").get();
  const allRegistrations = registrationsSnapshot.docs.map((d: any) => d.data()) as any[];

  let events = snapshot.docs.map((doc: any) => {
    const data = doc.data() as any;
    const eventSessions = allSessions.filter((s: any) => s.eventId === doc.id);
    const regCount = allRegistrations.filter((r: any) => r.eventId === doc.id && r.status === "REGISTERED").length;

    return {
      ...data,
      id: doc.id,
      date: new Date(data.date),
      registrationOpen: data.registrationOpen ?? true,
      sessions: eventSessions.map((s: any) => ({
        ...s,
        startTime: new Date(s.startTime),
        endTime: new Date(s.endTime),
      })),
      _count: {
        registrations: regCount,
      },
    };
  });

  if (!includeArchived) {
    events = events.filter((e: any) => e.status !== "ARCHIVED");
  }

  // Dynamically update status based on current time
  const updatedEvents = await Promise.all(
    events.map(async (event: any) => {
      if (event.status === "ARCHIVED") return event;

      let newStatus: "UPCOMING" | "ONGOING" | "COMPLETED" = "UPCOMING";

      const hasOngoingSession = event.sessions.some(
        (s: any) => now >= s.startTime && now <= s.endTime
      );
      const allSessionsFinished = event.sessions.every((s: any) => now > s.endTime);

      if (hasOngoingSession) {
        newStatus = "ONGOING";
      } else if (allSessionsFinished && event.sessions.length > 0) {
        newStatus = "COMPLETED";
      }

      if (newStatus !== event.status) {
        await adminDb.collection("events").doc(event.id).update({
          status: newStatus,
          updatedAt: new Date().toISOString(),
        });
        event.status = newStatus;
      }

      return event;
    })
  );

  updatedEvents.sort((a: any, b: any) => a.date.getTime() - b.date.getTime());
  return updatedEvents;
}
