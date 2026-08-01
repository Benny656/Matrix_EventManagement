import React from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-session";
import { adminDb } from "@/lib/firebase-admin";
import { isEligible } from "@/lib/eligibility";
import RegisterActionButton from "@/components/events/register-action-button";
import { CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentEventDetailsPage({ params }: PageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "STUDENT") {
    redirect("/login");
  }

  const { id } = await params;

  const eventDoc = await adminDb.collection("events").doc(id).get();
  if (!eventDoc.exists) {
    notFound();
  }

  const event = { id: eventDoc.id, ...eventDoc.data() } as any;

  // Enforce eligibility — ineligible users see a 404
  if (!isEligible(event, currentUser)) {
    notFound();
  }

  const sessionsSnapshot = await adminDb
    .collection("sessions")
    .where("eventId", "==", id)
    .get();
  const sessions = sessionsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
  sessions.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

  const regsSnapshot = await adminDb
    .collection("registrations")
    .where("eventId", "==", id)
    .get();

  const registrations = regsSnapshot.docs.map((d) => d.data());
  const userRegistration = registrations.find((r) => r.studentId === currentUser.id);

  const activeRegistrationsCount = registrations.filter((r) => r.status === "REGISTERED").length;
  const isFull = event.maxParticipants ? activeRegistrationsCount >= event.maxParticipants : false;
  const isRegistrationOpen = event.registrationOpen ?? true;

  const registrationStatus = userRegistration ? userRegistration.status : null;

  // Fetch student's attendance records for this event if registered
  let userAttendedSessionIds = new Set<string>();
  if (registrationStatus === "REGISTERED") {
    const userAttsSnapshot = await adminDb
      .collection("attendances")
      .where("studentId", "==", currentUser.id)
      .get();
    userAttsSnapshot.docs.forEach((d) => {
      userAttendedSessionIds.add(d.data().sessionId);
    });
  }

  const sessionAttendanceList = sessions.map((sess) => {
    const startStr = new Date(sess.startTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const endStr = sess.endTime
      ? new Date(sess.endTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : null;
    const dateStr = new Date(sess.startTime).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const isPresent = userAttendedSessionIds.has(sess.id);

    return {
      id: sess.id,
      title: sess.title,
      timeStr: `${dateStr}, ${startStr}${endStr ? ` - ${endStr}` : ""}`,
      status: isPresent ? ("P" as const) : ("A" as const),
    };
  });

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
            Status: {isRegistrationOpen ? "Open for Registration" : "Registration Closed"}
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

          {/* Event Schedule (When) */}
          <div className="border border-border bg-card p-6 space-y-4">
            <h3 className="font-mono text-xs uppercase tracking-widest text-foreground font-semibold border-b border-border pb-2 flex items-center justify-between">
              <span>Event Schedule & Time</span>
              <CalendarDays size={14} className="text-muted-foreground" />
            </h3>
            {sessions.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground uppercase py-1">
                {event.date
                  ? `Date: ${new Date(event.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}`
                  : "Schedule details to be announced."}
              </p>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                {sessions.map((sess) => {
                  const startStr = new Date(sess.startTime).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  });
                  const endStr = sess.endTime
                    ? new Date(sess.endTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : null;
                  const dateStr = new Date(sess.startTime).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  return (
                    <div key={sess.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-border bg-surface-container/30 gap-2">
                      <span className="font-sans font-bold text-foreground">{sess.title}</span>
                      <span className="text-muted-foreground text-[11px]">
                        {dateStr} | {startStr}{endStr ? ` - ${endStr}` : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Attendance Marked Table (only if registered) */}
          {registrationStatus === "REGISTERED" && (
            <div className="border border-border bg-card p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <h3 className="font-mono text-xs uppercase tracking-widest text-foreground font-semibold">
                  Attendance Marked
                </h3>
                <span className="font-mono text-[10px] text-muted-foreground uppercase font-semibold">
                  {sessionAttendanceList.filter((s) => s.status === "P").length} Present
                </span>
              </div>

              {sessionAttendanceList.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground uppercase py-2">
                  No sessions scheduled for attendance tracking.
                </p>
              ) : (
                <div className="overflow-x-auto border border-border">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                      <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground bg-surface-container/50">
                        <th className="py-2.5 px-4 font-bold">Session Heading</th>
                        <th className="py-2.5 px-4 font-bold">Session Time</th>
                        <th className="py-2.5 px-4 font-bold text-right">Status (P/A)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sessionAttendanceList.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-3 px-4 font-sans font-bold text-foreground">
                            {item.title}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                            {item.timeStr}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`inline-block px-3 py-0.5 font-mono text-xs font-bold border ${
                                item.status === "P"
                                  ? "bg-primary/10 text-primary border-primary/30"
                                  : "bg-destructive/10 text-destructive border-destructive/30"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side bar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border border-border p-6 bg-card space-y-6">
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground border-b border-border pb-1 font-semibold">
              Event Details
            </h3>

            <div className="space-y-4 font-mono text-xs">
              {event.date && (
                <div className="flex justify-between border-b border-border pb-2 border-dashed">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="text-foreground font-semibold">
                    {new Date(event.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-b border-border pb-2 border-dashed">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-foreground font-semibold">{isRegistrationOpen ? "Open" : "Closed"}</span>
              </div>
            </div>

            <RegisterActionButton
              eventId={event.id}
              initialStatus={registrationStatus as any}
              isFull={isFull}
              isRegistrationOpen={isRegistrationOpen}
            />

            {registrationStatus === "REGISTERED" && event.whatsappInviteLink && (
              <div className="pt-2 border-t border-border">
                <a
                  href={event.whatsappInviteLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <button className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-mono text-xs uppercase tracking-wider py-3 px-4 flex items-center justify-center gap-2 transition-all cursor-pointer">
                    Join WhatsApp Group
                  </button>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
