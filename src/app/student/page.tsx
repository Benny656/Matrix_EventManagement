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


export default async function StudentDashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || (currentUser.role !== "STUDENT" && currentUser.role !== "ADMIN")) {
    redirect("/login");
  }

  // Fetch registrations, events, sessions, and available events in parallel
  const [regsSnapshot, eventsSnapshot, sessionsSnapshot, availableEvents] = await Promise.all([
    adminDb.collection("registrations").where("studentId", "==", currentUser.id).get(),
    adminDb.collection("events").get(),
    adminDb.collection("sessions").get(),
    getEventsAction(false, currentUser),
  ]);

  const eventMap = new Map<string, any>();
  eventsSnapshot.docs.forEach((d) => eventMap.set(d.id, d.data()));

  const allSessions = sessionsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

  const registrations = regsSnapshot.docs
    .map((doc) => {
      const data = doc.data() as any;
      const eventData = eventMap.get(data.eventId);
      if (!eventData) return null;

      const eventSessions = allSessions
        .filter((s) => s.eventId === data.eventId)
        .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        event: {
          ...eventData,
          id: data.eventId,
          sessions: eventSessions,
        },
      };
    })
    .filter((r) => r && r.status !== "CANCELLED");

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
