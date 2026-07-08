import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getVolunteerSessions } from "@/actions/session.actions";
import { getSessionAttendance } from "@/actions/attendance.actions";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { UserCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Attendance History" };

export default async function VolunteerAttendancePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const assignments = await getVolunteerSessions(session.user.id);

  if (assignments.length === 0) {
    return (
      <div>
        <PageHeader title="Attendance History" description="View attendance records you have marked" />
        <EmptyState icon={UserCheck} title="No sessions assigned" description="You haven't been assigned to any sessions yet" />
      </div>
    );
  }

  // Fetch attendance for all assigned sessions
  const attendanceBySession = await Promise.all(
    assignments.map(async (a) => ({
      session: a.session,
      eventTitle: a.event.title,
      attendance: await getSessionAttendance(a.session.id),
    }))
  );

  return (
    <div>
      <PageHeader title="Attendance History" description="All attendance records from your sessions" />
      <div className="space-y-4">
        {attendanceBySession.map(({ session: sess, eventTitle, attendance }) => (
          <Card key={sess.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>{eventTitle} — {sess.title}</span>
                <Badge variant="secondary">{attendance.length} marked</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attendance marked yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Reg. No.</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Marked At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.registration.student.name}</TableCell>
                        <TableCell>{a.registration.student.registerNumber ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={a.method === "QR_SCAN" ? "info" : "secondary"}>
                            {a.method === "QR_SCAN" ? "QR" : "Manual"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(a.markedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
