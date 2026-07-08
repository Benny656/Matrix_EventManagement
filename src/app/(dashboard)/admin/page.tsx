import { Suspense } from "react";
import { Calendar, Users, ClipboardList, TrendingUp } from "lucide-react";
import { getAdminDashboardStats } from "@/actions/volunteer.actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };

async function DashboardStats() {
  const stats = await getAdminDashboardStats();

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Events"
          value={stats.totalEvents}
          description="All time"
          icon={Calendar}
        />
        <StatCard
          title="Active Events"
          value={stats.activeEvents}
          description="Published + Ongoing"
          icon={TrendingUp}
        />
        <StatCard
          title="Total Registrations"
          value={stats.totalRegistrations}
          description="Confirmed registrations"
          icon={Users}
        />
        <StatCard
          title="Attendance Rate"
          value={`${stats.attendancePercentage}%`}
          description="Across all sessions"
          icon={ClipboardList}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 mt-6">
        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet</p>
            ) : (
              <div className="space-y-3">
                {stats.recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {event._count.registrations} reg.
                      </span>
                      <EventStatusBadge status={event.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Registrations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentRegistrations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No registrations yet</p>
            ) : (
              <div className="space-y-3">
                {stats.recentRegistrations.map((reg) => (
                  <div key={reg.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{reg.student.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {reg.event.title}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(reg.registeredAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of all events, registrations, and attendance
        </p>
      </div>
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
          </div>
        }
      >
        <DashboardStats />
      </Suspense>
    </div>
  );
}
