import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";
import { adminDb } from "@/lib/firebase-admin";

function escapeCSV(val: any) {
  if (val === null || val === undefined) return "";
  let str = String(val);
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Fetch documents by ID via getAll, chunked defensively, returned as a Map. */
async function fetchDocsAsMap(
  collection: string,
  ids: string[]
): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  const uniqueIds = Array.from(new Set(ids)).filter(Boolean);
  if (uniqueIds.length === 0) return map;

  const refs = uniqueIds.map((id) => adminDb.collection(collection).doc(id));
  const docs = await adminDb.getAll(...refs);
  docs.forEach((doc) => {
    if (doc.exists) {
      map.set(doc.id, doc.data());
    }
  });
  return map;
}

/** Query a collection by a field being 'in' a list of values, chunked at Firestore's 30-item limit. */
async function fetchByFieldIn(
  collection: string,
  field: string,
  values: string[]
): Promise<any[]> {
  const uniqueValues = Array.from(new Set(values)).filter(Boolean);
  if (uniqueValues.length === 0) return [];

  const CHUNK_SIZE = 30;
  const chunks: string[][] = [];
  for (let i = 0; i < uniqueValues.length; i += CHUNK_SIZE) {
    chunks.push(uniqueValues.slice(i, i + CHUNK_SIZE));
  }

  const snapshots = await Promise.all(
    chunks.map((chunk) => adminDb.collection(collection).where(field, "in", chunk).get())
  );

  return snapshots.flatMap((snap) => snap.docs.map((d) => d.data()));
}

