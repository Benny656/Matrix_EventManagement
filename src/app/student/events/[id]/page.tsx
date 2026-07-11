import React from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import RegisterActionButton from "@/components/events/register-action-button";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentEventDetailsPage({ params }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  const { id } = await params;

  // Fetch event details
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      sessions: {
        orderBy: { startTime: "asc" },
      },
      registrations: {
        where: { NOT: { status: "CANCELLED" } },
      },
    },
  });

  if (!event) {
    notFound();
  }

  // Fetch student's registration status
  const userRegistration = await prisma.registration.findUnique({
    where: {
      studentId_eventId: {
        studentId: session.user.id,
        eventId: id,
      },
    },
  });

  const activeRegistrationsCount = event.registrations.filter((r) => r.status === "REGISTERED").length;
  const isFull = activeRegistrationsCount >= event.maxParticipants;
  const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);

  const registrationStatus = userRegistration ? userRegistration.status : null;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 border-b border-border pb-4">
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
            Venue: {event.venue} • Deadline: {new Date(event.registrationDeadline).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side details */}
        <div className="lg:col-span-8 space-y-6">
          {/* Operational Description */}
          <div className="border border-border bg-card p-6 space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-semibold border-b border-border pb-1">
              Operational Description
            </h3>
            <p className="font-sans text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </div>

          {/* Session Timeline */}
          <div className="border border-border bg-card p-6 space-y-4">
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-semibold border-b border-border pb-1">
              Scheduled Blocks / Sessions
            </h3>

            {event.sessions.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground uppercase py-2">
                No session blocks scheduled for this event.
              </p>
            ) : (
              <div className="relative border-l border-border pl-6 ml-2 space-y-6">
                {event.sessions.map((sess, idx) => {
                  const startStr = new Date(sess.startTime).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
                  const endStr = new Date(sess.endTime).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
                  const dateStr = new Date(sess.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" });

                  return (
                    <div key={sess.id} className="relative">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[31px] top-1.5 w-2 h-2 bg-primary rounded-full ring-4 ring-background"></span>
                      <div>
                        <span className="font-mono text-[10px] text-primary uppercase font-bold tracking-wider">{dateStr} / {startStr} - {endStr}</span>
                        <h4 className="font-sans text-sm font-bold text-foreground mt-0.5">{sess.title}</h4>
                        <span className="font-mono text-[10px] text-muted-foreground block mt-0.5">Location: {sess.venue}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side bar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border border-border p-6 bg-card space-y-6">
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground border-b border-border pb-1 font-semibold">
              Deployment Info
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between border-b border-border pb-2 border-dashed">
                <span className="text-muted-foreground">Capacity Limit:</span>
                <span className="text-foreground font-semibold">{event.maxParticipants} Attendees</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2 border-dashed">
                <span className="text-muted-foreground">Registered:</span>
                <span className="text-foreground font-semibold">{activeRegistrationsCount} Students</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2 border-dashed">
                <span className="text-muted-foreground">Waitlisted:</span>
                <span className="text-foreground font-semibold">
                  {event.registrations.filter((r) => r.status === "WAITLISTED").length} Students
                </span>
              </div>
              <div className="flex justify-between border-b border-border pb-2 border-dashed">
                <span className="text-muted-foreground">Cutoff:</span>
                <span className="text-foreground font-semibold">{new Date(event.registrationDeadline).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Action button */}
            <RegisterActionButton
              eventId={event.id}
              initialStatus={registrationStatus as any}
              isFull={isFull}
              isDeadlinePassed={isDeadlinePassed}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
