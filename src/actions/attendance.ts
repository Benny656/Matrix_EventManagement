"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth-session";

async function verifyStaff() {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "VOLUNTEER" && currentUser.role !== "ADMIN")) {
    throw new Error("Unauthorized. Staff permissions required.");
  }
  return currentUser;
}

export async function markAttendanceAction(params: {
  sessionId: string;
  rollNumber: string;
  method: "SCANNED" | "MANUAL";
}) {
  const staff = await verifyStaff();
  if (staff.role === "ADMIN" || staff.role === "FACULTY_ADMIN") {
    return {
      success: false,
      error: "UNAUTHORIZED" as const,
      message: "Attendance marking is restricted to Volunteers only.",
    };
  }
  const { sessionId, rollNumber, method } = params;

  // 1. Fetch student by roll number
  const usersSnapshot = await adminDb
    .collection("users")
    .where("role", "==", "STUDENT")
    .get();

  const studentDoc = usersSnapshot.docs.find(
    (doc) => (doc.data().rollNumber || "").toLowerCase() === rollNumber.toLowerCase()
  );

  if (!studentDoc) {
    return {
      success: false,
      error: "STUDENT_NOT_FOUND" as const,
      message: `No student found with roll number "${rollNumber}" on Matrix system.`,
    };
  }

  const student = { id: studentDoc.id, ...studentDoc.data() } as any;

  // 2. Fetch session
  const sessionDoc = await adminDb.collection("sessions").doc(sessionId).get();
  if (!sessionDoc.exists) {
    return {
      success: false,
      error: "SESSION_NOT_FOUND" as const,
      message: "Session block not found.",
    };
  }

  const session = { id: sessionDoc.id, ...sessionDoc.data() } as any;

  // 3. Fetch existing attendance
  const attendanceSnapshot = await adminDb
    .collection("attendances")
    .where("sessionId", "==", sessionId)
    .where("studentId", "==", student.id)
    .get();

  if (!attendanceSnapshot.empty) {
    return {
      success: false,
      error: "ALREADY_MARKED" as const,
      message: `${student.name} is already checked in for this session.`,
      studentName: student.name,
    };
  }

  // 4. Fetch registration
  const regSnapshot = await adminDb
    .collection("registrations")
    .where("studentId", "==", student.id)
    .where("eventId", "==", session.eventId)
    .get();

  if (regSnapshot.empty) {
    return {
      success: false,
      error: "NOT_REGISTERED" as const,
      message: `${student.name} is not registered for this event.`,
      studentName: student.name,
      studentId: student.id,
    };
  }

  const regData = regSnapshot.docs[0].data();
  if (regData.status === "CANCELLED") {
    return {
      success: false,
      error: "NOT_REGISTERED" as const,
      message: `${student.name} is not registered for this event.`,
      studentName: student.name,
      studentId: student.id,
    };
  }

  if (regData.status === "WAITLISTED") {
    return {
      success: false,
      error: "WAITLISTED" as const,
      message: `${student.name} is currently on the WAITLIST. Confirm override to check-in.`,
      studentName: student.name,
      studentId: student.id,
    };
  }

  // 5. Successful check-in
  const attRef = adminDb.collection("attendances").doc();
  await attRef.set({
    id: attRef.id,
    sessionId,
    studentId: student.id,
    checkInTime: new Date().toISOString(),
    checkInMethod: method,
    markedById: staff.id,
    createdAt: new Date().toISOString(),
  });

  revalidatePath(`/volunteer/events/${session.eventId}`);
  revalidatePath(`/admin/events/${session.eventId}`);

  return {
    success: true,
    studentName: student.name,
    message: `${student.name} successfully checked in.`,
  };
}

export async function overrideWaitlistAction(params: {
  sessionId: string;
  studentId: string;
}) {
  const staff = await verifyStaff();
  const { sessionId, studentId } = params;

  const sessionDoc = await adminDb.collection("sessions").doc(sessionId).get();
  if (!sessionDoc.exists) throw new Error("Session not found");
  const session = sessionDoc.data() as any;

  const regSnapshot = await adminDb
    .collection("registrations")
    .where("studentId", "==", studentId)
    .where("eventId", "==", session.eventId)
    .get();

  if (!regSnapshot.empty) {
    await regSnapshot.docs[0].ref.update({ status: "REGISTERED" });
  }

  const attRef = adminDb.collection("attendances").doc();
  await attRef.set({
    id: attRef.id,
    sessionId,
    studentId,
    checkInTime: new Date().toISOString(),
    checkInMethod: "MANUAL",
    markedById: staff.id,
    createdAt: new Date().toISOString(),
  });

  return { success: true };
}

