import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMyAttendance } from "@/actions/attendance.actions";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";
import { CalendarCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Attendance" };

export default async function MyAttendancePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const attendance = await getMyAttendance(session.user.id);

  return (
    <div>
      <PageHeader title="My Attendance" description={`${attendance.length} session(s) attended`} />
      {attendance.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No attendance records" description="Your attendance will appear here after sessions are marked" />
      ) : (
        <div className="space-y-3">
          {attendance.map((a) => (
            <Card key={a.id}>
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{a.registration.event.title}</p>
                  <p className="text-sm text-muted-foreground">Session: {a.session.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(a.session.startTime, "dd MMM yyyy")} · {formatTime(a.session.startTime)}
                  </p>
                </div>
                <Badge variant={a.method === "QR_SCAN" ? "info" : "secondary"}>
                  {a.method === "QR_SCAN" ? "QR Scan" : "Manual"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
