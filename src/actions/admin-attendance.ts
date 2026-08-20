"use server";

import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/auth-session";

/**
 * Fetches all events for the admin, sorted by date descending.
 */
export async function getAdminEventsAction() {
  await verifyAdmin();

  // Sort at the query level instead of pulling everything into memory
  // and sorting in JS.
  const eventsSnapshot = await adminDb
    .collection("events")
    .orderBy("date", "desc")
    .get();

  const events = eventsSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      date: data.date,
      status: data.status,
    };
  });

  return events;
}

/**
 * Fetches all sessions for a specific event.
 */
export async function getAdminSessionsAction(eventId: string) {
  await verifyAdmin();

  const sessionsSnapshot = await adminDb
    .collection("sessions")
    .where("eventId", "==", eventId)
    .get();

  const sessions = sessionsSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      startTime: data.startTime,
      endTime: data.endTime,
    };
  });

  sessions.sort((a, b) => {
    const timeA = new Date(a.startTime).getTime();
    const timeB = new Date(b.startTime).getTime();
    return timeA - timeB;
  });

  return sessions;
}

export async function getSessionAttendanceAction(sessionId: string) {
  await verifyAdmin();

  const attSnapshot = await adminDb
    .collection("attendances")
    .where("sessionId", "==", sessionId)
    .get();

  if (attSnapshot.empty) return [];

  const rawAttendances = attSnapshot.docs.map((doc) => ({
    id: doc.id,
    data: doc.data(),
  }));

  // Identify any legacy records missing denormalized names
  const missingUserIds = Array.from(
    new Set(
      rawAttendances
        .filter((a) => !a.data.studentName)
        .map((a) => a.data.studentId)
        .filter(Boolean)
    )
  );

  let userMap = new Map<string, any>();
  if (missingUserIds.length > 0) {
    const userRefs = missingUserIds.map((id) => adminDb.collection("users").doc(id));
    const userDocs = await adminDb.getAll(...userRefs);
    userDocs.forEach((doc) => {
      if (doc.exists) userMap.set(doc.id, doc.data());
    });
  }

  const result = rawAttendances.map(({ id, data }) => {
    const legacyUser = userMap.get(data.studentId);
    return {
      id,
      studentId: data.studentId,
      name: data.studentName || legacyUser?.name || "Unknown Student",
      rollNumber: data.rollNumber || legacyUser?.rollNumber || "N/A",
      department: data.department || legacyUser?.department || "N/A",
      yearOfStudy: data.yearOfStudy || legacyUser?.yearOfStudy || "N/A",
      programType: data.programType || legacyUser?.programType || "N/A",
      checkInTime: data.checkInTime,
      checkInMethod: data.checkInMethod || "MANUAL",
    };
  });

  // Sort by check-in time descending (most recent first)
  result.sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());

  return result;
}