import React from "react";
import CreateEventWizard from "@/components/events/create-event-wizard";

export const dynamic = "force-dynamic";

export default function NewEventPage() {
  return <CreateEventWizard role="VOLUNTEER" />;
}
