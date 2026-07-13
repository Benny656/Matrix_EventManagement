import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, TriangleAlert, RefreshCw } from "lucide-react";

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

    const endStr = new Date(lastSession.endTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return `${dateStr} / ${startStr} – ${endStr}`;
  }

  const dateStr = new Date(event.date).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  }).toUpperCase();
  return `${dateStr} / SCHEDULE TBD`;
};

const formatUpdateDate = (date: Date) => {
  const diffMs = new Date().getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 60) {
    return `${diffMins > 0 ? diffMins : 1}M AGO`;
  } else if (diffHours < 24) {
    return `${diffHours}H AGO`;
  }

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  }).toUpperCase();
};

export default async function StudentDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "STUDENT" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  // Fetch student's registrations
  const registrations = await prisma.registration.findMany({
    where: {
      studentId: session.user.id,
      NOT: { status: "CANCELLED" },
    },
    include: {
      event: {
        include: {
          sessions: {
            orderBy: { startTime: "asc" },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch active updates/announcements
  const registeredEventIds = registrations.map((r) => r.eventId);
  const updates = await prisma.update.findMany({
    where: {
      OR: [
        { scope: "DEPARTMENT" },
        { eventId: { in: registeredEventIds } },
      ],
    },
    include: {
      event: {
        select: { title: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <div className="space-y-8">
      {/* Upcoming Events Section */}
      <section className="space-y-4">
        <header className="flex justify-between items-end border-b border-border pb-1">
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Upcoming Registrations</h2>
          <span className="font-mono text-[11px] text-muted-foreground">SEQ-01</span>
        </header>

        {registrations.length === 0 ? (
          <div className="border border-border p-12 text-center text-muted-foreground font-mono text-xs uppercase bg-card w-full flex flex-col items-center justify-center gap-3">
            <span>You have no active registrations. Browse and register for events.</span>
            <Link href="/student/events">
              <Button className="font-mono text-xs uppercase rounded-none bg-primary text-primary-foreground hover:bg-primary/95 shadow-none h-9 px-4">
                Browse Events
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-4 pb-2 hide-scrollbar">
            {registrations.map((reg) => {
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
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-muted-foreground" />
                        <span className="truncate">{event.venue}</span>
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
        )}
      </section>

      {/* Latest Updates Bento */}
      <section className="space-y-4">
        <header className="flex justify-between items-end border-b border-border pb-1">
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">System Updates</h2>
          <span className="font-mono text-[11px] text-muted-foreground">LOG-REQ</span>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {updates.length === 0 ? (
            <div className="col-span-full border border-border p-12 text-center text-muted-foreground font-mono text-xs uppercase bg-card">
              No recent updates posted.
            </div>
          ) : (
            updates.map((update, idx) => {
              const isDept = update.scope === "DEPARTMENT";
              const colSpan = idx === 0 ? "md:col-span-8" : "md:col-span-4";

              return (
                <div key={update.id} className={`col-span-1 ${colSpan} border border-border bg-card flex flex-col hover:border-primary transition-colors`}>
                  <div className={`${
                    isDept
                      ? "bg-primary-container text-on-primary-container"
                      : "bg-surface-container text-muted-foreground"
                  } px-4 py-2 border-b border-border flex items-center gap-2`}>
                    {isDept ? (
                      <TriangleAlert size={14} className="shrink-0" />
                    ) : (
                      <RefreshCw size={14} className="shrink-0" />
                    )}
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">
                      {isDept ? "Department-wide Notice" : "Event Notice"}
                    </span>
                  </div>
                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      {update.scope === "EVENT" && update.event && (
                        <span className="font-mono text-[9px] uppercase text-tertiary font-bold tracking-wider block mb-1">
                          REF: {update.event.title}
                        </span>
                      )}
                      <p className="font-sans text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-3">
                        {update.content}
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-2.5 border-t border-border bg-surface-container flex justify-between items-center">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {formatUpdateDate(update.createdAt)}
                    </span>
                    <Link href="/student/updates" className="text-primary font-mono text-xs uppercase hover:underline font-semibold">
                      Read Feed
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
