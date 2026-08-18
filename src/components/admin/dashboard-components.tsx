import React from "react";
import Link from "next/link";
import { GraduationCap, Zap, ClipboardCheck, Heart } from "lucide-react";
import { adminDb } from "@/lib/firebase-admin";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- StatsGrid Component ---
export async function StatsGrid() {
  const [
    totalStudentsSnapshot,
    totalVolunteersSnapshot,
    activeEventsSnapshot,
    completedEventsSnapshot,
    assignedVolunteersCountSnapshot,
    volunteerPresentCountSnapshot,
  ] = await Promise.all([
    // Pure counts — use aggregation queries instead of pulling every user
    // just to filter+length in JS.
    adminDb.collection("users").where("role", "==", "STUDENT").count().get(),
    adminDb.collection("users").where("role", "==", "VOLUNTEER").count().get(),

    // Count of active events — aggregation query instead of full scan.
    // (requires composite index: events: status ASC — actually `in` on a
    // single field doesn't need composite; see note below)
    adminDb.collection("events").where("status", "in", ["UPCOMING", "ONGOING"]).count().get(),

    // We DO need full docs for completed events (their ids are used below
    // to scope registrations/sessions/attendances), so this stays a regular
    // `.get()` — but scoped to only COMPLETED events instead of everything.
    adminDb.collection("events").where("status", "==", "COMPLETED").get(),

    // Pure counts — aggregation queries instead of full registrations/
    // volunteer_attendances scans.
    adminDb
      .collection("registrations")
      .where("eventRole", "==", "volunteer")
      .where("status", "==", "REGISTERED")
      .count()
      .get(),
    adminDb.collection("volunteer_attendances").where("attendanceStatus", "==", "PRESENT").count().get(),
  ]);

  const totalStudents = totalStudentsSnapshot.data().count;
  const totalVolunteers = totalVolunteersSnapshot.data().count;
  const activeEvents = activeEventsSnapshot.data().count;
  const assignedVolunteersCount = assignedVolunteersCountSnapshot.data().count;
  const volunteerPresentCount = volunteerPresentCountSnapshot.data().count;

  const completedEvents = completedEventsSnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[];

  let totalRsvps = 0;
  let totalUniqueCheckedIn = 0;

  completedEvents.forEach((evt: any) => {
    const rsvps = typeof evt.registrationCount === "number" ? evt.registrationCount : (evt.rsvps ?? 0);
    const unique = typeof evt.uniqueCheckIns === "number" ? evt.uniqueCheckIns : 0;
    totalRsvps += rsvps;
    totalUniqueCheckedIn += unique;
  });

  const attendanceRate = totalRsvps > 0
    ? ((totalUniqueCheckedIn / totalRsvps) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1 */}
      <div className="border border-border bg-card flex flex-col">
        <div className="bg-surface-container px-4 py-2 flex justify-between items-center border-b border-border">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Total Students</span>
          <GraduationCap size={16} className="text-primary" />
        </div>
        <div className="p-4">
          <h2 className="font-mono text-2xl font-bold text-foreground">{totalStudents}</h2>
          <p className="font-mono text-[10px] text-muted-foreground mt-1">Registered in database</p>
        </div>
      </div>

      {/* Card 2 */}
      <div className="border border-border bg-card flex flex-col">
        <div className="bg-surface-container px-4 py-2 flex justify-between items-center border-b border-border">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Active Events</span>
          <Zap size={16} className="text-primary" />
        </div>
        <div className="p-4">
          <h2 className="font-mono text-2xl font-bold text-foreground">{activeEvents}</h2>
          <p className="font-mono text-[10px] text-muted-foreground mt-1">Upcoming or ongoing</p>
        </div>
      </div>

      {/* Card 3 */}
      <div className="border border-border bg-card flex flex-col">
        <div className="bg-surface-container px-4 py-2 flex justify-between items-center border-b border-border">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Participant Attendance</span>
          <ClipboardCheck size={16} className="text-primary" />
        </div>
        <div className="p-4">
          <h2 className="font-mono text-2xl font-bold text-foreground">{attendanceRate}%</h2>
          <p className="font-mono text-[10px] text-muted-foreground mt-1">Completed events rate</p>
        </div>
      </div>

      {/* Card 4 */}
      <div className="border border-border bg-card flex flex-col">
        <div className="bg-surface-container px-4 py-2 flex justify-between items-center border-b border-border">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Volunteer Attendance</span>
          <Heart size={16} className="text-primary" />
        </div>
        <div className="p-4">
          <h2 className="font-mono text-2xl font-bold text-foreground">{volunteerPresentCount} Present</h2>
          <p className="font-mono text-[10px] text-muted-foreground mt-1">{assignedVolunteersCount} total event assignments</p>
        </div>
      </div>
    </div>
  );
}

