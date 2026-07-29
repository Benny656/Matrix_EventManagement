import React from "react";
import { notFound, redirect } from "next/navigation";
import { verifyStaff } from "@/lib/auth-session";
import { adminDb } from "@/lib/firebase-admin";
import Link from "next/link";
import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AttendeeList from "@/components/events/attendee-list";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VolunteerEventDetailsPage({ params }: PageProps) {
  try {
    await verifyStaff();
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

  const confirmedCount = registrations.filter((r: any) => r.status === "REGISTERED").length;
  const waitlistedCount = registrations.filter((r: any) => r.status === "WAITLISTED").length;
  const checkedInCount = checkedInStudentIds.size;

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
        <div className="lg:col-span-8 space-y-6">
          <AttendeeList registrations={registrations as any} />
        </div>

        <div className="lg:col-span-4 space-y-6">
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