export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const role = currentUser.role;
  if (role !== "ADMIN" && role !== "VOLUNTEER") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (!type) {
    return new NextResponse("Bad Request: Missing type parameter", { status: 400 });
  }

  let csvContent = "";
  let filename = "report.csv";

  try {
    if (type === "event") {
      const eventId = searchParams.get("eventId");
      if (!eventId) {
        return new NextResponse("Bad Request: Missing eventId", { status: 400 });
      }

      const eventDoc = await adminDb.collection("events").doc(eventId).get();
      if (!eventDoc.exists) {
        return new NextResponse("Event not found", { status: 404 });
      }
      const event = eventDoc.data() as any;

      const sessionsSnapshot = await adminDb
        .collection("sessions")
        .where("eventId", "==", eventId)
        .get();
      const sessions = sessionsSnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[];

      const regsSnapshot = await adminDb
        .collection("registrations")
        .where("eventId", "==", eventId)
        .get();
      const registrations = regsSnapshot.docs.map((d: any) => d.data()) as any[];

      // Only fetch the specific students referenced by these registrations.
      const userMap = await fetchDocsAsMap(
        "users",
        registrations.map((r) => r.studentId)
      );

      // Only fetch attendances for this event's sessions, instead of the
      // entire attendances collection.
      const sessionIds = sessions.map((s) => s.id);
      const attendances = await fetchByFieldIn("attendances", "sessionId", sessionIds);

      const sessionTitleMap = new Map<string, string>();
      sessions.forEach((s) => sessionTitleMap.set(s.id, s.title));

      const attendanceMap: Record<string, string[]> = {};
      attendances.forEach((att: any) => {
        if (!attendanceMap[att.studentId]) {
          attendanceMap[att.studentId] = [];
        }
        const title = sessionTitleMap.get(att.sessionId) || "Session";
        attendanceMap[att.studentId].push(title);
      });

      filename = `event_${(event.title || "event").replace(/\s+/g, "_")}_attendance.csv`;

      const headersList = [
        "Student Name",
        "Roll Number",
        "Email",
        "Registration Status",
        "Registration Date",
        "Attended Sessions",
        "Total Sessions Attended",
      ];
      csvContent += headersList.map(escapeCSV).join(",") + "\n";

      registrations.forEach((reg: any) => {
        const student = userMap.get(reg.studentId) || { name: "Unknown", email: "" };
        const studentSessions = attendanceMap[reg.studentId] || [];
        const row = [
          student.name || "Unknown",
          student.rollNumber || "N/A",
          student.email || "",
          reg.status || "REGISTERED",
          reg.createdAt || "",
          studentSessions.join("; "),
          studentSessions.length,
        ];
        csvContent += row.map(escapeCSV).join(",") + "\n";
      });
    } else if (type === "events-summary") {
      if (role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
      }

      const eventsSnapshot = await adminDb.collection("events").get();
      const events = eventsSnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[];

      const sessionsSnapshot = await adminDb.collection("sessions").get();
      const allSessions = sessionsSnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[];

      const regsSnapshot = await adminDb.collection("registrations").get();
      const allRegs = regsSnapshot.docs.map((d: any) => d.data()) as any[];

      const attsSnapshot = await adminDb.collection("attendances").get();
      const allAtts = attsSnapshot.docs.map((d: any) => d.data()) as any[];

      // Pre-group everything by eventId once (O(N)) instead of re-filtering
      // the full arrays for every event inside the loop below (O(events*N)).
      const regsByEvent = new Map<string, any[]>();
      allRegs.forEach((r: any) => {
        const list = regsByEvent.get(r.eventId) ?? [];
        list.push(r);
        regsByEvent.set(r.eventId, list);
      });

      const sessionIdsByEvent = new Map<string, Set<string>>();
      allSessions.forEach((s: any) => {
        const set = sessionIdsByEvent.get(s.eventId) ?? new Set<string>();
        set.add(s.id);
        sessionIdsByEvent.set(s.eventId, set);
      });

      // Map sessionId -> eventId once, so attendance records can be grouped
      // by event in a single pass instead of a nested membership check.
      const eventIdBySessionId = new Map<string, string>();
      allSessions.forEach((s: any) => eventIdBySessionId.set(s.id, s.eventId));

      const checkedInStudentIdsByEvent = new Map<string, Set<string>>();
      allAtts.forEach((att: any) => {
        const eventId = eventIdBySessionId.get(att.sessionId);
        if (!eventId) return;
        const set = checkedInStudentIdsByEvent.get(eventId) ?? new Set<string>();
        set.add(att.studentId);
        checkedInStudentIdsByEvent.set(eventId, set);
      });

      filename = "events_summary_report.csv";

      const headersList = [
        "Event ID",
        "Title",
        "Category",
        "Date",
        "Coordinator",
        "Status",
        "Max Capacity",
        "Registered (RSVP)",
        "Waitlisted",
        "Cancelled",
        "Unique Check-ins",
        "Attendance Rate %",
      ];
      csvContent += headersList.map(escapeCSV).join(",") + "\n";

      events.forEach((evt: any) => {
        const eventRegs = regsByEvent.get(evt.id) ?? [];
        const rsvps = eventRegs.filter((r: any) => r.status === "REGISTERED").length;
        const waitlisted = eventRegs.filter((r: any) => r.status === "WAITLISTED").length;
        const cancelled = eventRegs.filter((r: any) => r.status === "CANCELLED").length;

        const uniqueCheckIns = checkedInStudentIdsByEvent.get(evt.id)?.size ?? 0;
        const rate = rsvps > 0 ? ((uniqueCheckIns / rsvps) * 100).toFixed(1) : "0.0";

        const row = [
          evt.id,
          evt.title,
          evt.category,
          evt.date,
          evt.coordinatorName,
          evt.status,
          evt.maxParticipants,
          rsvps,
          waitlisted,
          cancelled,
          uniqueCheckIns,
          rate,
        ];
        csvContent += row.map(escapeCSV).join(",") + "\n";
      });
    } else if (type === "volunteers-summary") {
      if (role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
      }

      const usersSnapshot = await adminDb
        .collection("users")
        .where("role", "==", "VOLUNTEER")
        .get();

      const volunteers = usersSnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[];
      const attsSnapshot = await adminDb.collection("attendances").get();
      const allAtts = attsSnapshot.docs.map((d: any) => d.data()) as any[];

      // Pre-count validations per volunteer once, instead of filtering the
      // full attendance array inside the volunteers.forEach loop below.
      const validatedCountByMarker = new Map<string, number>();
      allAtts.forEach((a: any) => {
        if (!a.markedById) return;
        validatedCountByMarker.set(a.markedById, (validatedCountByMarker.get(a.markedById) ?? 0) + 1);
      });

      filename = "volunteers_performance_report.csv";

      const headersList = [
        "Volunteer Name",
        "Email",
        "Account Created At",
        "Total Check-ins Validated",
      ];
      csvContent += headersList.map(escapeCSV).join(",") + "\n";

      volunteers.forEach((v: any) => {
        const validatedCount = validatedCountByMarker.get(v.id) ?? 0;
        const row = [
          v.name || "Volunteer",
          v.email || "",
          v.createdAt || "",
          validatedCount,
        ];
        csvContent += row.map(escapeCSV).join(",") + "\n";
      });
    } else if (type === "students-registration-log") {
      if (role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
      }

      const regsSnapshot = await adminDb.collection("registrations").get();
      const registrations = regsSnapshot.docs.map((d: any) => d.data()) as any[];

      // Only fetch the specific users and events referenced by these
      // registrations, instead of scanning both entire collections.
      const [userMap, eventMap] = await Promise.all([
        fetchDocsAsMap("users", registrations.map((r) => r.studentId)),
        fetchDocsAsMap("events", registrations.map((r) => r.eventId)),
      ]);

      filename = "students_registration_log.csv";

      const headersList = [
        "Student Name",
        "Roll Number",
        "Email",
        "Event Title",
        "Event Category",
        "Event Date",
        "Registration Status",
        "Registration Date",
      ];
      csvContent += headersList.map(escapeCSV).join(",") + "\n";

      registrations.forEach((reg: any) => {
        const student = userMap.get(reg.studentId) || { name: "Unknown", email: "" };
        const event = eventMap.get(reg.eventId) || { title: "Unknown", category: "", date: "" };

        const row = [
          student.name || "Unknown",
          student.rollNumber || "N/A",
          student.email || "",
          event.title || "",
          event.category || "",
          event.date || "",
          reg.status || "REGISTERED",
          reg.createdAt || "",
        ];
        csvContent += row.map(escapeCSV).join(",") + "\n";
      });
    } else {
      return new NextResponse("Bad Request: Invalid report type", { status: 400 });
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Export Error:", error);
    return new NextResponse("Internal Server Error during export", { status: 500 });
  }
}