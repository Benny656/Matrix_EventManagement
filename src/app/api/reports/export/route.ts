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

      // Read bounded event docs and use pre-aggregated summary counters directly off the event documents
      const eventsSnapshot = await adminDb
        .collection("events")
        .orderBy("date", "desc")
        .limit(100)
        .get();

      const events = eventsSnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[];

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
        "Unique Check-ins",
        "Attendance Rate %",
      ];
      csvContent += headersList.map(escapeCSV).join(",") + "\n";

      events.forEach((evt: any) => {
        const rsvps = typeof evt.registrationCount === "number" ? evt.registrationCount : (evt.rsvps ?? 0);
        const uniqueCheckIns = typeof evt.uniqueCheckIns === "number" ? evt.uniqueCheckIns : 0;
        const rate = typeof evt.attendanceRate === "number"
          ? evt.attendanceRate.toFixed(1)
          : rsvps > 0
          ? ((uniqueCheckIns / rsvps) * 100).toFixed(1)
          : "0.0";

        const row = [
          evt.id,
          evt.title || "Untitled",
          evt.category || "General",
          evt.date || "",
          evt.coordinatorName || "N/A",
          evt.status || "UPCOMING",
          evt.maxParticipants ?? "Unlimited",
          rsvps,
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
        .limit(100)
        .get();

      const volunteers = usersSnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[];

      // Run parallel aggregation counts per volunteer instead of scanning all attendances
      const countPromises = volunteers.map((v: any) =>
        adminDb
          .collection("attendances")
          .where("markedById", "==", v.id)
          .count()
          .get()
          .then((snap) => ({ id: v.id, count: snap.data().count }))
          .catch(() => ({ id: v.id, count: 0 }))
      );

      const countResults = await Promise.all(countPromises);
      const countMap = new Map<string, number>();
      countResults.forEach((c) => countMap.set(c.id, c.count));

      filename = "volunteers_performance_report.csv";

      const headersList = [
        "Volunteer Name",
        "Email",
        "Account Created At",
        "Total Check-ins Validated",
      ];
      csvContent += headersList.map(escapeCSV).join(",") + "\n";

      volunteers.forEach((v: any) => {
        const validatedCount = countMap.get(v.id) ?? 0;
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

      const regsSnapshot = await adminDb
        .collection("registrations")
        .orderBy("createdAt", "desc")
        .limit(200)
        .get();

      const registrations = regsSnapshot.docs.map((d: any) => d.data()) as any[];

      // Identify any legacy registrations missing denormalized event fields
      const missingEventIds = Array.from(
        new Set(
          registrations
            .filter((r) => !r.eventTitle)
            .map((r) => r.eventId)
            .filter(Boolean)
        )
      );

      const [userMap, eventMap] = await Promise.all([
        fetchDocsAsMap("users", registrations.map((r) => r.studentId)),
        missingEventIds.length > 0
          ? fetchDocsAsMap("events", missingEventIds)
          : Promise.resolve(new Map<string, any>()),
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
        const legacyEvent = eventMap.get(reg.eventId);
        const eventTitle = reg.eventTitle || legacyEvent?.title || "Unknown";
        const eventCategory = reg.eventCategory || legacyEvent?.category || "";
        const eventDate = reg.eventDate || legacyEvent?.date || "";

        const row = [
          student.name || "Unknown",
          student.rollNumber || "N/A",
          student.email || "",
          eventTitle,
          eventCategory,
          eventDate,
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