import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // ── Parallel fetch: all independent queries run simultaneously ──────────────
  // (react-best-practices skill: async-parallel — use Promise.all to eliminate waterfalls)
  const [
    totalStudents,
    totalVolunteers,
    activeEvents,
    completedEvents,
    chartEventsRaw,
    recentRegistrations,
    recentAttendances,
    recentUpdates,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "VOLUNTEER" } }),
    prisma.event.count({ where: { status: { in: ["UPCOMING", "ONGOING"] } } }),
    prisma.event.findMany({
      where: { status: "COMPLETED" },
      include: {
        registrations: { where: { status: "REGISTERED" } },
        sessions: { include: { attendances: true } },
      },
    }),
    prisma.event.findMany({
      take: 6,
      orderBy: { date: "desc" },
      include: {
        registrations: { where: { status: "REGISTERED" } },
        sessions: { include: { attendances: true } },
      },
    }),
    prisma.registration.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { student: true, event: true },
    }),
    prisma.attendance.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { student: true, session: { include: { event: true } } },
    }),
    prisma.update.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { author: true },
    }),
  ]);

  // Calculate Attendance Rate % for completed events
  let totalRsvps = 0;
  let totalUniqueCheckedIn = 0;

  completedEvents.forEach((evt) => {
    totalRsvps += evt.registrations.length;
    const checkedInStudentIds = new Set<string>();
    evt.sessions.forEach((sess) => {
      sess.attendances.forEach((att) => {
        checkedInStudentIds.add(att.studentId);
      });
    });
    totalUniqueCheckedIn += checkedInStudentIds.size;
  });

  const attendanceRate = totalRsvps > 0
    ? ((totalUniqueCheckedIn / totalRsvps) * 100).toFixed(1)
    : "0.0";

  const chartEvents = [...chartEventsRaw].reverse();

  const chartData = chartEvents.map((evt) => {
    const rsvps = evt.registrations.length;
    const checkedInStudentIds = new Set<string>();
    evt.sessions.forEach((sess) => {
      sess.attendances.forEach((att) => {
        checkedInStudentIds.add(att.studentId);
      });
    });
    const uniqueCheckIns = checkedInStudentIds.size;
    return { id: evt.id, title: evt.title, uniqueCheckIns, rsvps, status: evt.status };
  });

  const maxVal = Math.max(...chartData.map((d) => d.uniqueCheckIns), 10);

  // Merge and sort activities
  const activities = [
    ...recentRegistrations.map((r) => ({
      type: "Registration",
      color: "text-primary",
      text: `${r.student.name} RSVP'd for ${r.event.title}`,
      time: r.createdAt,
      user: r.student.name,
    })),
    ...recentAttendances.map((a) => ({
      type: "Attendance",
      color: "text-secondary",
      text: `${a.student.name} checked in for ${a.session.event.title}`,
      time: a.createdAt,
      user: "Scanner",
    })),
    ...recentUpdates.map((u) => ({
      type: "Announcement",
      color: "text-muted-foreground",
      text: `Update posted: "${u.content.length > 40 ? u.content.substring(0, 40) + "..." : u.content}"`,
      time: u.createdAt,
      user: u.author.name,
    })),
  ]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="border border-border bg-card flex flex-col">
          <div className="bg-surface-container px-4 py-2 flex justify-between items-center border-b border-border">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Total Students</span>
            <span className="material-symbols-outlined text-primary text-[18px]">school</span>
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
            <span className="material-symbols-outlined text-primary text-[18px]">bolt</span>
          </div>
          <div className="p-4">
            <h2 className="font-mono text-2xl font-bold text-foreground">{activeEvents}</h2>
            <p className="font-mono text-[10px] text-muted-foreground mt-1">Upcoming or ongoing</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="border border-border bg-card flex flex-col">
          <div className="bg-surface-container px-4 py-2 flex justify-between items-center border-b border-border">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Attendance Rate</span>
            <span className="material-symbols-outlined text-primary text-[18px]">fact_check</span>
          </div>
          <div className="p-4">
            <h2 className="font-mono text-2xl font-bold text-foreground">{attendanceRate}%</h2>
            <p className="font-mono text-[10px] text-muted-foreground mt-1">For all completed events</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="border border-border bg-card flex flex-col">
          <div className="bg-surface-container px-4 py-2 flex justify-between items-center border-b border-border">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Total Volunteers</span>
            <span className="material-symbols-outlined text-primary text-[18px]">volunteer_activism</span>
          </div>
          <div className="p-4">
            <h2 className="font-mono text-2xl font-bold text-foreground">{totalVolunteers}</h2>
            <p className="font-mono text-[10px] text-muted-foreground mt-1">Authorized staff profiles</p>
          </div>
        </div>
      </div>

      {/* Visualizations & Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart Column */}
        <div className="lg:col-span-8 border border-border bg-card flex flex-col">
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
          
          <div className="p-6 flex-1 flex flex-col justify-end min-h-[350px]">
            {chartData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground font-mono text-xs uppercase">
                No events recorded yet.
              </div>
            ) : (
              <div className="flex items-end justify-between h-56 gap-4 px-2">
                {chartData.map((d) => {
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

            {/* Divider */}
            <div className="w-full h-[1px] bg-border mt-4"></div>
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

        {/* Feed Column */}
        <div className="lg:col-span-4 border border-border bg-card flex flex-col">
          <div className="bg-surface-container px-4 py-3 flex justify-between items-center border-b border-border">
            <h3 className="font-mono text-xs uppercase tracking-widest text-foreground font-semibold">System Feed</h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[350px] divide-y divide-border">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground font-mono text-xs uppercase">
                No recent activity.
              </div>
            ) : (
              activities.map((act, i) => {
                const dateStr = new Date(act.time).toLocaleString("en-US", {
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
      </div>
    </div>
  );
}
