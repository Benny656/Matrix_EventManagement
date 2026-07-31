import React from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-session";
import { adminDb } from "@/lib/firebase-admin";
import { isEligible } from "@/lib/eligibility";
import RegisterActionButton from "@/components/events/register-action-button";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FacultyEventDetailsPage({ params }: PageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "FACULTY") {
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
  const userRegistration = registrations.find((r) => r.FacultyId === currentUser.id);

  const activeRegistrationsCount = registrations.filter((r) => r.status === "REGISTERED").length;
  const isFull = event.maxParticipants ? activeRegistrationsCount >= event.maxParticipants : false;
  const isRegistrationOpen = event.registrationOpen ?? true;

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
            Venue: {event.venue} • Status: {isRegistrationOpen ? "Open for Registration" : "Registration Closed"}
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

            {sessions.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground uppercase py-2">
                No session blocks scheduled for this event.
              </p>
            ) : (
              <div className="relative border-l border-border pl-6 ml-2 space-y-6">
                {sessions.map((sess) => {
                  const startStr = new Date(sess.startTime).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
                  const endStr = sess.endTime ? new Date(sess.endTime).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }) : null;
                  const dateStr = new Date(sess.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" });

                  return (
                    <div key={sess.id} className="relative">
                      <span className="absolute -left-[31px] top-1.5 w-2 h-2 bg-primary rounded-full ring-4 ring-background"></span>
                      <div>
                        <span className="font-mono text-[10px] text-primary uppercase font-bold tracking-wider">
                          {dateStr} / {startStr}{endStr ? ` - ${endStr}` : ""}
                        </span>
                        <h4 className="font-sans text-sm font-bold text-foreground mt-0.5">{sess.title}</h4>
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
              Event Details
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between border-b border-border pb-2 border-dashed">
                <span className="text-muted-foreground">Capacity Limit:</span>
                <span className="text-foreground font-semibold">{event.maxParticipants ? `${event.maxParticipants} Attendees` : "Unlimited"}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2 border-dashed">
                <span className="text-muted-foreground">Registered:</span>
                <span className="text-foreground font-semibold">{activeRegistrationsCount} Facultys</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2 border-dashed">
                <span className="text-muted-foreground">Waitlisted:</span>
                <span className="text-foreground font-semibold">
                  {registrations.filter((r) => r.status === "WAITLISTED").length} Facultys
                </span>
              </div>
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