export async function getActiveSessionsAction() {
  await verifyStaff();

  const eventsSnapshot = await adminDb
    .collection("events")
    .where("status", "!=", "ARCHIVED")
    .get();

  const eventMap = new Map<string, any>();
  eventsSnapshot.docs.forEach((d) => eventMap.set(d.id, d.data()));

  const sessionsSnapshot = await adminDb.collection("sessions").get();
  const sessions = sessionsSnapshot.docs
    .map((doc) => {
      const data = doc.data() as any;
      const event = eventMap.get(data.eventId);
      if (!event) return null;
      return {
        id: doc.id,
        ...data,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        event: {
          title: event.title,
        },
      };
    })
    .filter(Boolean);

  sessions.sort((a: any, b: any) => a.startTime.getTime() - b.startTime.getTime());
  return sessions;
}

export async function markAttendanceByScan(sessionId: string, rollNumber: string) {
  const res = await markAttendanceAction({ sessionId, rollNumber, method: "SCANNED" });
  if (!res.success) {
    if (res.error === "ALREADY_MARKED") {
      return { status: "already_checked_in" as const, student: { name: res.studentName } };
    }
    if (res.error === "NOT_REGISTERED") {
      return { status: "not_registered" as const };
    }
    return { status: "error" as const, message: res.message };
  }
  return { status: "success" as const, student: { name: res.studentName } };
}

export async function markAttendanceManual(sessionId: string, studentId: string) {
  const staff = await verifyStaff();
  if (staff.role === "ADMIN" || staff.role === "FACULTY_ADMIN") {
    return { status: "error" as const, message: "Attendance marking is restricted to Volunteers only." };
  }

  const studentDoc = await adminDb.collection("users").doc(studentId).get();
  if (!studentDoc.exists) {
    return { status: "error" as const, message: "Student not found in database." };
  }
  const student = { id: studentDoc.id, ...studentDoc.data() } as any;

  const sessionDoc = await adminDb.collection("sessions").doc(sessionId).get();
  if (!sessionDoc.exists) {
    return { status: "error" as const, message: "Session block not found." };
  }
  const session = { id: sessionDoc.id, ...sessionDoc.data() } as any;

  const attSnapshot = await adminDb
    .collection("attendances")
    .where("sessionId", "==", sessionId)
    .where("studentId", "==", student.id)
    .get();

  if (!attSnapshot.empty) {
    return { status: "already_checked_in" as const, student };
  }

  const regSnapshot = await adminDb
    .collection("registrations")
    .where("studentId", "==", student.id)
    .where("eventId", "==", session.eventId)
    .get();

  if (regSnapshot.empty) {
    return { status: "not_registered" as const };
  }

  const regData = regSnapshot.docs[0].data();
  if (regData.status === "CANCELLED") {
    return { status: "not_registered" as const };
  }

  if (regData.status === "WAITLISTED") {
    return { status: "error" as const, message: `${student.name} is currently on the WAITLIST. Confirm override to check-in.` };
  }

  const attRef = adminDb.collection("attendances").doc();
  await attRef.set({
    id: attRef.id,
    sessionId,
    studentId: student.id,
    checkInTime: new Date().toISOString(),
    checkInMethod: "MANUAL",
    markedById: staff.id,
    createdAt: new Date().toISOString(),
  });

  revalidatePath(`/volunteer/events/${session.eventId}`);
  revalidatePath(`/admin/events/${session.eventId}`);

  return { status: "success" as const, student };
}

export async function getRegisteredStudentsAction(sessionId: string) {
  await verifyStaff();

  const sessionDoc = await adminDb.collection("sessions").doc(sessionId).get();
  if (!sessionDoc.exists) throw new Error("Session not found");
  const session = sessionDoc.data() as any;

  const regSnapshot = await adminDb
    .collection("registrations")
    .where("eventId", "==", session.eventId)
    .where("status", "==", "REGISTERED")
    .get();

  const studentIds = regSnapshot.docs.map((d) => d.data().studentId);
  if (studentIds.length === 0) return [];

  const students = await Promise.all(
    studentIds.map(async (id) => {
      const uDoc = await adminDb.collection("users").doc(id).get();
      if (!uDoc.exists) return null;
      const data = uDoc.data() as any;
      return { id: uDoc.id, name: data.name, rollNumber: data.rollNumber };
    })
  );

  const result = students.filter(Boolean) as any[];
  result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  return result;
}

export async function getSessionCheckInCountAction(sessionId: string) {
  await verifyStaff();
  const snapshot = await adminDb
    .collection("attendances")
    .where("sessionId", "==", sessionId)
    .get();
  return snapshot.size;
}
