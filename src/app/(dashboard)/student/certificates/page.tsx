import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMyRegistrations } from "@/actions/registration.actions";
import { getMyAttendance } from "@/actions/attendance.actions";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Award } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Certificates" };

export default async function CertificatesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [registrations, attendance] = await Promise.all([
    getMyRegistrations(),
    getMyAttendance(session.user.id),
  ]);

  // Eligible: confirmed registration + has attendance
  const attendedEventIds = new Set(
    attendance.map((a) => a.registration.eventId)
  );

  const eligible = registrations.filter(
    (r) => r.status === "CONFIRMED" && attendedEventIds.has(r.eventId)
  );

  return (
    <div>
      <PageHeader title="Certificates" description="Download certificates for events you attended" />
      {eligible.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No certificates yet"
          description="Attend at least one session of an event to be eligible for a certificate"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {eligible.map((reg) => (
            <Card key={reg.id}>
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{reg.event.title}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(reg.event.date)}</p>
                  <Badge variant="success" className="mt-2">Eligible</Badge>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-2">
                    Certificate download coming soon
                  </p>
                  {/* TODO: Implement PDF certificate generation */}
                  <button
                    disabled
                    className="text-xs border rounded px-3 py-1 opacity-50 cursor-not-allowed"
                  >
                    Download PDF
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
