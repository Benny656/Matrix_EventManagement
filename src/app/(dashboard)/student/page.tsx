import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMyRegistrations } from "@/actions/registration.actions";
import { getMyAttendance } from "@/actions/attendance.actions";
import { getPublishedEvents } from "@/actions/event.actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { formatDate } from "@/lib/utils";
import { Calendar, BookOpen, CalendarCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Student Dashboard" };

export default async function StudentDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [registrations, attendance, upcomingEvents] = await Promise.all([
    getMyRegistrations(),
    getMyAttendance(session.user.id),
    getPublishedEvents(),
  ]);

  const confirmedRegs = registrations.filter((r) => r.status === "CONFIRMED");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome, {session.user.name}!</h1>
        <p className="text-sm text-muted-foreground">Manage your event registrations and attendance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard title="My Registrations" value={confirmedRegs.length} icon={BookOpen} description="Active registrations" />
        <StatCard title="Sessions Attended" value={attendance.length} icon={CalendarCheck} description="Total attendance" />
        <StatCard title="Available Events" value={upcomingEvents.length} icon={Calendar} description="Open for registration" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Registrations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">My Recent Registrations</CardTitle>
            <Link href="/student/my-registrations">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {confirmedRegs.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">No registrations yet</p>
                <Link href="/student/events">
                  <Button size="sm">Browse Events</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {confirmedRegs.slice(0, 4).map((reg) => (
                  <div key={reg.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">{reg.event.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(reg.event.date)}</p>
                    </div>
                    <EventStatusBadge status="PUBLISHED" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming Events</CardTitle>
            <Link href="/student/events">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events available</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 4).map((event) => (
                  <Link href={`/student/events/${event.id}`} key={event.id}>
                    <div className="flex items-center justify-between hover:bg-muted/50 rounded-md p-1 -m-1 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(event.date)} · {event.venue}
                        </p>
                      </div>
                      <EventStatusBadge status={event.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
