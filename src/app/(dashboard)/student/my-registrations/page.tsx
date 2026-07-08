import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMyRegistrations } from "@/actions/registration.actions";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Registrations" };

export default async function MyRegistrationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const registrations = await getMyRegistrations();

  return (
    <div>
      <PageHeader title="My Registrations" description="All your event registrations" />
      {registrations.length === 0 ? (
        <EmptyState icon={BookOpen} title="No registrations" description="You haven't registered for any events yet">
          <Link href="/student/events">
            <Button size="sm">Browse Events</Button>
          </Link>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {registrations.map((reg) => (
            <Card key={reg.id}>
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{reg.event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(reg.event.date)} · {reg.event.venue}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registered: {formatDate(reg.registeredAt, "dd MMM yyyy")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Attended: {reg.attendance.length} session(s)
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    variant={
                      reg.status === "CONFIRMED"
                        ? "success"
                        : reg.status === "CANCELLED"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {reg.status}
                  </Badge>
                  {reg.status === "CONFIRMED" && (
                    <Link href={`/student/events/${reg.eventId}`}>
                      <Button variant="outline" size="sm">View QR</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
