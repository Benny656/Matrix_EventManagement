import { notFound } from "next/navigation";
import { getEvent } from "@/actions/event.actions";
import { getSessionsByEvent } from "@/actions/session.actions";
import { getVolunteers } from "@/actions/volunteer.actions";
import { PageHeader } from "@/components/layout/page-header";
import { SessionsManager } from "@/components/sessions/sessions-manager";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Sessions" };

export default async function EventSessionsPage({ params }: PageProps) {
  const { id } = await params;
  const [event, sessions, volunteers] = await Promise.all([
    getEvent(id),
    getSessionsByEvent(id),
    getVolunteers(),
  ]);

  if (!event) notFound();

  return (
    <div>
      <PageHeader
        title={`Sessions — ${event.title}`}
        description={`Manage sessions and volunteer assignments for this event`}
      />
      <SessionsManager
        eventId={id}
        eventDate={event.date}
        sessions={sessions}
        volunteers={volunteers}
      />
    </div>
  );
}
