import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getEvent } from "@/actions/event.actions";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDateTime, formatTime, percentage } from "@/lib/utils";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { RegisterButton } from "@/components/registrations/register-button";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  return { title: event ? event.title : "Event Not Found" };
}

export default async function StudentEventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [event, existingRegistration] = await Promise.all([
    getEvent(id),
    prisma.registration.findUnique({
      where: { studentId_eventId: { studentId: session.user.id, eventId: id } },
    }),
  ]);

  if (!event) notFound();

  const isFull = event.currentRegistrations >= event.maxParticipants;
  const deadlinePassed = new Date() > event.registrationDeadline;
  const fillPercent = percentage(event.currentRegistrations, event.maxParticipants);
  const isRegistered = existingRegistration?.status === "CONFIRMED";

  return (
    <div className="max-w-2xl">
      {event.posterUrl && (
        <img
          src={event.posterUrl}
          alt={event.title}
          className="w-full h-56 object-cover rounded-lg mb-6"
        />
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <div className="flex gap-2 mt-2">
            <EventStatusBadge status={event.status} />
            <Badge variant="secondary">
              {event.category.charAt(0) + event.category.slice(1).toLowerCase()}
            </Badge>
          </div>
        </div>
      </div>

      <p className="text-muted-foreground mb-6">{event.description}</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDate(event.date, "dd MMMM yyyy")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formatTime(event.startTime)} – {formatTime(event.endTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{event.venue}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>
                {event.currentRegistrations} / {event.maxParticipants} registered
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Deadline: {formatDate(event.registrationDeadline)}
            </p>
            <p className="text-xs text-muted-foreground">
              Coordinator: {event.coordinator.name}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sessions */}
      {event.sessions.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Sessions ({event.sessions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {event.sessions.map((s) => (
              <div key={s.id} className="border rounded-md p-3 text-sm">
                <p className="font-medium">{s.title}</p>
                <p className="text-muted-foreground">
                  {s.venue} · {formatTime(s.startTime)} – {formatTime(s.endTime)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Register Action */}
      <RegisterButton
        eventId={id}
        isRegistered={isRegistered}
        isFull={isFull}
        deadlinePassed={deadlinePassed}
        registrationId={existingRegistration?.id}
        qrCode={existingRegistration?.qrCode}
      />
    </div>
  );
}
