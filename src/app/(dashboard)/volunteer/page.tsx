import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getVolunteerSessions } from "@/actions/session.actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatTime } from "@/lib/utils";
import { Calendar, ClipboardList, QrCode, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Volunteer Dashboard" };

export default async function VolunteerDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const assignments = await getVolunteerSessions(session.user.id);

  const activeEvents = new Set(assignments.map((a) => a.eventId)).size;
  const upcomingSessions = assignments.filter(
    (a) => new Date(a.session.startTime) > new Date()
  ).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome back, {session.user.name}</h1>
        <p className="text-sm text-muted-foreground">Volunteer Dashboard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard title="Assigned Events" value={activeEvents} icon={Calendar} />
        <StatCard title="Total Sessions" value={assignments.length} icon={Users} />
        <StatCard title="Upcoming Sessions" value={upcomingSessions} icon={ClipboardList} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Assigned Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions assigned to you yet</p>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <p className="font-medium">{a.session.title}</p>
                    <p className="text-sm text-muted-foreground">{a.event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(a.session.startTime, "dd MMM")} · {formatTime(a.session.startTime)} – {formatTime(a.session.endTime)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {a.session._count.attendance} marked
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
