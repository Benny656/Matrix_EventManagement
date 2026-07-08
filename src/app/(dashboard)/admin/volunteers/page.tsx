import { Suspense } from "react";
import { getVolunteers, promoteToVolunteer, demoteToStudent } from "@/actions/volunteer.actions";
import { getStudents } from "@/actions/volunteer.actions";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VolunteerActions } from "@/components/volunteers/volunteer-actions";
import { Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Volunteers" };

async function VolunteersContent() {
  const [volunteers, students] = await Promise.all([getVolunteers(), getStudents()]);

  return (
    <div className="space-y-6">
      {/* Current Volunteers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Volunteers ({volunteers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {volunteers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No volunteers yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Assignments</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {volunteers.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell>{v.email}</TableCell>
                    <TableCell>{v.department ?? "—"}</TableCell>
                    <TableCell>{v._count.volunteerAssignments}</TableCell>
                    <TableCell>
                      <VolunteerActions userId={v.id} currentRole="VOLUNTEER" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Promote Students */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Promote Student to Volunteer</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <EmptyState icon={Users} title="No students registered" description="Students who register will appear here" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Reg. No.</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Registrations</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.registerNumber ?? "—"}</TableCell>
                    <TableCell>{s.department ?? "—"}</TableCell>
                    <TableCell>{s._count.registrations}</TableCell>
                    <TableCell>
                      <VolunteerActions userId={s.id} currentRole="STUDENT" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminVolunteersPage() {
  return (
    <div>
      <PageHeader title="Volunteers" description="Manage volunteer assignments and promotions" />
      <Suspense fallback={<LoadingSkeleton />}>
        <VolunteersContent />
      </Suspense>
    </div>
  );
}
