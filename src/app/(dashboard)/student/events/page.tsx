import { getPublishedEvents } from "@/actions/event.actions";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatTime, percentage } from "@/lib/utils";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Browse Events" };

export default async function StudentEventsPage() {
  const events = await getPublishedEvents();

  return (
    <div>
      <PageHeader title="Browse Events" description="Discover and register for upcoming events" />
      {events.length === 0 ? (
        <EmptyState icon={Calendar} title="No events available" description="Check back later for upcoming events" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const fillPercent = percentage(event.currentRegistrations, event.maxParticipants);
            const isFull = event.currentRegistrations >= event.maxParticipants;
            return (
              <Card key={event.id} className="flex flex-col">
                {event.posterUrl && (
                  <img
                    src={event.posterUrl}
                    alt={event.title}
                    className="w-full h-40 object-cover rounded-t-lg"
                  />
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">{event.title}</CardTitle>
                    <EventStatusBadge status={event.status} />
                  </div>
                  <Badge variant="secondary" className="w-fit text-xs">
                    {event.category.charAt(0) + event.category.slice(1).toLowerCase()}
                  </Badge>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(event.date, "dd MMM yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatTime(event.startTime)} – {formatTime(event.endTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" />
                      <span>
                        {event.currentRegistrations} / {event.maxParticipants}
                        {isFull && <span className="ml-1 text-destructive font-medium">(Full)</span>}
                      </span>
                    </div>
                  </div>

                  {/* Fill bar */}
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>

                  <Link href={`/student/events/${event.id}`}>
                    <Button size="sm" className="w-full" variant={isFull ? "outline" : "default"}>
                      {isFull ? "View Details" : "View & Register"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
