"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getCurrentUser } from "@/lib/auth-session";
import { isEligible } from "@/lib/eligibility";

async function verifyParticipant() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !["STUDENT", "FACULTY", "FACULTY_ADMIN", "ADMIN"].includes(currentUser.role)) {
    throw new Error("Unauthorized. Participant credentials required.");
  }
  return currentUser;
}

export async function registerForEventAction(eventId: string) {
  const user = await verifyParticipant();

  const eventDoc = await adminDb.collection("events").doc(eventId).get();
  if (!eventDoc.exists) throw new Error("Event not found");

  const event = eventDoc.data() as any;
  if (event.status === "ARCHIVED") {
    throw new Error("Cannot register for an archived event.");
  }

  // ── Eligibility gate ──────────────────────────────────────────────────────
  if (!isEligible(event, user)) {
    throw new Error("You are not eligible to register for this event.");
  }

  if (event.registrationOpen === false) {
    throw new Error("Registration is closed.");
  }

  // Capacity check using stored counter (or fallback to aggregate count)
  let activeCount: number;
  if (typeof event.registrationCount === "number") {
    activeCount = event.registrationCount;
  } else {
    const activeCountSnapshot = await adminDb
      .collection("registrations")
      .where("eventId", "==", eventId)
      .where("status", "==", "REGISTERED")
      .count()
      .get();
    activeCount = activeCountSnapshot.data().count;
  }

  // Targeted lookup for this user's own registration only, instead of
  // fetching every registration for the event to find it.
  const existingRegSnapshot = await adminDb
    .collection("registrations")
    .where("eventId", "==", eventId)
    .where("studentId", "==", user.id)
    .limit(1)
    .get();
  const existingRegDoc = existingRegSnapshot.docs[0];

  if (existingRegDoc && existingRegDoc.data().status !== "CANCELLED") {
    throw new Error("You are already registered for this event.");
  }

  if (event.maxParticipants && activeCount >= event.maxParticipants) {
    throw new Error("Event capacity has been reached. Registration is closed.");
  }
  const newStatus = "REGISTERED";

  const batch = adminDb.batch();

  if (existingRegDoc) {
    const existingData = existingRegDoc.data();
    batch.update(existingRegDoc.ref, {
      status: newStatus,
      participantRole: user.role,
      eventRole: existingData.eventRole || "participant",
      studentName: user.name,
      email: user.email,
      rollNumber: user.rollNumber || null,
      department: user.department || null,
      eventTitle: event.title,
      eventDate: event.date,
      eventCategory: event.category,
      whatsappInviteLink: event.whatsappInviteLink || null,
      createdAt: new Date().toISOString(),
    });
  } else {
    const newRef = adminDb.collection("registrations").doc();
    batch.set(newRef, {
      id: newRef.id,
      studentId: user.id, // Keeping studentId for backward compatibility
      studentName: user.name,
      email: user.email,
      rollNumber: user.rollNumber || null,
      department: user.department || null,
      participantRole: user.role,
      eventRole: "participant",
      eventId: eventId,
      eventTitle: event.title,
      eventDate: event.date,
      eventCategory: event.category,
      whatsappInviteLink: event.whatsappInviteLink || null,
      status: newStatus,
      createdAt: new Date().toISOString(),
    });
  }

  // Atomically increment registrationCount on the event document
  batch.update(adminDb.collection("events").doc(eventId), {
    registrationCount: FieldValue.increment(1),
    updatedAt: new Date().toISOString(),
  });

  await batch.commit();

  revalidatePath("/student");
  revalidatePath(`/student/events/${eventId}`);
  revalidatePath("/student/registrations");
  revalidatePath("/faculty");
  revalidatePath(`/faculty/events/${eventId}`);
  revalidatePath("/faculty/registrations");
  revalidatePath(`/volunteer/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}`);

  return {
    success: true,
    status: newStatus,
    whatsappInviteLink: newStatus === "REGISTERED" ? (event.whatsappInviteLink || null) : null,
  };
}

export async function cancelRegistrationAction(eventId: string) {
  const user = await verifyParticipant();
  throw new Error("Registrations cannot be cancelled once submitted.");

  const regSnapshot = await adminDb
    .collection("registrations")
    .where("studentId", "==", user.id)
    .where("eventId", "==", eventId)
    .get();

  if (regSnapshot.empty) {
    throw new Error("No active registration found to cancel.");
  }

  const regDoc = regSnapshot.docs[0];
  const regData = regDoc.data();
  if (regData.status === "CANCELLED") {
    throw new Error("No active registration found to cancel.");
  }

  const previousStatus = regData.status;
  await regDoc.ref.update({ status: "CANCELLED" });

  if (previousStatus === "REGISTERED") {
    const eventDoc = await adminDb.collection("events").doc(eventId).get();
    const eventTitle = eventDoc.exists ? eventDoc.data()?.title || "Event" : "Event";

    const waitlistSnapshot = await adminDb
      .collection("registrations")
      .where("eventId", "==", eventId)
      .where("status", "==", "WAITLISTED")
      .get();

    const waitlistedDocs = waitlistSnapshot.docs;
    waitlistedDocs.sort((a, b) => (a.data().createdAt || "").localeCompare(b.data().createdAt || ""));

    if (waitlistedDocs.length > 0) {
      const promotedDoc = waitlistedDocs[0];
      await promotedDoc.ref.update({ status: "REGISTERED" });
    }
  }

  revalidatePath("/student");
  revalidatePath(`/student/events/${eventId}`);
  revalidatePath("/student/registrations");
  revalidatePath("/faculty");
  revalidatePath(`/faculty/events/${eventId}`);
  revalidatePath("/faculty/registrations");
  revalidatePath(`/volunteer/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}`);

  return { success: true };
}