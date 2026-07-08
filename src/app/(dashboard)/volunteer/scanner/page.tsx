import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getVolunteerSessions } from "@/actions/session.actions";
import { QRScannerClient } from "@/components/attendance/qr-scanner-client";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { QrCode } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "QR Scanner" };

export default async function VolunteerScannerPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const assignments = await getVolunteerSessions(session.user.id);

  const sessions = assignments.map((a) => ({
    id: a.session.id,
    title: a.session.title,
    eventTitle: a.event.title,
  }));

  if (sessions.length === 0) {
    return (
      <div>
        <PageHeader title="QR Scanner" description="Scan student QR codes to mark attendance" />
        <EmptyState
          icon={QrCode}
          title="No sessions assigned"
          description="You have no sessions assigned to you yet. Contact an admin to get assigned."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="QR Scanner" description="Scan student QR codes or enter register number manually" />
      <QRScannerClient sessions={sessions} />
    </div>
  );
}
