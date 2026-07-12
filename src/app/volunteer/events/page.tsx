import React from "react";
import Link from "next/link";
import { getEventsAction } from "@/actions/event";
import EventsTable from "@/components/events/events-table";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VolunteerEventsPage() {
  const events = await getEventsAction(true);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground tracking-tighter mb-1">
            Events Management
          </h1>
          <p className="font-sans text-sm text-muted-foreground">
            Monitor and coordinate active deployments, or review historically archived events.
          </p>
        </div>
        <div>
          <Link
            href="/volunteer/events/new"
            className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest py-3 px-6 hover:bg-primary-container transition-all active:scale-95 flex items-center justify-center gap-1"
          >
            <Plus size={14} />
            Create Event
          </Link>
        </div>
      </div>

      <EventsTable initialEvents={events as any} role="VOLUNTEER" />
    </div>
  );
}
