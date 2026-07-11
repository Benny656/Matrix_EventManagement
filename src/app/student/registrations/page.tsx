import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import StudentRegistrations from "@/components/events/student-registrations";

export const dynamic = "force-dynamic";

export default async function StudentRegistrationsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  const registrations = await prisma.registration.findMany({
    where: { studentId: session.user.id },
    include: {
      event: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground tracking-tighter mb-1">
          My Registrations
        </h1>
        <p className="font-sans text-sm text-muted-foreground">
          Review your upcoming events and waitlist statuses.
        </p>
      </div>

      <StudentRegistrations initialRegistrations={registrations as any} />
    </div>
  );
}
