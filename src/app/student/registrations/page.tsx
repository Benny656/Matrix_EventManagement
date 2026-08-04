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

  // 1. Fetch only this student's registrations (already scoped by where clause).
  const regsSnapshot = await adminDb
    .collection("registrations")
    .where("studentId", "==", currentUser.id)
    .get();

  const regDocs = regsSnapshot.docs.map((doc) => ({
    id: doc.id,
    data: doc.data() as any,
  }));

  // 2. Collect only the distinct event IDs actually referenced — avoids
  //    reading the entire events collection.
  const eventIds = Array.from(
    new Set(regDocs.map((r) => r.data.eventId).filter(Boolean))
  );

  const eventMap = new Map<string, any>();

  if (eventIds.length > 0) {
    // 3. Fetch exactly those event docs via getAll (parallel, no collection
    //    scan). Chunked defensively in case of very large registration lists.
    const CHUNK_SIZE = 300; // getAll has no hard cap, but keep batches sane
    const chunks: string[][] = [];
    for (let i = 0; i < eventIds.length; i += CHUNK_SIZE) {
      chunks.push(eventIds.slice(i, i + CHUNK_SIZE));
    }

    const eventDocRefs = chunks.map((chunk) =>
      chunk.map((id) => adminDb.collection("events").doc(id))
    );

    const eventSnapshots = await Promise.all(
      eventDocRefs.map((refs) => (refs.length > 0 ? adminDb.getAll(...refs) : Promise.resolve([])))
    );

    eventSnapshots.flat().forEach((doc) => {
      if (doc.exists) {
        eventMap.set(doc.id, doc.data());
      }
    });
  }

  const registrations = regDocs.map(({ id, data }) => {
    const event = eventMap.get(data.eventId) || { title: "Unknown Event", venue: "", date: "" };
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

      <StudentRegistrations initialRegistrations={registrations as any} />
    </div>
  );
}