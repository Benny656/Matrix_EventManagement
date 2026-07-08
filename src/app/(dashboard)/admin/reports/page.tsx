import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown } from "lucide-react";
import type { Metadata } from "next";
import { ReportDownloadButtons } from "@/components/reports/report-download-buttons";
import { getEvents } from "@/actions/event.actions";

export const metadata: Metadata = { title: "Reports" };

export default async function AdminReportsPage() {
  const events = await getEvents();

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Download registration and attendance reports"
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              All Registrations
            </CardTitle>
            <CardDescription>Download complete registration list for all events</CardDescription>
          </CardHeader>
          <CardContent>
            <ReportDownloadButtons type="registrations" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              All Attendance
            </CardTitle>
            <CardDescription>Download complete attendance records for all sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <ReportDownloadButtons type="attendance" />
          </CardContent>
        </Card>

        {events.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <CardTitle className="text-base truncate">{event.title}</CardTitle>
              <CardDescription>Event-specific reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Registrations</p>
              <ReportDownloadButtons type="registrations" eventId={event.id} />
              <p className="text-xs text-muted-foreground font-medium mt-2">Attendance</p>
              <ReportDownloadButtons type="attendance" eventId={event.id} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
