"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth-session";
import { isEligible } from "@/lib/eligibility";
import type { UserProfile } from "@/lib/auth-session";
import * as z from "zod";

const sessionSchema = z.object({
  title: z.string().min(2, "Session title is required"),
  startTime: z.string().or(z.date()).transform((val) => new Date(val)),
  endTime: z.string().or(z.date()).transform((val) => new Date(val)).optional().nullable(),
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

const eligibilitySchema = z.object({
  targetAudience: z.enum(["ALL", "STUDENTS", "FACULTY", "BOTH"]).default("ALL"),
  degree: z.enum(["UG", "PG", "ALL"]).optional().nullable(),
  degrees: z.array(z.string()).optional().nullable(),
  years: z
    .array(z.string())
    .optional()
    .nullable(),
  departments: z.array(z.string()).optional().nullable(),
});

const eventSchema = z.object({
  title: z.string().min(2, "Event title is required"),
  description: z.string().min(5, "Event description must be at least 5 characters"),
  posterUrl: z.string().optional().nullable(),
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  registrationOpen: z.boolean().default(true),
  maxParticipants: z.number().min(1).optional().nullable(),
  category: z.string().min(2, "Category is required"),
  coordinatorName: z.string().min(2, "Coordinator name is required"),
  whatsappInviteLink: whatsappInviteLinkSchema,
  eligibility: eligibilitySchema.optional().default({ targetAudience: "ALL" }),
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
  const user = await verifyAuth(["ADMIN", "FACULTY_ADMIN", "VOLUNTEER"]);
  const validated = eventSchema.parse(input);

  const eventRef = adminDb.collection("events").doc();
  const eventId = eventRef.id;

  const sessionList = validated.sessions.map((s) => {
    const sRef = adminDb.collection("sessions").doc();
    return {
      id: sRef.id,
      eventId,
      title: s.title,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime ? s.endTime.toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const batch = adminDb.batch();

  const eligibility = validated.eligibility ?? { targetAudience: "ALL" as const };
  const isStudentOrBoth = eligibility.targetAudience === "STUDENTS" || eligibility.targetAudience === "BOTH";
  // Normalise: clear degree/years/departments when not targeting students or both
  const eligibilityToStore = {
    targetAudience: eligibility.targetAudience,
    degree: isStudentOrBoth ? (eligibility.degree ?? "ALL") : null,
    degrees:
      isStudentOrBoth
        ? eligibility.degrees && eligibility.degrees.length > 0
          ? eligibility.degrees
          : eligibility.degree
          ? [eligibility.degree]
          : ["ALL"]
        : null,
    years:
      isStudentOrBoth
        ? eligibility.years && eligibility.years.length > 0
          ? eligibility.years
          : ["ALL"]
        : null,
    departments:
      isStudentOrBoth
        ? eligibility.departments && eligibility.departments.length > 0
          ? eligibility.departments
          : ["ALL"]
        : null,
  };

  batch.set(eventRef, {
    id: eventId,
    title: validated.title,
    description: validated.description,
    posterUrl: validated.posterUrl || null,
    date: validated.date.toISOString(),
    registrationOpen: validated.registrationOpen,
    maxParticipants: validated.maxParticipants,
    category: validated.category,
    coordinatorName: validated.coordinatorName,
    whatsappInviteLink: validated.whatsappInviteLink ? validated.whatsappInviteLink.trim() : null,
    eligibility: eligibilityToStore,
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

  revalidatePath("/student");
  revalidatePath("/volunteer");
  revalidatePath("/admin");
  revalidatePath("/student/events");
  revalidatePath("/volunteer/events");
  revalidatePath("/admin/events");
  revalidatePath("/faculty/events");
  return { success: true, eventId };
}

export async function updateEventAction(id: string, input: Omit<EventInput, "sessions">) {
  await verifyAuth(["ADMIN", "FACULTY_ADMIN"]);

  const baseSchema = eventSchema.omit({ sessions: true });
  const validated = baseSchema.parse(input);

  const eligibility = validated.eligibility ?? { targetAudience: "ALL" as const };
  const isStudentOrBoth = eligibility.targetAudience === "STUDENTS" || eligibility.targetAudience === "BOTH";
  const eligibilityToStore = {
    targetAudience: eligibility.targetAudience,
    degree: isStudentOrBoth ? (eligibility.degree ?? "ALL") : null,
    degrees:
      isStudentOrBoth
        ? eligibility.degrees && eligibility.degrees.length > 0
          ? eligibility.degrees
          : eligibility.degree
          ? [eligibility.degree]
          : ["ALL"]
        : null,
    years:
      isStudentOrBoth
        ? eligibility.years && eligibility.years.length > 0
          ? eligibility.years
          : ["ALL"]
        : null,
    departments:
      isStudentOrBoth
        ? eligibility.departments && eligibility.departments.length > 0
          ? eligibility.departments
          : ["ALL"]
        : null,
  };

  await adminDb.collection("events").doc(id).update({
    title: validated.title,
    description: validated.description,
    posterUrl: validated.posterUrl || null,
    date: validated.date.toISOString(),
    registrationOpen: validated.registrationOpen,
    maxParticipants: validated.maxParticipants,
    category: validated.category,
    coordinatorName: validated.coordinatorName,
    whatsappInviteLink: validated.whatsappInviteLink ? validated.whatsappInviteLink.trim() : null,
    eligibility: eligibilityToStore,
    updatedAt: new Date().toISOString(),
  });

  revalidatePath("/student");
  revalidatePath("/volunteer");
  revalidatePath("/admin");
  revalidatePath(`/student/events/${id}`);
  revalidatePath(`/volunteer/events/${id}`);
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

export async function getEventsAction(
  includeArchived = false,
  requestingUser?: UserProfile | null
) {
  const [snapshot, sessionsSnapshot, registrationsSnapshot] = await Promise.all([
    adminDb.collection("events").get(),
    adminDb.collection("sessions").get(),
    adminDb.collection("registrations").get(),
  ]);

  const now = new Date();
  const allSessions = sessionsSnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[];
  const allRegistrations = registrationsSnapshot.docs.map((d: any) => d.data()) as any[];

  let events = snapshot.docs.map((doc: any) => {
    const data = doc.data() as any;
    const eventSessions = allSessions.filter((s: any) => s.eventId === doc.id);
    const regCount = allRegistrations.filter(
      (r: any) => r.eventId === doc.id && r.status === "REGISTERED" && r.eventRole !== "volunteer"
    ).length;
    const volCount = allRegistrations.filter(
      (r: any) => r.eventId === doc.id && r.status === "REGISTERED" && r.eventRole === "volunteer"
    ).length;

    const isUserRegistered = requestingUser
      ? allRegistrations.some(
          (r: any) =>
            r.eventId === doc.id &&
            r.status === "REGISTERED" &&
            (r.studentId === requestingUser.id || r.FacultyId === requestingUser.id || r.userId === requestingUser.id)
        )
      : false;

    const dateStr = typeof data.date === "string" ? data.date : (data.date ? new Date(data.date).toISOString() : new Date().toISOString());

    return {
      ...data,
      id: doc.id,
      date: dateStr,
      registrationOpen: data.registrationOpen ?? true,
      isUserRegistered,
      sessions: eventSessions.map((s: any) => ({
        ...s,
        startTime: typeof s.startTime === "string" ? s.startTime : (s.startTime ? new Date(s.startTime).toISOString() : new Date().toISOString()),
        endTime: s.endTime ? (typeof s.endTime === "string" ? s.endTime : new Date(s.endTime).toISOString()) : null,
      })),
      _count: {
        registrations: regCount,
        volunteers: volCount,
      },
    };
  });

  if (!includeArchived) {
    events = events.filter((e: any) => e.status !== "ARCHIVED");
  }

  // Apply eligibility filter when a requesting user is provided
  if (requestingUser) {
    events = events.filter((e: any) => isEligible(e, requestingUser));
  }

  // Dynamically update status based on current time (non-blocking async updates)
  const updatedEvents = events.map((event: any) => {
    if (event.status === "ARCHIVED") return event;

    let newStatus: "UPCOMING" | "ONGOING" | "COMPLETED" = "UPCOMING";

    const hasOngoingSession = event.sessions.some(
      (s: any) => {
        const start = s.startTime ? new Date(s.startTime) : null;
        const end = s.endTime ? new Date(s.endTime) : null;
        return start && now >= start && (!end || now <= end);
      }
    );
    const allSessionsFinished =
      event.sessions.length > 0 &&
      event.sessions.every((s: any) => {
        const end = s.endTime ? new Date(s.endTime) : null;
        return end ? now > end : false;
      });

    if (hasOngoingSession) {
      newStatus = "ONGOING";
    } else if (allSessionsFinished && event.sessions.length > 0) {
      newStatus = "COMPLETED";
    }

    if (newStatus !== event.status) {
      // Async non-blocking Firestore update
      adminDb.collection("events").doc(event.id).update({
        status: newStatus,
        updatedAt: new Date().toISOString(),
      }).catch((err) => console.error("Error updating event status asynchronously:", err));
      event.status = newStatus;
    }

    return event;
  });

  updatedEvents.sort((a: any, b: any) => {
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    return timeA - timeB;
  });
  return updatedEvents;
}

const sessionManagementSchema = z.object({
  title: z.string().min(2, "Session title is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().nullable().optional(),
});

export async function addSessionAction(
  eventId: string,
  sessionData: { title: string; startTime: string; endTime?: string | null }
) {
  await verifyAuth(["ADMIN", "FACULTY_ADMIN"]);

  if (!eventId) throw new Error("Event ID is required");

  const eventDoc = await adminDb.collection("events").doc(eventId).get();
  if (!eventDoc.exists) throw new Error("Event not found");

  const validated = sessionManagementSchema.parse(sessionData);

  const startD = new Date(validated.startTime);
  if (isNaN(startD.getTime())) throw new Error("Invalid start time format");

  let endIso: string | null = null;
  if (validated.endTime && validated.endTime.trim() !== "") {
    const endD = new Date(validated.endTime);
    if (isNaN(endD.getTime())) throw new Error("Invalid end time format");
    if (endD <= startD) throw new Error("End time must be after start time");
    endIso = endD.toISOString();
  }

  const newDocRef = adminDb.collection("sessions").doc();
  await newDocRef.set({
    id: newDocRef.id,
    eventId,
    title: validated.title,
    startTime: startD.toISOString(),
    endTime: endIso,
    createdAt: new Date().toISOString(),
  });

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/faculty/events/${eventId}`);
  revalidatePath(`/student/events/${eventId}`);
  revalidatePath(`/volunteer/events/${eventId}`);
  revalidatePath("/admin/events");
  revalidatePath("/faculty/events");
  revalidatePath("/student");
  return { success: true, sessionId: newDocRef.id };
}

export async function updateSessionAction(
  sessionId: string,
  sessionData: { title: string; startTime: string; endTime?: string | null }
) {
  await verifyAuth(["ADMIN", "FACULTY_ADMIN"]);

  if (!sessionId) throw new Error("Session ID is required");

  const sessionDoc = await adminDb.collection("sessions").doc(sessionId).get();
  if (!sessionDoc.exists) throw new Error("Session not found");

  const existingData = sessionDoc.data() as any;
  const eventId = existingData.eventId;

  const validated = sessionManagementSchema.parse(sessionData);

  const startD = new Date(validated.startTime);
  if (isNaN(startD.getTime())) throw new Error("Invalid start time format");

  let endIso: string | null = null;
  if (validated.endTime && validated.endTime.trim() !== "") {
    const endD = new Date(validated.endTime);
    if (isNaN(endD.getTime())) throw new Error("Invalid end time format");
    if (endD <= startD) throw new Error("End time must be after start time");
    endIso = endD.toISOString();
  }

  await adminDb.collection("sessions").doc(sessionId).update({
    title: validated.title,
    startTime: startD.toISOString(),
    endTime: endIso,
    updatedAt: new Date().toISOString(),
  });

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/faculty/events/${eventId}`);
  revalidatePath(`/student/events/${eventId}`);
  revalidatePath(`/volunteer/events/${eventId}`);
  revalidatePath("/admin/events");
  revalidatePath("/faculty/events");
  revalidatePath("/student");
  return { success: true };
}

export async function deleteSessionAction(sessionId: string) {
  await verifyAuth(["ADMIN", "FACULTY_ADMIN"]);

  if (!sessionId) throw new Error("Session ID is required");

  const sessionDoc = await adminDb.collection("sessions").doc(sessionId).get();
  if (!sessionDoc.exists) throw new Error("Session not found");

  const eventId = sessionDoc.data()?.eventId;

  await adminDb.collection("sessions").doc(sessionId).delete();

  if (eventId) {
    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath(`/faculty/events/${eventId}`);
    revalidatePath(`/student/events/${eventId}`);
    revalidatePath(`/volunteer/events/${eventId}`);
  }
  revalidatePath("/admin/events");
  revalidatePath("/faculty/events");
  revalidatePath("/student");
  return { success: true };
}

