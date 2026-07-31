import React from "react";
import { notFound, redirect } from "next/navigation";
import { verifyAdmin } from "@/lib/auth-session";
import { adminDb } from "@/lib/firebase-admin";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AttendeeList from "@/components/events/attendee-list";
import { FileText } from "lucide-react";
import EditRegistrationStatusForm from "@/components/events/edit-registration-status-form";
import EditCapacityForm from "@/components/events/edit-capacity-form";
import EditWhatsappLinkForm from "@/components/events/edit-whatsapp-link-form";
import AdminEventTabs from "@/components/events/admin-event-tabs";
import { getEventVolunteersAction, getEventRegistrationsForVolunteerAssignmentAction } from "@/actions/volunteer-management";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEventDetailsPage({ params }: PageProps) {
  try {
    await verifyAdmin();
  } catch {
    redirect("/login");
  }

  const { id } = await params;

  const eventDoc = await adminDb.collection("events").doc(id).get();
  if (!eventDoc.exists) {
    notFound();
  }

  const event = { id: eventDoc.id, ...eventDoc.data() } as any;

  const sessionsSnapshot = await adminDb
    .collection("sessions")
    .where("eventId", "==", id)
    .get();
  const sessions = sessionsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
  sessions.sort((a: any, b: any) => (a.startTime || "").localeCompare(b.startTime || ""));

  const regsSnapshot = await adminDb
    .collection("registrations")
    .where("eventId", "==", id)
    .get();

  const usersSnapshot = await adminDb.collection("users").get();
  const userMap = new Map<string, any>();
  usersSnapshot.docs.forEach((d: any) => userMap.set(d.id, d.data()));

  const registrations = regsSnapshot.docs
    .map((d: any) => d.data())
    .filter((r: any) => r.status !== "CANCELLED")
    .map((r: any) => {
      const student = userMap.get(r.studentId) || { name: "Unknown", email: "" };
      return {
        ...r,
        eventRole: r.eventRole || "participant",
        student: {
          id: r.studentId,
          name: student.name,
          email: student.email,
          rollNumber: student.rollNumber || null,
        },
      };
    });

  const sessionIds = sessions.map((s: any) => s.id);
  const attsSnapshot = await adminDb.collection("attendances").get();
  const attendances = attsSnapshot.docs
    .map((d: any) => d.data())
    .filter((a: any) => sessionIds.includes(a.sessionId));

  const sessionAttMap = new Map<string, number>();
  attendances.forEach((a: any) => {
    sessionAttMap.set(a.sessionId, (sessionAttMap.get(a.sessionId) || 0) + 1);
  });

  const checkedInStudentIds = new Set(attendances.map((a: any) => a.studentId));

  const participantRegs = registrations.filter((r: any) => r.eventRole !== "volunteer");
  const confirmedCount = participantRegs.filter((r: any) => r.status === "REGISTERED").length;
  const waitlistedCount = participantRegs.filter((r: any) => r.status === "WAITLISTED").length;
  const checkedInCount = checkedInStudentIds.size;

  // Fetch Volunteers and all registrations for volunteer assignment
  const volunteers = await getEventVolunteersAction(id);
  const allRegsForVolunteer = await getEventRegistrationsForVolunteerAssignmentAction(id);
  const volunteerPresentCount = volunteers.filter((v) => v.attendanceStatus === "PRESENT").length;

  const sessionsWithCount = sessions.map((s: any) => ({
    ...s,
    attendances: Array(sessionAttMap.get(s.id) || 0).fill(true),
  }));

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
          href={`/admin/reports?eventId=${event.id}`}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "font-mono text-xs uppercase tracking-wider rounded-none h-9 px-4 shadow-none hover:bg-surface-container border-border inline-flex items-center"
          )}
        >
          <FileText size={14} className="mr-2" />
          View Reports
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-border bg-card p-4">
          <div className="font-mono text-[10px] text-muted-foreground mb-1 uppercase">Participants RSVP</div>
          <div className="font-heading text-2xl font-bold text-foreground">{confirmedCount}</div>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="font-mono text-[10px] text-muted-foreground mb-1 uppercase">Assigned Volunteers</div>
          <div className="font-heading text-2xl font-bold text-primary">{volunteers.length}</div>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="font-mono text-[10px] text-muted-foreground mb-1 uppercase">Participant Check-Ins</div>
          <div className="font-heading text-2xl font-bold text-foreground">{checkedInCount}</div>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="font-mono text-[10px] text-muted-foreground mb-1 uppercase">Volunteer Attendance</div>
          <div className="font-heading text-2xl font-bold text-primary">{volunteerPresentCount} / {volunteers.length}</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <AdminEventTabs
            eventId={event.id}
            registrations={registrations}
            volunteers={volunteers}
            allRegistrationsForVolunteerAssignment={allRegsForVolunteer}
            isAdmin={true}
          />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <EditRegistrationStatusForm eventId={event.id} initialRegistrationOpen={event.registrationOpen ?? true} />
          <EditCapacityForm eventId={event.id} initialCapacity={event.maxParticipants} />
          <EditWhatsappLinkForm eventId={event.id} initialWhatsappInviteLink={event.whatsappInviteLink || null} />

          {/* Eligibility Panel */}
          <div className="border border-border p-6 bg-card space-y-4">
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground border-b border-border pb-1 font-semibold">
              Audience Eligibility
            </h3>
            <div className="space-y-3 font-mono text-xs">
              {(() => {
                const elig = event.eligibility;
                const audience: string = elig?.targetAudience ?? "ALL";
                return (
                  <>
                    <div className="flex justify-between border-b border-dashed border-border pb-2">
                      <span className="text-muted-foreground">Target Audience:</span>
                      <span className="font-semibold text-foreground uppercase">{audience}</span>
                    </div>
                    {audience === "STUDENTS" && (
                      <>
                        <div className="flex justify-between border-b border-dashed border-border pb-2">
                          <span className="text-muted-foreground">Degree:</span>
                          <span className="font-semibold text-foreground">{elig?.degree ?? "ALL"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Year(s):</span>
                          <span className="font-semibold text-foreground text-right">
                            {elig?.years && elig.years.length > 0
                              ? elig.years.join(", ")
                              : "All"}
                          </span>
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
          
          <div className="border border-border p-6 bg-card space-y-6">
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground border-b border-border pb-1 font-semibold">
              Event Sessions Timeline
            </h3>

            {sessionsWithCount.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground uppercase py-2">
                No session blocks scheduled.
              </p>
            ) : (
              <div className="relative border-l border-border pl-6 ml-2 space-y-6">
                {sessionsWithCount.map((sess) => {
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