// --- EventHistoryChart Component ---
export async function EventHistoryChart() {
  // Sort/limit at the query level instead of pulling every event ever
  // created just to sort+slice(0,6) in JS.
  const eventsSnapshot = await adminDb
    .collection("events")
    .orderBy("date", "desc")
    .limit(6)
    .get();

  const chartEventsRaw = eventsSnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[];
  const chartEvents = [...chartEventsRaw].reverse();
  const chartEventIds = chartEvents.map((e) => e.id);

  // Identify which events need live computation (live/ongoing, or completed events without stored stats)
  const liveEvents = chartEvents.filter(
    (e) => e.status !== "COMPLETED" || typeof e.uniqueCheckIns !== "number"
  );
  const liveEventIds = liveEvents.map((e) => e.id);

  const sessionIdsByEvent = new Map<string, string[]>();
  const regCountByEvent = new Map<string, number>();
  const attsBySession = new Map<string, string[]>();

  if (liveEventIds.length > 0) {
    const [sessionsSnapshot, regsSnapshot] = await Promise.all([
      adminDb.collection("sessions").where("eventId", "in", liveEventIds).get(),
      adminDb
        .collection("registrations")
        .where("eventId", "in", liveEventIds)
        .where("status", "==", "REGISTERED")
        .get(),
    ]);

    const allSessions = sessionsSnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[];
    const allRegs = regsSnapshot.docs.map((d: any) => d.data()) as any[];

    allSessions.forEach((s) => {
      const bucket = sessionIdsByEvent.get(s.eventId);
      if (bucket) bucket.push(s.id);
      else sessionIdsByEvent.set(s.eventId, [s.id]);
    });

    allRegs.forEach((r: any) => {
      regCountByEvent.set(r.eventId, (regCountByEvent.get(r.eventId) || 0) + 1);
    });

    const allSessionIds = allSessions.map((s) => s.id);
    const attSnapshots =
      allSessionIds.length > 0
        ? await Promise.all(
            chunk(allSessionIds, 30).map((ids) =>
              adminDb.collection("attendances").where("sessionId", "in", ids).get()
            )
          )
        : [];

    attSnapshots.forEach((s: any) =>
      s.docs.forEach((d: any) => {
        const att = d.data();
        const bucket = attsBySession.get(att.sessionId);
        if (bucket) bucket.push(att.studentId);
        else attsBySession.set(att.sessionId, [att.studentId]);
      })
    );
  }

  let chartData: any[] = chartEvents.map((evt: any) => {
    // If completed and has stored stats, use stored snapshot directly
    if (evt.status === "COMPLETED" && typeof evt.uniqueCheckIns === "number") {
      const rsvps = typeof evt.registrationCount === "number" ? evt.registrationCount : (evt.rsvps ?? 0);
      return {
        id: evt.id,
        title: evt.title || "Event",
        uniqueCheckIns: evt.uniqueCheckIns,
        rsvps,
        status: evt.status,
      };
    }

    // Otherwise use live computed data
    const rsvps = regCountByEvent.get(evt.id) || (typeof evt.registrationCount === "number" ? evt.registrationCount : 0);
    const eventSessionIds = sessionIdsByEvent.get(evt.id) || [];
    const checkedInStudentIds = new Set<string>();
    eventSessionIds.forEach((sessionId) => {
      (attsBySession.get(sessionId) || []).forEach((studentId) => checkedInStudentIds.add(studentId));
    });

    return {
      id: evt.id,
      title: evt.title || "Event",
      uniqueCheckIns: checkedInStudentIds.size,
      rsvps,
      status: evt.status,
    };
  });

  const maxVal = Math.max(...chartData.map((d: any) => d.uniqueCheckIns), 10);

  return (
    <div className="border border-border bg-card flex flex-col h-full">
      <div className="bg-surface-container px-4 py-3 flex justify-between items-center border-b border-border">
        <h3 className="font-mono text-xs uppercase tracking-widest text-foreground font-semibold">Event Attendance History</h3>
        <div className="flex gap-2">
          <Link
            href="/admin/reports"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "bg-surface-container-high px-3 py-1 text-[10px] font-mono rounded-none h-7 shadow-none border-border uppercase inline-flex items-center"
            )}
          >
            Reports
          </Link>
        </div>
      </div>
      
      <div className="p-6 flex-grow flex flex-col justify-end min-h-[350px]">
        {chartData.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-muted-foreground font-mono text-xs uppercase">
            No events recorded yet.
          </div>
        ) : (
          <div className="flex items-end justify-between h-56 gap-4 px-2">
            {chartData.map((d: any) => {
              const percentage = Math.min(Math.round((d.uniqueCheckIns / maxVal) * 100), 100);
              const isCurrent = d.status === "ONGOING" || d.status === "UPCOMING";
              
              return (
                <div key={d.id} className="flex flex-col items-center flex-1 group relative">
                  <div 
                    className={`w-full border border-border transition-colors relative cursor-pointer ${
                      isCurrent 
                        ? "bg-primary-container group-hover:bg-primary" 
                        : "bg-secondary-container group-hover:bg-primary"
                    }`}
                    style={{ height: `${Math.max(percentage, 5)}%` }}
                  >
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-card border border-border px-1 z-10">
                      {d.uniqueCheckIns} / {d.rsvps}
                    </span>
                  </div>
                  <span 
                    className={`font-mono text-[9px] mt-2 text-center block truncate max-w-full uppercase ${
                      isCurrent ? "text-foreground font-bold underline" : "text-muted-foreground"
                    }`}
                    title={d.title}
                  >
                    {d.title.length > 8 ? d.title.substring(0, 8) + ".." : d.title}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="w-full h-[1px] bg-border mt-4 animate-pulse-slow"></div>
        <div className="mt-4 flex flex-wrap justify-between gap-2 font-mono text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-secondary-container border border-border block"></span> Historic Events
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-primary-container border border-border block"></span> Current / Upcoming
          </div>
          <div>Showing last {chartData.length} events</div>
        </div>
      </div>
    </div>
  );
}

// --- SystemFeed Component ---
export async function SystemFeed() {
  const FEED_LIMIT = 8;

  // Pull only the most recent FEED_LIMIT of each activity type at the query
  // level, instead of the entire history of registrations/attendances/
  // updates. Worst case this reads 24 docs total instead of every
  // registration, attendance, and update ever created.
  // (requires single-field index on createdAt desc for each collection —
  // covered by Firestore's default automatic indexing)
  const [regsSnapshot, attsSnapshot, updatesSnapshot] = await Promise.all([
    adminDb.collection("registrations").orderBy("createdAt", "desc").limit(FEED_LIMIT).get(),
    adminDb.collection("attendances").orderBy("createdAt", "desc").limit(FEED_LIMIT).get(),
    adminDb.collection("updates").orderBy("createdAt", "desc").limit(FEED_LIMIT).get(),
  ]);

  const recentRegistrations = regsSnapshot.docs.map((d: any) => d.data());
  const recentAttendances = attsSnapshot.docs.map((d: any) => d.data());
  const recentUpdates = updatesSnapshot.docs.map((d: any) => d.data());

  // Collect only the specific user/event/session ids referenced by these
  // (now small, bounded) activity batches, instead of scanning the entire
  // users/events/sessions collections to build lookup maps.
  const studentIds = new Set<string>();
  const eventIds = new Set<string>();
  const sessionIds = new Set<string>();
  const authorIds = new Set<string>();

  recentRegistrations.forEach((r: any) => {
    if (r.studentId) studentIds.add(r.studentId);
    if (r.eventId) eventIds.add(r.eventId);
  });
  recentAttendances.forEach((a: any) => {
    if (a.studentId) studentIds.add(a.studentId);
    if (a.sessionId) sessionIds.add(a.sessionId);
  });
  recentUpdates.forEach((u: any) => {
    if (u.authorId) authorIds.add(u.authorId);
  });

  // Sessions must be fetched before we know which events they reference.
  const sessionDocs =
    sessionIds.size > 0
      ? await adminDb.getAll(...[...sessionIds].map((id) => adminDb.collection("sessions").doc(id)))
      : [];

  const sessionMap = new Map<string, any>();
  sessionDocs.forEach((doc) => {
    if (doc.exists) {
      const data = doc.data() as any;
      sessionMap.set(doc.id, data);
      if (data.eventId) eventIds.add(data.eventId);
    }
  });

  const allUserIds = [...new Set([...studentIds, ...authorIds])];

  const [userDocs, eventDocs] = await Promise.all([
    allUserIds.length > 0
      ? adminDb.getAll(...allUserIds.map((id) => adminDb.collection("users").doc(id)))
      : Promise.resolve([]),
    eventIds.size > 0
      ? adminDb.getAll(...[...eventIds].map((id) => adminDb.collection("events").doc(id)))
      : Promise.resolve([]),
  ]);

  const userMap = new Map<string, any>();
  userDocs.forEach((doc) => {
    if (doc.exists) userMap.set(doc.id, doc.data());
  });

  const eventMap = new Map<string, any>();
  eventDocs.forEach((doc) => {
    if (doc.exists) eventMap.set(doc.id, doc.data());
  });

  const activities = [
    ...recentRegistrations.map((r: any) => {
      const student = userMap.get(r.studentId) || { name: "Student" };
      const event = eventMap.get(r.eventId) || { title: "Event" };
      return {
        type: "Registration",
        color: "text-primary",
        text: `${student.name} RSVP'd for ${event.title}`,
        time: r.createdAt ? new Date(r.createdAt) : new Date(),
        user: student.name,
      };
    }),
    ...recentAttendances.map((a: any) => {
      const student = userMap.get(a.studentId) || { name: "Student" };
      const session = sessionMap.get(a.sessionId);
      const event = session ? eventMap.get(session.eventId) : null;
      return {
        type: "Attendance",
        color: "text-secondary",
        text: `${student.name} checked in for ${event?.title || "Session"}`,
        time: a.createdAt ? new Date(a.createdAt) : new Date(),
        user: "Scanner",
      };
    }),
    ...recentUpdates.map((u: any) => {
      const author = userMap.get(u.authorId) || { name: "Staff" };
      return {
        type: "Announcement",
        color: "text-muted-foreground",
        text: `Update posted: "${(u.content || "").length > 40 ? u.content.substring(0, 40) + "..." : u.content}"`,
        time: u.createdAt ? new Date(u.createdAt) : new Date(),
        user: author.name,
      };
    }),
  ]
    .sort((a: any, b: any) => b.time.getTime() - a.time.getTime())
    .slice(0, FEED_LIMIT);

  return (
    <div className="border border-border bg-card flex flex-col h-full">
      <div className="bg-surface-container px-4 py-3 flex justify-between items-center border-b border-border">
        <h3 className="font-mono text-xs uppercase tracking-widest text-foreground font-semibold">System Feed</h3>
      </div>
      <div className="flex-grow overflow-y-auto max-h-[350px] divide-y divide-border">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground font-mono text-xs uppercase">
            No recent activity.
          </div>
        ) : (
          activities.map((act: any, i: number) => {
            const dateStr = act.time.toLocaleString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });

            return (
              <div key={i} className="p-4 hover:bg-surface-container transition-colors">
                <span className={`font-mono text-[9px] uppercase tracking-widest ${act.color}`}>
                  {act.type}
                </span>
                <p className="font-sans text-xs text-foreground mt-1 leading-snug">
                  {act.text}
                </p>
                <span className="font-mono text-[9px] text-muted-foreground mt-2 block">
                  {dateStr} • {act.user}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import { SkeletonBox } from "@/components/ui/skeleton-loaders";

export function SectionSkeleton() {
  return (
    <div className="border border-border bg-card p-4 sm:p-6 min-h-[300px] sm:min-h-[350px] flex flex-col justify-between space-y-4 rounded-lg overflow-hidden w-full">
      <div className="flex items-center justify-between gap-2">
        <SkeletonBox className="h-5 w-40 max-w-[60%]" />
        <SkeletonBox className="h-6 w-20 shrink-0" />
      </div>
      <SkeletonBox className="h-52 sm:h-60 w-full rounded-md" />
    </div>
  );
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