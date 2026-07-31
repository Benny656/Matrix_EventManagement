"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUser, verifyAdmin, verifyStaff } from "@/lib/auth-session";

export interface VolunteerMember {
  registrationId: string;
  studentId: string;
  eventId: string;
  eventRole: "participant" | "volunteer";
  status: "REGISTERED" | "WAITLISTED" | "CANCELLED";
  name: string;
  email: string;
  rollNumber: string | null;
  department: string | null;
  attendanceStatus: "PRESENT" | "ABSENT" | "NOT_MARKED";
  markedBy?: string | null;
  markedByName?: string | null;
  markedAt?: string | null;
}

/**
 * Assigns or revokes volunteer status for a registered user on a specific event.
 */
export async function toggleVolunteerStatusAction(params: {
  eventId: string;
  studentId: string;
  isVolunteer: boolean;
}) {
  const admin = await verifyAdmin();
  const { eventId, studentId, isVolunteer } = params;

  const regSnapshot = await adminDb
    .collection("registrations")
    .where("eventId", "==", eventId)
    .where("studentId", "==", studentId)
    .get();

  if (regSnapshot.empty) {
    throw new Error("User registration not found for this event.");
  }

  const regDoc = regSnapshot.docs[0];
  const newRole = isVolunteer ? "volunteer" : "participant";

  await regDoc.ref.update({
    eventRole: newRole,
    updatedAt: new Date().toISOString(),
  });

  // Sync user's global system role in 'users' collection
  const userRef = adminDb.collection("users").doc(studentId);
  const userSnap = await userRef.get();
  if (userSnap.exists) {
    const userData = userSnap.data();
    if (isVolunteer && userData?.role === "STUDENT") {
      await userRef.update({ role: "VOLUNTEER", updatedAt: new Date().toISOString() });
    } else if (!isVolunteer && userData?.role === "VOLUNTEER") {
      // Check if user is a volunteer in any other active event
      const otherVolRegs = await adminDb
        .collection("registrations")
        .where("studentId", "==", studentId)
        .where("eventRole", "==", "volunteer")
        .get();
      const activeVolRegs = otherVolRegs.docs.filter(
        (d) => d.id !== regDoc.id && d.data().status !== "CANCELLED"
      );
      if (activeVolRegs.length === 0) {
        await userRef.update({ role: "STUDENT", updatedAt: new Date().toISOString() });
      }
    }
  }

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/volunteer/events/${eventId}`);
  revalidatePath("/admin/events");
  revalidatePath("/admin/users");
  revalidatePath("/student");
  revalidatePath("/volunteer");

  return { success: true, eventRole: newRole };
}

/**
 * Fetches all volunteers assigned to a specific event along with their user details and volunteer attendance.
 */
export async function getEventVolunteersAction(eventId: string): Promise<VolunteerMember[]> {
  await verifyStaff();

  // Fetch all registrations for this event
  const regSnapshot = await adminDb
    .collection("registrations")
    .where("eventId", "==", eventId)
    .get();

  const volunteerRegs = regSnapshot.docs
    .map((d) => ({ id: d.id, ...d.data() } as any))
    .filter((r) => r.eventRole === "volunteer" && r.status !== "CANCELLED");

  if (volunteerRegs.length === 0) {
    return [];
  }

  // Fetch users details
  const userIds = Array.from(new Set(volunteerRegs.map((r) => r.studentId)));
  const usersSnapshot = await adminDb.collection("users").get();
  const userMap = new Map<string, any>();
  usersSnapshot.docs.forEach((d) => {
    if (userIds.includes(d.id)) {
      userMap.set(d.id, { id: d.id, ...d.data() });
    }
  });

  // Fetch volunteer attendances for this event
  const volAttSnapshot = await adminDb
    .collection("volunteer_attendances")
    .where("eventId", "==", eventId)
    .get();

  const volAttMap = new Map<string, any>();
  volAttSnapshot.docs.forEach((d) => {
    const data = d.data();
    volAttMap.set(data.volunteerId, data);
  });

  const volunteers: VolunteerMember[] = volunteerRegs.map((r) => {
    const u = userMap.get(r.studentId) || { name: "Unknown", email: "", rollNumber: null, department: null };
    const att = volAttMap.get(r.studentId);

    return {
      registrationId: r.id,
      studentId: r.studentId,
      eventId: r.eventId,
      eventRole: "volunteer",
      status: r.status,
      name: u.name || "Unknown",
      email: u.email || "",
      rollNumber: u.rollNumber || null,
      department: u.department || null,
      attendanceStatus: att ? att.attendanceStatus : "NOT_MARKED",
      markedBy: att?.markedBy || null,
      markedByName: att?.markedByName || null,
      markedAt: att?.markedAt || null,
    };
  });

  volunteers.sort((a, b) => a.name.localeCompare(b.name));
  return volunteers;
}

/**
 * Allows admins or staff to mark a volunteer as Present or Absent for an event.
 */
export async function markVolunteerAttendanceAction(params: {
  eventId: string;
  volunteerId: string;
  status: "PRESENT" | "ABSENT";
}) {
  const currentUser = await verifyStaff();
  const { eventId, volunteerId, status } = params;

  // Check existing volunteer attendance record
  const volAttSnapshot = await adminDb
    .collection("volunteer_attendances")
    .where("eventId", "==", eventId)
    .where("volunteerId", "==", volunteerId)
    .get();

  const now = new Date().toISOString();

  if (!volAttSnapshot.empty) {
    const docRef = volAttSnapshot.docs[0].ref;
    await docRef.update({
      attendanceStatus: status,
      markedBy: currentUser.id,
      markedByName: currentUser.name || "Staff",
      markedAt: now,
      updatedAt: now,
    });
  } else {
    const newRef = adminDb.collection("volunteer_attendances").doc();
    await newRef.set({
      id: newRef.id,
      eventId,
      volunteerId,
      attendanceStatus: status,
      markedBy: currentUser.id,
      markedByName: currentUser.name || "Staff",
      markedAt: now,
      eventRole: "volunteer",
      createdAt: now,
      updatedAt: now,
    });
  }

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/volunteer/events/${eventId}`);

  return { success: true, status };
}

/**
 * Returns all registrations for an event so admins can easily select & toggle volunteer status.
 */
export async function getEventRegistrationsForVolunteerAssignmentAction(eventId: string) {
  await verifyAdmin();

  const regSnapshot = await adminDb
    .collection("registrations")
    .where("eventId", "==", eventId)
    .get();

  const regs = regSnapshot.docs
    .map((d) => ({ id: d.id, ...d.data() } as any))
    .filter((r) => r.status !== "CANCELLED");

  if (regs.length === 0) return [];

  const usersSnapshot = await adminDb.collection("users").get();
  const userMap = new Map<string, any>();
  usersSnapshot.docs.forEach((d) => userMap.set(d.id, d.data()));

  const result = regs.map((r) => {
    const u = userMap.get(r.studentId) || { name: "Unknown", email: "", rollNumber: null, department: null };
    return {
      registrationId: r.id,
      studentId: r.studentId,
      eventId: r.eventId,
      eventRole: (r.eventRole as "participant" | "volunteer") || "participant",
      status: r.status,
      name: u.name || "Unknown",
      email: u.email || "",
      rollNumber: u.rollNumber || null,
      department: u.department || null,
    };
  });

  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}
