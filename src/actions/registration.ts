"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth-session";

async function verifyStudent() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "STUDENT") {
    throw new Error("Unauthorized. Student credentials required.");
  }
  return currentUser;
}

export async function registerForEventAction(eventId: string) {
  const user = await verifyStudent();

  const eventDoc = await adminDb.collection("events").doc(eventId).get();
  if (!eventDoc.exists) throw new Error("Event not found");

  const event = eventDoc.data() as any;
  if (event.status === "ARCHIVED") {
    throw new Error("Cannot register for an archived event.");
  }

  if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
    throw new Error("Registration deadline has passed.");
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
    await existingRegDoc.ref.update({
      status: newStatus,
      createdAt: new Date().toISOString(),
    });
  } else {
    const newRef = adminDb.collection("registrations").doc();
    await newRef.set({
      id: newRef.id,
      studentId: user.id,
      eventId: eventId,
      status: newStatus,
      createdAt: new Date().toISOString(),
    });
  }

  // Create notification
  const notifRef = adminDb.collection("notifications").doc();
  await notifRef.set({
    id: notifRef.id,
    userId: user.id,
    type: isWaitlist ? "UPDATE_POSTED" : "REGISTRATION_CONFIRMED",
    message: isWaitlist
      ? `You have been added to the waitlist for ${event.title}.`
      : `Registration confirmed for ${event.title}!`,
    read: false,
    linkUrl: `/student/events/${eventId}`,
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/student");
  revalidatePath(`/student/events/${eventId}`);
  revalidatePath("/student/registrations");
  revalidatePath(`/volunteer/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}`);

  return { success: true, status: newStatus };
}

export async function cancelRegistrationAction(eventId: string) {
  const user = await verifyStudent();

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

      const notifRef = adminDb.collection("notifications").doc();
      await notifRef.set({
        id: notifRef.id,
        userId: promotedDoc.data().studentId,
        type: "REGISTRATION_CONFIRMED",
        message: `Good news! You have been promoted from the waitlist and registered for ${eventTitle}.`,
        read: false,
        linkUrl: `/student/events/${eventId}`,
        createdAt: new Date().toISOString(),
      });
    }
  }

  revalidatePath("/student");
  revalidatePath(`/student/events/${eventId}`);
  revalidatePath("/student/registrations");
  revalidatePath(`/volunteer/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}`);

  return { success: true };
}
