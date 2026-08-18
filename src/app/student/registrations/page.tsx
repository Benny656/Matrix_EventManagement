import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-session";
import { adminDb } from "@/lib/firebase-admin";
import StudentRegistrations from "@/components/events/student-registrations";

export const dynamic = "force-dynamic";

export default async function StudentRegistrationsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "STUDENT") {
    redirect("/login");
  }

  // Fetch only this student's registrations (single read query)
  const regsSnapshot = await adminDb
    .collection("registrations")
    .where("studentId", "==", currentUser.id)
    .orderBy("createdAt", "desc")
    .get();

  const regDocs = regsSnapshot.docs.map((doc) => ({
    id: doc.id,
    data: doc.data() as any,
  }));

  // Backward compatibility: fetch events only for legacy records lacking denormalized titles
  const missingEventIds = Array.from(
    new Set(
      regDocs
        .filter((r) => !r.data.eventTitle)
        .map((r) => r.data.eventId)
        .filter(Boolean)
    )
  );

  let eventMap = new Map<string, any>();
  if (missingEventIds.length > 0) {
    const eventDocRefs = missingEventIds.map((id) => adminDb.collection("events").doc(id));
    const eventSnapshots = await adminDb.getAll(...eventDocRefs);
    eventSnapshots.forEach((doc) => {
      if (doc.exists) eventMap.set(doc.id, doc.data());
    });
  }

  const registrations = regDocs.map(({ id, data }) => {
    const legacyEvent = eventMap.get(data.eventId);
    const title = data.eventTitle || legacyEvent?.title || "Event";
    const dateVal = data.eventDate || legacyEvent?.date;
    const category = data.eventCategory || legacyEvent?.category || "General";
    const description = legacyEvent?.description || "";
    const isRegistered = data.status === "REGISTERED";
    const whatsappInviteLink = isRegistered ? (data.whatsappInviteLink || legacyEvent?.whatsappInviteLink || null) : null;

    return {
      ...data,
      id,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      event: {
        id: data.eventId,
        title,
        description,
        category,
        date: dateVal ? new Date(dateVal) : new Date(),
        whatsappInviteLink,
      },
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground tracking-tighter mb-1">
          My Registrations
        </h1>
        <p className="font-sans text-sm text-muted-foreground">
          Review your upcoming events and waitlist statuses.
        </p>
      </div>

      <StudentRegistrations initialRegistrations={registrations as any} />
    </div>
  );
}