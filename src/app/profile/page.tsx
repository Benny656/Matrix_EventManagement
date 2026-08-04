import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-session";
import { adminDb } from "@/lib/firebase-admin";
import DashboardLayout from "@/components/dashboard-layout";
import ProfileForm from "./profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  // Fetch role-specific statistics. All of these only need a count, so use
  // Firestore's count() aggregation instead of reading full documents.
  let stats: { label: string; value: number }[] = [];
  if (currentUser.role === "STUDENT") {
    const [regCountSnapshot, attCountSnapshot] = await Promise.all([
      adminDb
        .collection("registrations")
        .where("studentId", "==", currentUser.id)
        .where("status", "==", "REGISTERED")
        .count()
        .get(),
      adminDb
        .collection("attendances")
        .where("studentId", "==", currentUser.id)
        .count()
        .get(),
    ]);

    stats = [
      { label: "Events Registered", value: regCountSnapshot.data().count },
      { label: "Sessions Attended", value: attCountSnapshot.data().count },
    ];
  } else if (currentUser.role === "VOLUNTEER") {
    const [evtCountSnapshot, attCountSnapshot] = await Promise.all([
      adminDb
        .collection("events")
        .where("createdById", "==", currentUser.id)
        .count()
        .get(),
      adminDb
        .collection("attendances")
        .where("markedById", "==", currentUser.id)
        .where("checkInMethod", "==", "SCANNED")
        .count()
        .get(),
    ]);

    stats = [
      { label: "Events Organized", value: evtCountSnapshot.data().count },
      { label: "Attendees Scanned", value: attCountSnapshot.data().count },
    ];
  }

  return (
    <DashboardLayout
      user={{
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
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
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.role,
            rollNumber: currentUser.rollNumber || null,
            programType: currentUser.programType || null,
            degree: currentUser.degree || null,
            phoneNumber: currentUser.phoneNumber || "",
          }}
          stats={stats}
        />
      </div>
    </DashboardLayout>
  );
}