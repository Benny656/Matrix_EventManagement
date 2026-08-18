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
import EditSessionsForm from "@/components/events/edit-sessions-form";
import AdminEventTabs from "@/components/events/admin-event-tabs";
import { VolunteerMember } from "@/actions/volunteer-management";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Firestore `in` queries are capped at 30 values per query.
// Chunk larger ID sets and fan out with Promise.all.
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export default async function AdminEventDetailsPage({ params }: PageProps) {
  try {
    await verifyAdmin();
  } catch {
    redirect("/login");
  }

  const { id } = await params;

  // Single-pass initial fetch: event doc, sessions, registrations, and volunteer attendances
  const [eventDoc, sessionsSnapshot, regsSnapshot, volAttSnapshot] = await Promise.all([
    adminDb.collection("events").doc(id).get(),
    adminDb.collection("sessions").where("eventId", "==", id).get(),
    adminDb.collection("registrations").where("eventId", "==", id).get(),
    adminDb.collection("volunteer_attendances").where("eventId", "==", id).get(),
  ]);

  if (!eventDoc.exists) {
    notFound();
  }

  const event = { id: eventDoc.id, ...eventDoc.data() } as any;

  const sessions = sessionsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
  sessions.sort((a: any, b: any) => (a.startTime || "").localeCompare(b.startTime || ""));

  const allEventRegs = regsSnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as any));
  const activeRegistrations = allEventRegs.filter((r: any) => r.status !== "CANCELLED");

  // Fallback ONLY for legacy registrations missing denormalized names
  const missingStudentIds = Array.from(
    new Set(
      activeRegistrations
        .filter((r: any) => !r.studentName)
        .map((r: any) => r.studentId)
        .filter(Boolean)
    )
  );

  const sessionIds = sessions.map((s: any) => s.id);

  // Parallel fetch: legacy users fallback (if any) and lightweight session attendance counts (count queries)
  const [userDocs, sessionCounts] = await Promise.all([
    missingStudentIds.length > 0
      ? adminDb.getAll(...missingStudentIds.map((studentId) => adminDb.collection("users").doc(studentId)))
      : Promise.resolve([]),
    sessionIds.length > 0
      ? Promise.all(
          sessionIds.map((sid) =>
            adminDb
              .collection("attendances")
              .where("sessionId", "==", sid)
              .count()
              .get()
              .then((snap) => ({ sessionId: sid, count: snap.data().count }))
              .catch(() => ({ sessionId: sid, count: 0 }))
          )
        )
      : Promise.resolve([]),
  ]);

  const userMap = new Map<string, any>();
  userDocs.forEach((doc) => {
    if (doc.exists) userMap.set(doc.id, doc.data());
  });

  const sessionAttCountMap = new Map<string, number>();
  sessionCounts.forEach((sc) => {
    sessionAttCountMap.set(sc.sessionId, sc.count);
  });

  const volAttMap = new Map<string, any>();
  volAttSnapshot.docs.forEach((d) => {
    const data = d.data();
    volAttMap.set(data.volunteerId, data);
  });

  // Construct volunteers from denormalized registration properties directly
  const volunteerRegs = activeRegistrations.filter((r: any) => r.eventRole === "volunteer");
  const volunteers: VolunteerMember[] = volunteerRegs.map((r: any) => {
    const fallbackUser = userMap.get(r.studentId);
    const att = volAttMap.get(r.studentId);
    return {
      registrationId: r.id,
      studentId: r.studentId,
      eventId: r.eventId,
      eventRole: "volunteer",
      status: r.status,
      name: r.studentName || fallbackUser?.name || "Unknown",
      email: r.email || fallbackUser?.email || "",
      rollNumber: r.rollNumber || fallbackUser?.rollNumber || null,
      department: r.department || fallbackUser?.department || null,
      attendanceStatus: att ? att.attendanceStatus : "NOT_MARKED",
      markedBy: att?.markedBy || null,
      markedByName: att?.markedByName || null,
      markedAt: att?.markedAt || null,
    };
  });
  volunteers.sort((a, b) => a.name.localeCompare(b.name));

  // Construct allRegistrationsForVolunteerAssignment directly from denormalized registration properties
  const allRegsForVolunteer = activeRegistrations.map((r: any) => {
    const fallbackUser = userMap.get(r.studentId);
    return {
      registrationId: r.id,
      studentId: r.studentId,
      eventId: r.eventId,
      eventRole: (r.eventRole as "participant" | "volunteer") || "participant",
      status: r.status,
      name: r.studentName || fallbackUser?.name || "Unknown",
      email: r.email || fallbackUser?.email || "",
      rollNumber: r.rollNumber || fallbackUser?.rollNumber || null,
      department: r.department || fallbackUser?.department || null,
    };
  });
  allRegsForVolunteer.sort((a, b) => a.name.localeCompare(b.name));

  const registrations = activeRegistrations.map((r: any) => {
    const fallbackUser = userMap.get(r.studentId);
    return {
      ...r,
      eventRole: r.eventRole || "participant",
      student: {
        id: r.studentId,
        name: r.studentName || fallbackUser?.name || "Unknown",
        email: r.email || fallbackUser?.email || "",
        rollNumber: r.rollNumber || fallbackUser?.rollNumber || null,
      },
    };
  });

  const participantRegs = registrations.filter((r: any) => r.eventRole !== "volunteer");
  const confirmedCount = participantRegs.filter((r: any) => r.status === "REGISTERED").length;
  const waitlistedCount = participantRegs.filter((r: any) => r.status === "WAITLISTED").length;
  
  // Use stored event uniqueCheckIns or max session attendance count
  const checkedInCount = typeof event.uniqueCheckIns === "number"
    ? event.uniqueCheckIns
    : Math.max(...Array.from(sessionAttCountMap.values()), 0);

  const volunteerPresentCount = volunteers.filter((v) => v.attendanceStatus === "PRESENT").length;

  const sessionsWithCount = sessions.map((s: any) => ({
    ...s,
    attendances: Array(sessionAttCountMap.get(s.id) || 0).fill(true),
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
            Coordinator: {event.coordinatorName}
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
                      <span className="font-semibold text-foreground uppercase">
                        {audience === "BOTH" ? "BOTH (STUDENTS & FACULTY)" : audience}
                      </span>
                    </div>
                    {(audience === "STUDENTS" || audience === "BOTH") && (
                      <>
                        <div className="flex justify-between border-b border-dashed border-border pb-2">
                          <span className="text-muted-foreground">Degree Level(s):</span>
                          <span className="font-semibold text-foreground">
                            {elig?.degrees && elig.degrees.length > 0
                              ? elig.degrees.join(", ")
                              : elig?.degree ?? "ALL"}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-dashed border-border pb-2">
                          <span className="text-muted-foreground">Year(s):</span>
                          <span className="font-semibold text-foreground text-right">
                            {elig?.years && elig.years.length > 0
                              ? elig.years.join(", ")
                              : "All"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Department(s):</span>
                          <span className="font-semibold text-foreground text-right">
                            {elig?.departments && elig.departments.length > 0
                              ? elig.departments.join(", ")
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
          
          <EditSessionsForm eventId={event.id} sessions={sessionsWithCount} />
        </div>
      </div>
    </div>
  );
}