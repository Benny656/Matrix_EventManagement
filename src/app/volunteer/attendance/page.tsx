import React from "react";
import { getActiveSessionsAction } from "@/actions/attendance";
import AttendanceScanner from "@/components/events/attendance-scanner";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const sessions = await getActiveSessionsAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground tracking-tighter mb-1">
          Attendance Terminal
        </h1>
        <p className="font-sans text-sm text-muted-foreground">
          Deploy QR scanner verification protocol or manual override check-in logs.
        </p>
      </div>

      <AttendanceScanner sessions={sessions as any} />
    </div>
  );
}
