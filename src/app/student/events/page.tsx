import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-session";
import { getEventsAction } from "@/actions/event";
import StudentEventList from "@/components/events/student-event-list";

export const dynamic = "force-dynamic";

export default async function StudentEventsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "STUDENT") {
    redirect("/login");
  }

  const events = await getEventsAction(false, currentUser);

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

      <StudentEventList events={events as any} />
    </div>
  );
}
