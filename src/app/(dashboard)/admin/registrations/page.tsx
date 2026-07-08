import { Suspense } from "react";
import { getAllRegistrations } from "@/actions/registration.actions";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { ClipboardList } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Registrations" };

async function RegistrationsTable() {
  const registrations = await getAllRegistrations();

  if (registrations.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No registrations yet"
        description="Students will appear here once they register for events"
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Reg. No.</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Registered At</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registrations.map((reg) => (
            <TableRow key={reg.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{reg.student.name}</p>
                  <p className="text-xs text-muted-foreground">{reg.student.email}</p>
                </div>
              </TableCell>
              <TableCell>{reg.student.registerNumber ?? "—"}</TableCell>
              <TableCell>{reg.student.department ?? "—"}</TableCell>
              <TableCell className="max-w-[160px] truncate">{reg.event.title}</TableCell>
              <TableCell>{formatDate(reg.registeredAt, "dd MMM yyyy")}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    reg.status === "CONFIRMED"
                      ? "success"
                      : reg.status === "CANCELLED"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {reg.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AdminRegistrationsPage() {
  return (
    <div>
      <PageHeader
        title="Registrations"
        description="View all student event registrations"
      />
      <Suspense fallback={<LoadingSkeleton />}>
        <RegistrationsTable />
      </Suspense>
    </div>
  );
}
