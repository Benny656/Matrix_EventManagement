import React from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AttendeeList from "@/components/events/attendee-list";
import { Download } from "lucide-react";
import EditDeadlineForm from "@/components/events/edit-deadline-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEventDetailsPage({ params }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      sessions: {
        orderBy: { startTime: "asc" },
        include: {
          attendances: true,
        },
      },
      registrations: {
        where: { NOT: { status: "CANCELLED" } },
        include: {
          student: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!event) {
    notFound();
  }

  const confirmedCount = event.registrations.filter((r) => r.status === "REGISTERED").length;
  const waitlistedCount = event.registrations.filter((r) => r.status === "WAITLISTED").length;

  const sessionIds = event.sessions.map((s) => s.id);
  const checkedInStudents = await prisma.attendance.findMany({
    where: {
      sessionId: { in: sessionIds },
    },
    select: { studentId: true },
    distinct: ["studentId"],
  });
  const checkedInCount = checkedInStudents.length;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-primary uppercase font-bold tracking-widest">{event.category}</span>
            <span className={`px-2 py-0.5 font-mono text-[9px] uppercase font-semibold border ${
              event.status === "UPCOMING"
                ? "bg-secondary-container text-on-secondary-container border-border"
                : event.status === "ONGOING"
                ? "bg-primary text-primary-foreground border-primary animate-pulse"
                : "bg-muted text-muted-foreground border-border"
            }`}>
              {event.status}
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground tracking-tighter">
            {event.title}
          </h1>
          <p className="font-sans text-xs text-muted-foreground mt-1">
            Venue: {event.venue} • Coordinator: {event.coordinatorName}
          </p>
        </div>
        <Link
          href={`/api/reports/export?type=event&eventId=${event.id}`}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "font-mono text-xs uppercase tracking-wider rounded-none h-9 px-4 shadow-none hover:bg-surface-container border-border inline-flex items-center"
          )}
        >
          <Download size={14} className="mr-2" />
          Export CSV
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-border bg-card p-4">
          <div className="font-mono text-[10px] text-muted-foreground mb-1 uppercase">Total RSVP</div>
          <div className="font-heading text-2xl font-bold text-foreground">{confirmedCount}</div>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="font-mono text-[10px] text-muted-foreground mb-1 uppercase">Checked-In</div>
          <div className="font-heading text-2xl font-bold text-foreground">{checkedInCount}</div>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="font-mono text-[10px] text-muted-foreground mb-1 uppercase">Waitlisted</div>
          <div className="font-heading text-2xl font-bold text-primary">{waitlistedCount}</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Sessions & Attendee list */}
        <div className="lg:col-span-8 space-y-6">
          <AttendeeList registrations={event.registrations as any} />
        </div>

        {/* Right Side: Timeline & Settings */}
        <div className="lg:col-span-4 space-y-6">
          <EditDeadlineForm eventId={event.id} initialDeadline={event.registrationDeadline} />
          
          <div className="border border-border p-6 bg-card space-y-6">
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground border-b border-border pb-1 font-semibold">
              Event Sessions Timeline
            </h3>

            {event.sessions.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground uppercase py-2">
                No session blocks scheduled.
              </p>
            ) : (
              <div className="relative border-l border-border pl-6 ml-2 space-y-6">
                {event.sessions.map((sess) => {
                  const startStr = new Date(sess.startTime).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
                  const endStr = new Date(sess.endTime).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
                  const dateStr = new Date(sess.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" });

                  return (
                    <div key={sess.id} className="relative">
                      <span className="absolute -left-[31px] top-1.5 w-2 h-2 bg-primary rounded-full ring-4 ring-background"></span>
                      <div>
                        <span className="font-mono text-[10px] text-primary uppercase font-bold tracking-wider">{dateStr} / {startStr} - {endStr}</span>
                        <h4 className="font-sans text-sm font-bold text-foreground mt-0.5">{sess.title}</h4>
                        <span className="font-mono text-[10px] text-muted-foreground block mt-0.5">Location: {sess.venue}</span>
                        <span className="font-mono text-[10px] text-muted-foreground block mt-1">
                          Arrivals: {sess.attendances.length} Scanned
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
