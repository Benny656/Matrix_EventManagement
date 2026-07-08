import { notFound } from "next/navigation";
import { getEvent } from "@/actions/event.actions";
import { EventForm } from "@/components/events/event-form";
import { PageHeader } from "@/components/layout/page-header";
import { prisma } from "@/lib/prisma";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Layers } from "lucide-react";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  return { title: event ? `Edit: ${event.title}` : "Event Not Found" };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [event, coordinators] = await Promise.all([
    getEvent(id),
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "VOLUNTEER"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!event) notFound();

  return (
    <div>
      <PageHeader title={event.title} description={`Created ${formatDateTime(event.createdAt)}`}>
        <EventStatusBadge status={event.status} />
        <Link href={`/admin/events/${id}/sessions`}>
          <Button variant="outline">
            <Layers className="mr-2 h-4 w-4" />
            Sessions ({event._count.sessions})
          </Button>
        </Link>
      </PageHeader>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Registrations</p>
            <p className="text-2xl font-bold">
              {event._count.registrations} / {event.maxParticipants}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Sessions</p>
            <p className="text-2xl font-bold">{event._count.sessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Deadline</p>
            <p className="text-sm font-semibold mt-1">{formatDate(event.registrationDeadline)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-3xl">
        <h2 className="text-lg font-semibold mb-4">Edit Event</h2>
        <EventForm event={event} coordinators={coordinators} />
      </div>
    </div>
  );
}
