import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getVolunteerSessions } from "@/actions/session.actions";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Events" };

export default async function VolunteerEventsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const assignments = await getVolunteerSessions(session.user.id);
  const eventMap = new Map<string, typeof assignments>();
  for (const a of assignments) {
    const existing = eventMap.get(a.eventId) ?? [];
    existing.push(a);
    eventMap.set(a.eventId, existing);
  }

  return (
    <div>
      <PageHeader title="My Assigned Events" description="Events and sessions you are assigned to" />
      {assignments.length === 0 ? (
        <EmptyState icon={Calendar} title="No events assigned" description="You haven't been assigned to any events yet" />
      ) : (
        <div className="space-y-4">
          {Array.from(eventMap.entries()).map(([, eventAssignments]) => {
            const firstAssignment = eventAssignments[0];
            return (
              <Card key={firstAssignment.eventId}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{firstAssignment.event.title}</h3>
                    </div>
                    <Badge variant="secondary">{eventAssignments.length} session(s)</Badge>
                  </div>
                  <div className="space-y-2">
                    {eventAssignments.map((a) => (
                      <div key={a.id} className="border rounded-md p-2 text-sm">
                        <p className="font-medium">{a.session.title}</p>
                        <p className="text-muted-foreground">
                          {formatDate(a.session.startTime, "dd MMM")} · {formatTime(a.session.startTime)} – {formatTime(a.session.endTime)}
                        </p>
                        <p className="text-xs text-muted-foreground">{a.session._count.attendance} attendance records</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
