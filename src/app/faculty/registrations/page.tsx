import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-session";
import { adminDb } from "@/lib/firebase-admin";
import FacultyRegistrations from "@/components/events/faculty-registrations";

export const dynamic = "force-dynamic";

export default async function FacultyRegistrationsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "FACULTY") {
    redirect("/login");
  }

  const regsSnapshot = await adminDb
    .collection("registrations")
    .where("studentId", "==", currentUser.id)
    .where("status", "==", "REGISTERED")
    .get();

  const regDocs = regsSnapshot.docs.map((doc) => ({
    id: doc.id,
    data: doc.data() as any,
  }));

  const eventIds = Array.from(new Set(regDocs.map((r) => r.data.eventId).filter(Boolean)));

  let eventMap = new Map<string, any>();
  if (eventIds.length > 0) {
    const eventDocRefs = eventIds.map((id) => adminDb.collection("events").doc(id));
    const eventSnapshots = await adminDb.getAll(...eventDocRefs);
    eventSnapshots.forEach((doc) => {
      if (doc.exists) eventMap.set(doc.id, doc.data());
    });
  }

  const registrations = regDocs
    .map(({ id, data }) => {
      const event = eventMap.get(data.eventId) || { title: data.eventTitle || "Unknown Event", date: data.eventDate || "" };
      const isRegistered = data.status === "REGISTERED";
      return {
        ...data,
        id,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        event: {
          ...event,
          id: data.eventId,
          date: event.date ? new Date(event.date) : new Date(),
          whatsappInviteLink: isRegistered ? (event.whatsappInviteLink || null) : null,
        },
      };
    })
    .filter(Boolean) as any[];

  registrations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

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

      <FacultyRegistrations initialRegistrations={registrations as any} />
    </div>
  );
}
