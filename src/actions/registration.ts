"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
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

  // Fetch all registrations for this event to count confirmed
  const regSnapshot = await adminDb
    .collection("registrations")
    .where("eventId", "==", eventId)
    .get();

  const eventRegs = regSnapshot.docs.map((d) => d.data());
  const existingRegDoc = regSnapshot.docs.find((d) => d.data().studentId === user.id);

  if (existingRegDoc && existingRegDoc.data().status !== "CANCELLED") {
    throw new Error("You are already registered or waitlisted for this event.");
  }

  const activeCount = eventRegs.filter((r) => r.status === "REGISTERED").length;
  const isWaitlist = activeCount >= event.maxParticipants;
  const newStatus = isWaitlist ? "WAITLISTED" : "REGISTERED";

  if (existingRegDoc) {
    const existingData = existingRegDoc.data();
    await existingRegDoc.ref.update({
      status: newStatus,
      participantRole: user.role,
      eventRole: existingData.eventRole || "participant",
      createdAt: new Date().toISOString(),
    });
  } else {
    const newRef = adminDb.collection("registrations").doc();
    await newRef.set({
      id: newRef.id,
      studentId: user.id, // Keeping studentId for backward compatibility
      participantRole: user.role,
      eventRole: "participant",
      eventId: eventId,
      status: newStatus,
      createdAt: new Date().toISOString(),
    });
  }

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
