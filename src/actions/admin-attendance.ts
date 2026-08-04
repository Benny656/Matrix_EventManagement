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

/**
 * Fetches all attendance records for a specific session, joining with user data.
 */
export async function getSessionAttendanceAction(sessionId: string) {
  await verifyAdmin();

  // 1. Fetch attendance records
  const attSnapshot = await adminDb
    .collection("attendances")
    .where("sessionId", "==", sessionId)
    .get();

  if (attSnapshot.empty) return [];

  const attendances = attSnapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      studentId: data.studentId,
      checkInTime: data.checkInTime,
      checkInMethod: data.checkInMethod, // "SCANNED" | "MANUAL"
      markedById: data.markedById,
    };
  });

  // 2. Fetch all student profiles who checked in (deduped, batched via getAll
  // for a single RPC instead of N parallel single-doc gets).
  const studentIds = Array.from(new Set(attendances.map((a) => a.studentId)));

  const userMap = new Map<string, any>();
  if (studentIds.length > 0) {
    const userRefs = studentIds.map((id) => adminDb.collection("users").doc(id));
    const userDocs = await adminDb.getAll(...userRefs);
    userDocs.forEach((doc) => {
      if (doc.exists) {
        userMap.set(doc.id, doc.data());
      }
    });
  }

  // 3. Map records
  const result = attendances.map((att) => {
    const user = userMap.get(att.studentId);
    return {
      id: att.id,
      studentId: att.studentId,
      name: user?.name || "Unknown Student",
      rollNumber: user?.rollNumber || "N/A",
      department: user?.department || "N/A",
      yearOfStudy: user?.yearOfStudy || "N/A",
      programType: user?.programType || "N/A",
      checkInTime: att.checkInTime,
      checkInMethod: att.checkInMethod,
    };
  });

  // Sort by check-in time descending (most recent first)
  result.sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());

  return result;
}