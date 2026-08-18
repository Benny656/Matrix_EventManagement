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

  // 1. Fetch student by roll number directly — query by the field instead
  // of scanning every student and filtering client-side.
  const rollNumberUpper = rollNumber.trim().toUpperCase();
  const usersSnapshot = await adminDb
    .collection("users")
    .where("rollNumber", "==", rollNumberUpper)
    .where("role", "==", "STUDENT")
    .limit(1)
    .get();

  const studentDoc = usersSnapshot.docs[0];

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

  // 3. Fetch existing attendance (capped at 1 doc)
  const attendanceSnapshot = await adminDb
    .collection("attendances")
    .where("sessionId", "==", sessionId)
    .where("studentId", "==", student.id)
    .limit(1)
    .get();

  if (!attendanceSnapshot.empty) {
    return {
      success: false,
      error: "ALREADY_MARKED" as const,
      message: `${student.name} is already checked in for this session.`,
      studentName: student.name,
    };
  }

  // 4. Fetch registration (capped at 1 doc)
  const regSnapshot = await adminDb
    .collection("registrations")
    .where("studentId", "==", student.id)
    .where("eventId", "==", session.eventId)
    .limit(1)
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
    studentName: student.name,
    rollNumber: student.rollNumber || "N/A",
    department: student.department || "N/A",
    yearOfStudy: student.yearOfStudy || "N/A",
    programType: student.programType || "N/A",
    checkInTime: new Date().toISOString(),
    checkInMethod: method,
    markedById: staff.id,
    createdAt: new Date().toISOString(),
  });

  revalidatePath(`/volunteer/events/${session.eventId}`);
  revalidatePath(`/admin/events/${session.eventId}`);

  return {
    success: true,
    studentId: student.id,
    studentName: student.name,
    rollNumber: student.rollNumber || null,
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

  const studentDoc = await adminDb.collection("users").doc(studentId).get();
  const student = studentDoc.exists ? (studentDoc.data() as any) : { name: "Unknown", rollNumber: "N/A" };

  const attRef = adminDb.collection("attendances").doc();
  await attRef.set({
    id: attRef.id,
    sessionId,
    studentId,
    studentName: student.name || "Unknown",
    rollNumber: student.rollNumber || "N/A",
    department: student.department || "N/A",
    yearOfStudy: student.yearOfStudy || "N/A",
    programType: student.programType || "N/A",
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

  if (eventsSnapshot.empty) return [];

  const eventMap = new Map<string, any>();
  eventsSnapshot.docs.forEach((d) => eventMap.set(d.id, d.data()));
  const eventIds = Array.from(eventMap.keys());

  // Only fetch sessions belonging to non-archived events, instead of every
  // session ever created. Firestore 'in' queries cap at 30 values, so chunk.
  const CHUNK_SIZE = 30;
  const chunks: string[][] = [];
  for (let i = 0; i < eventIds.length; i += CHUNK_SIZE) {
    chunks.push(eventIds.slice(i, i + CHUNK_SIZE));
  }

  const sessionSnapshots = await Promise.all(
    chunks.map((chunk) =>
      adminDb.collection("sessions").where("eventId", "in", chunk).get()
    )
  );

  const sessions = sessionSnapshots
    .flatMap((snap) => snap.docs)
    .map((doc) => {
      const data = doc.data() as any;
      const event = eventMap.get(data.eventId);
      if (!event) return null;
      return {
        id: doc.id,
        ...data,
        startTime: typeof data.startTime === "string" ? data.startTime : (data.startTime ? new Date(data.startTime).toISOString() : new Date().toISOString()),
        endTime: data.endTime ? (typeof data.endTime === "string" ? data.endTime : new Date(data.endTime).toISOString()) : null,
        event: {
          title: event.title,
        },
      };
    })
    .filter(Boolean);

  sessions.sort((a: any, b: any) => {
    const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
    const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
    return timeA - timeB;
  });
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
  return {
    status: "success" as const,
    student: {
      id: res.studentId,
      name: res.studentName,
      rollNumber: res.rollNumber,
    },
  };
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
    .limit(1)
    .get();

  if (!attSnapshot.empty) {
    return { status: "already_checked_in" as const, student };
  }

  const regSnapshot = await adminDb
    .collection("registrations")
    .where("studentId", "==", student.id)
    .where("eventId", "==", session.eventId)
    .limit(1)
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
    studentName: student.name,
    rollNumber: student.rollNumber || "N/A",
    department: student.department || "N/A",
    yearOfStudy: student.yearOfStudy || "N/A",
    programType: student.programType || "N/A",
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

  const rawRegs = regSnapshot.docs.map((d) => ({ id: d.id, data: d.data() }));

  // Fallback for legacy documents missing denormalized names
  const missingUserIds = Array.from(
    new Set(
      rawRegs
        .filter((r) => !r.data.studentName)
        .map((r) => r.data.studentId)
        .filter(Boolean)
    )
  );

  let userMap = new Map<string, any>();
  if (missingUserIds.length > 0) {
    const studentRefs = missingUserIds.map((id) => adminDb.collection("users").doc(id));
    const userDocs = await adminDb.getAll(...studentRefs);
    userDocs.forEach((doc) => {
      if (doc.exists) userMap.set(doc.id, doc.data());
    });
  }

  const result = rawRegs.map(({ data }) => {
    const fallbackUser = userMap.get(data.studentId);
    return {
      id: data.studentId,
      name: data.studentName || fallbackUser?.name || "Unknown Student",
      rollNumber: data.rollNumber || fallbackUser?.rollNumber || null,
    };
  });

  result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  return result;
}

export async function getSessionCheckInCountAction(sessionId: string) {
  await verifyStaff();
  const snapshot = await adminDb
    .collection("attendances")
    .where("sessionId", "==", sessionId)
    .count()
    .get();
  return snapshot.data().count;
}