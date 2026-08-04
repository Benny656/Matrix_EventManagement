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

// Firestore `in` queries are capped at 30 values per query.
// Chunk larger ID sets and fan out with Promise.all.
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
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

  // Sessions and registrations are independent of each other — run in parallel.
  const [sessionsSnapshot, regsSnapshot] = await Promise.all([
    adminDb.collection("sessions").where("eventId", "==", id).get(),
    adminDb.collection("registrations").where("eventId", "==", id).get(),
  ]);

  const sessions = sessionsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
  sessions.sort((a: any, b: any) => (a.startTime || "").localeCompare(b.startTime || ""));

  const activeRegistrations = regsSnapshot.docs
    .map((d: any) => d.data())
    .filter((r: any) => r.status !== "CANCELLED");

  const studentIds = [...new Set(activeRegistrations.map((r: any) => r.studentId))];
  const sessionIds = sessions.map((s: any) => s.id);

  // Fetch only the specific users referenced by this event's registrations
  // (via getAll on known refs), instead of scanning the entire `users`
  // collection. Fetch only attendances belonging to this event's sessions
  // (via chunked `in` queries), instead of scanning the entire
  // `attendances` collection. Both depend on knowing IDs from the reads
  // above, so they run after those resolve.
  const [userDocs, attSnapshots] = await Promise.all([
    studentIds.length > 0
      ? adminDb.getAll(...studentIds.map((studentId) => adminDb.collection("users").doc(studentId)))
      : Promise.resolve([]),
    sessionIds.length > 0
      ? Promise.all(
          chunk(sessionIds, 30).map((idsChunk) =>
            adminDb.collection("attendances").where("sessionId", "in", idsChunk).get()
          )
        )
      : Promise.resolve([]),
  ]);

  const userMap = new Map<string, any>();
  userDocs.forEach((doc) => {
    if (doc.exists) userMap.set(doc.id, doc.data());
  });

  const registrations = activeRegistrations.map((r: any) => {
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

  const attendances: any[] = [];
  attSnapshots.forEach((snapshot) => {
    snapshot.docs.forEach((d) => attendances.push(d.data()));
  });

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
            Coordinator: {event.coordinatorName}
          </p>
        </div>
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