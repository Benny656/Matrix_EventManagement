import React from "react";
import { redirect } from "next/navigation";
import { verifyAdmin } from "@/lib/auth-session";
import AttendanceViewer from "@/components/admin/attendance-viewer";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ eventId?: string }>;
}

export default async function AdminReportsPage({ searchParams }: PageProps) {
  try {
    await verifyAdmin();
  } catch {
    redirect("/login");
  }

  const { eventId } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground tracking-tighter mb-1">
          Attendance Reports & Exports
        </h1>
        <p className="font-sans text-sm text-muted-foreground">
          Select an event and session to inspect live attendance records, filter check-ins, and export PDF or Excel reports.
        </p>
      </div>

      <AttendanceViewer initialEventId={eventId} />
    </div>
  );
}
