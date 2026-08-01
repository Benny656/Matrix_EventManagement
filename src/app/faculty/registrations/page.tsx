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
    .where("FacultyId", "==", currentUser.id)
    .get();

  const eventsSnapshot = await adminDb.collection("events").get();
  const eventMap = new Map<string, any>();
  eventsSnapshot.docs.forEach((d) => eventMap.set(d.id, d.data()));

  const registrations = regsSnapshot.docs.map((doc) => {
    const data = doc.data() as any;
    const event = eventMap.get(data.eventId) || { title: "Unknown Event", date: "" };
    const isRegistered = data.status === "REGISTERED";
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      event: {
        ...event,
        id: data.eventId,
        date: event.date ? new Date(event.date) : new Date(),
        whatsappInviteLink: isRegistered ? (event.whatsappInviteLink || null) : null,
      },
    };
  });

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
