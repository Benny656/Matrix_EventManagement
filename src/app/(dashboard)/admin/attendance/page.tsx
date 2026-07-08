import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { UserCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Attendance" };

async function AttendanceTable() {
  const attendance = await prisma.attendance.findMany({
    include: {
      registration: {
        include: {
          student: { select: { name: true, registerNumber: true, department: true } },
          event: { select: { title: true } },
        },
      },
      session: { select: { title: true } },
      markedBy: { select: { name: true } },
    },
    orderBy: { markedAt: "desc" },
    take: 100,
  });

  if (attendance.length === 0) {
    return <EmptyState icon={UserCheck} title="No attendance records" description="Attendance will appear here once volunteers mark it" />;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Reg. No.</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Session</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Marked By</TableHead>
            <TableHead>Marked At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendance.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">{a.registration.student.name}</TableCell>
              <TableCell>{a.registration.student.registerNumber ?? "—"}</TableCell>
              <TableCell className="max-w-[140px] truncate">{a.registration.event.title}</TableCell>
              <TableCell>{a.session.title}</TableCell>
              <TableCell>
                <Badge variant={a.method === "QR_SCAN" ? "info" : "secondary"}>
                  {a.method === "QR_SCAN" ? "QR" : "Manual"}
                </Badge>
              </TableCell>
              <TableCell>{a.markedBy.name}</TableCell>
              <TableCell className="whitespace-nowrap">{formatDateTime(a.markedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AdminAttendancePage() {
  return (
    <div>
      <PageHeader title="Attendance Records" description="All attendance records across all events" />
      <Suspense fallback={<LoadingSkeleton />}>
        <AttendanceTable />
      </Suspense>
    </div>
  );
}
