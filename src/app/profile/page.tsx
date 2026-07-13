import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DashboardLayout from "@/components/dashboard-layout";
import ProfileForm from "./profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Fetch the full/latest user details to get display name and phoneNumber
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!dbUser) {
    redirect("/login");
  }

  // Fetch role-specific statistics
  let stats: { label: string; value: number }[] = [];
  if (dbUser.role === "STUDENT") {
    const totalEvents = await prisma.registration.count({
      where: {
        studentId: dbUser.id,
        status: "REGISTERED",
      },
    });
    const sessionsAttended = await prisma.attendance.count({
      where: {
        studentId: dbUser.id,
      },
    });
    stats = [
      { label: "Events Registered", value: totalEvents },
      { label: "Sessions Attended", value: sessionsAttended },
    ];
  } else if (dbUser.role === "VOLUNTEER") {
    const eventsOrganized = await prisma.event.count({
      where: {
        createdById: dbUser.id,
      },
    });
    const attendeesScanned = await prisma.attendance.count({
      where: {
        markedById: dbUser.id,
        checkInMethod: "SCANNED",
      },
    });
    stats = [
      { label: "Events Organized", value: eventsOrganized },
      { label: "Attendees Scanned", value: attendeesScanned },
    ];
  }

  return (
    <DashboardLayout
      user={{
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role as "ADMIN" | "VOLUNTEER" | "STUDENT",
      }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="font-heading text-xl font-bold uppercase tracking-tighter text-foreground">
            Account Profile & Settings
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#747686] mt-1">
            Manage your personal identity, contact details and security
          </p>
        </div>

        <ProfileForm
          user={{
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            rollNumber: dbUser.rollNumber || null,
            phoneNumber: dbUser.phoneNumber || "",
          }}
          stats={stats}
        />
      </div>
    </DashboardLayout>
  );
}
