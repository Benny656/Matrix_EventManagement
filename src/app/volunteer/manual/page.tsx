import React from "react";
import { getActiveSessionsAction } from "@/app/actions/attendance";
import AttendanceScanner from "@/components/events/attendance-scanner";

export const dynamic = "force-dynamic";

export default async function ManualCheckInPage() {
  const sessions = await getActiveSessionsAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground tracking-tighter mb-1">
          Manual Check-in fallback
        </h1>
        <p className="font-sans text-sm text-muted-foreground">
          Lookup student records by roll number to check them in manually.
        </p>
      </div>

      {/* Reusing scanner layout, but since it is client component, it houses both scanner and manual form. Keeping the unified terminal is preferred by volunteers. */}
      <AttendanceScanner sessions={sessions as any} />
    </div>
  );
}
