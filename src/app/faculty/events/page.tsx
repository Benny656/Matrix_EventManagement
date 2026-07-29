import React from "react";
import { getEventsAction } from "@/actions/event";
import FacultyEventList from "@/components/events/faculty-event-list";

export const dynamic = "force-dynamic";

export default async function FacultyEventsPage() {
  const events = await getEventsAction(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground tracking-tighter mb-1">
          Active Events
        </h1>
        <p className="font-sans text-sm text-muted-foreground">
          Browse active training camps, workshops, research symposiums, and audits.
        </p>
      </div>

      <FacultyEventList events={events as any} />
    </div>
  );
}
