import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getEvents } from "@/actions/event.actions";
import { Button } from "@/components/ui/button";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { formatDate, formatTime } from "@/lib/utils";
import { DeleteEventButton } from "@/components/events/delete-event-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Events" };

async function EventsTable() {
  const events = await getEvents();

  if (events.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No events yet"
        description="Create your first event to get started"
      >
        <Link href="/admin/events/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Venue</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Registrations</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="font-medium max-w-[200px] truncate">{event.title}</TableCell>
              <TableCell className="whitespace-nowrap">
                <div>{formatDate(event.date, "dd MMM yyyy")}</div>
                <div className="text-xs text-muted-foreground">
                  {formatTime(event.startTime)}
                </div>
              </TableCell>
              <TableCell className="max-w-[120px] truncate">{event.venue}</TableCell>
              <TableCell>{event.category}</TableCell>
              <TableCell>
                {event._count.registrations} / {event.maxParticipants}
              </TableCell>
              <TableCell>
                <EventStatusBadge status={event.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/admin/events/${event.id}`}>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/admin/events/${event.id}/sessions`}>
                    <Button variant="ghost" size="sm">
                      Sessions
                    </Button>
                  </Link>
                  <DeleteEventButton eventId={event.id} eventTitle={event.title} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AdminEventsPage() {
  return (
    <div>
      <PageHeader title="Events" description="Manage all department events">
        <Link href="/admin/events/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </Link>
      </PageHeader>
      <Suspense fallback={<LoadingSkeleton />}>
        <EventsTable />
      </Suspense>
    </div>
  );
}
