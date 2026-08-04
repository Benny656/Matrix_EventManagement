import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-session";
import { adminDb } from "@/lib/firebase-admin";
import { getEventsAction } from "@/actions/event";
import StudentEventList from "@/components/events/student-event-list";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

const formatEventTime = (event: any) => {
  if (event.sessions && event.sessions.length > 0) {
    const firstSession = event.sessions[0];
    const lastSession = event.sessions[event.sessions.length - 1];

    const dateStr = new Date(firstSession.startTime).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    }).toUpperCase();

    const startStr = new Date(firstSession.startTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const endStr = lastSession.endTime
      ? new Date(lastSession.endTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : null;

    return endStr ? `${dateStr} / ${startStr} – ${endStr}` : `${dateStr} / ${startStr}`;
  }

  const dateStr = event.date ? new Date(event.date).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  }).toUpperCase() : "TBD";
  return `${dateStr} / SCHEDULE TBD`;
};


import { DashboardSkeleton } from "@/components/ui/skeleton-loaders";

// Firestore `in` queries are capped at 30 values per query.
// Chunk larger ID sets and fan out with Promise.all.
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

async function StudentDashboardData({ currentUser }: { currentUser: any }) {
  // Registrations and the independent `getEventsAction` call have no
  // dependency on each other, so they run in parallel.
  const [regsSnapshot, availableEvents] = await Promise.all([
    adminDb.collection("registrations").where("studentId", "==", currentUser.id).get(),
    getEventsAction(false, currentUser),
  ]);

  const registrationDocs = regsSnapshot.docs
    .map((doc) => ({ id: doc.id, data: doc.data() as any }))
    .filter((r) => r.data.status !== "CANCELLED");

  const eventIds = [...new Set(registrationDocs.map((r) => r.data.eventId))];

  // Fetch only the specific events referenced by this student's
  // registrations (via getAll on known refs), instead of scanning the
  // entire `events` collection. Fetch only sessions belonging to those
  // events (via chunked `in` queries), instead of scanning the entire
  // `sessions` collection. Both depend on knowing eventIds first, so they
  // run after regsSnapshot resolves rather than fully parallel with it.
  const [eventDocs, sessionSnapshots] = await Promise.all([
    eventIds.length > 0
      ? adminDb.getAll(...eventIds.map((eventId) => adminDb.collection("events").doc(eventId)))
      : Promise.resolve([]),
    eventIds.length > 0
      ? Promise.all(
          chunk(eventIds, 30).map((idsChunk) =>
            adminDb.collection("sessions").where("eventId", "in", idsChunk).get()
          )
        )
      : Promise.resolve([]),
  ]);

  const eventMap = new Map<string, any>();
  eventDocs.forEach((doc) => {
    if (doc.exists) eventMap.set(doc.id, doc.data());
  });

  // Pre-pass: build eventId -> sorted session[] once, so the per-registration
  // lookup below is O(1) instead of a linear scan over all sessions.
  const sessionsByEvent = new Map<string, any[]>();
  sessionSnapshots.forEach((snapshot) => {
    snapshot.docs.forEach((d) => {
      const session = { id: d.id, ...d.data() } as any;
      const bucket = sessionsByEvent.get(session.eventId);
      if (bucket) {
        bucket.push(session);
      } else {
        sessionsByEvent.set(session.eventId, [session]);
      }
    });
  });
  sessionsByEvent.forEach((sessions) => {
    sessions.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  });

  const registrations = registrationDocs
    .map(({ id, data }) => {
      const eventData = eventMap.get(data.eventId);
      if (!eventData) return null;

      const eventSessions = sessionsByEvent.get(data.eventId) || [];

      return {
        ...data,
        id,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        event: {
          ...eventData,
          id: data.eventId,
          sessions: eventSessions,
        },
      };
    })
    .filter((r) => r !== null) as any[];

  registrations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="space-y-8">
      {/* My Registrations (if any) */}
      {registrations.length > 0 && (
        <section className="space-y-4">
          <header className="flex justify-between items-end border-b border-border pb-1">
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">My Registrations</h2>
            <span className="font-mono text-[11px] text-muted-foreground">SEQ-01</span>
          </header>

          <div className="flex overflow-x-auto gap-4 pb-2 hide-scrollbar">
            {registrations.map((reg: any) => {
              const event = reg.event;
              const eventCode = `EVT-${event.id.slice(0, 4).toUpperCase()}`;
              const statusLabel = reg.status === "REGISTERED" ? "Confirmed" : reg.status;
              const statusBg =
                reg.status === "REGISTERED"
                  ? "bg-tertiary text-on-tertiary"
                  : "bg-secondary-container text-on-secondary-container border border-border";

              return (
                <article key={reg.id} className="min-w-[300px] md:min-w-[380px] border border-border bg-card flex flex-col shrink-0 hover:border-primary transition-colors">
                  <div className="bg-surface-container px-4 py-2 border-b border-border flex justify-between items-center">
                    <span className="font-mono text-xs text-muted-foreground">{eventCode}</span>
                    <span className={`px-2 py-[2px] font-mono text-[10px] uppercase font-semibold ${statusBg}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <h3 className="font-heading text-lg font-bold text-foreground mb-4 line-clamp-2">{event.title}</h3>
                    <div className="mt-auto space-y-2 font-mono text-xs text-muted-foreground border-t border-dashed border-border pt-3">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={13} className="text-muted-foreground" />
                        <span>{formatEventTime(event)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 border-t border-border">
                    <Link href={`/student/events/${event.id}`} className="w-full block">
                      <Button variant="outline" className="w-full border-muted-foreground text-muted-foreground font-mono text-xs uppercase hover:bg-surface-container rounded-none shadow-none h-9">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Available Events Section */}
      <section className="space-y-4">
        <header className="flex justify-between items-end border-b border-border pb-1">
          <h2 className="font-heading text-xl font-bold uppercase tracking-tight text-foreground">Available Events</h2>
          <span className="font-mono text-[11px] text-muted-foreground">{availableEvents.length} EVENTS</span>
        </header>

        <StudentEventList events={availableEvents as any} />
      </section>
    </div>
  );
}

export default async function StudentDashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || (currentUser.role !== "STUDENT" && currentUser.role !== "ADMIN")) {
    redirect("/login");
  }

  return (
    <React.Suspense fallback={<DashboardSkeleton />}>
      <StudentDashboardData currentUser={currentUser} />
    </React.Suspense>
  );
}