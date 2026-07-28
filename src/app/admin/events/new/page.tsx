import React from "react";
import CreateEventWizard from "@/components/events/create-event-wizard";

export const dynamic = "force-dynamic";

export default function NewEventPageAdmin() {
  return <CreateEventWizard role="ADMIN" />;
}
