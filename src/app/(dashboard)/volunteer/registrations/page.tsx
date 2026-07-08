import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getVolunteerSessions } from "@/actions/session.actions";
import { PageHeader } from "@/components/layout/page-header";
import { ManualRegistrationForm } from "@/components/registrations/manual-registration-form";
import { EmptyState } from "@/components/shared/empty-state";
import { ClipboardList } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manual Registration" };

export default async function VolunteerRegistrationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const assignments = await getVolunteerSessions(session.user.id);
  const events = Array.from(
    new Map(
      assignments.map((a) => [a.eventId, { id: a.eventId, title: a.event.title }])
    ).values()
  );

  if (events.length === 0) {
    return (
      <div>
        <PageHeader title="Manual Registration" description="Register students for events manually" />
        <EmptyState icon={ClipboardList} title="No events assigned" description="You haven't been assigned to any events yet" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Manual Registration" description="Register students for events by register number" />
      <div className="max-w-md">
        <ManualRegistrationForm events={events} />
      </div>
    </div>
  );
}
