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

      const usersSnapshot = await adminDb.collection("users").get();
      const userMap = new Map<string, any>();
      usersSnapshot.docs.forEach((d: any) => userMap.set(d.id, d.data()));

      const sessionIds = sessions.map((s) => s.id);
      const attsSnapshot = await adminDb.collection("attendances").get();
      const attendances = attsSnapshot.docs
        .map((d: any) => d.data())
        .filter((a: any) => sessionIds.includes(a.sessionId));

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
        const eventRegs = allRegs.filter((r: any) => r.eventId === evt.id);
        const rsvps = eventRegs.filter((r: any) => r.status === "REGISTERED").length;
        const waitlisted = eventRegs.filter((r: any) => r.status === "WAITLISTED").length;
        const cancelled = eventRegs.filter((r: any) => r.status === "CANCELLED").length;

        const eventSessionIds = allSessions.filter((s: any) => s.eventId === evt.id).map((s: any) => s.id);
        const checkedInStudentIds = new Set<string>();
        allAtts.forEach((att: any) => {
          if (eventSessionIds.includes(att.sessionId)) {
            checkedInStudentIds.add(att.studentId);
          }
        });

        const uniqueCheckIns = checkedInStudentIds.size;
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

      filename = "volunteers_performance_report.csv";

      const headersList = [
        "Volunteer Name",
        "Email",
        "Account Created At",
        "Total Check-ins Validated",
      ];
      csvContent += headersList.map(escapeCSV).join(",") + "\n";

      volunteers.forEach((v: any) => {
        const validatedCount = allAtts.filter((a: any) => a.markedById === v.id).length;
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

      const usersSnapshot = await adminDb.collection("users").get();
      const userMap = new Map<string, any>();
      usersSnapshot.docs.forEach((d: any) => userMap.set(d.id, d.data()));

      const eventsSnapshot = await adminDb.collection("events").get();
      const eventMap = new Map<string, any>();
      eventsSnapshot.docs.forEach((d: any) => eventMap.set(d.id, d.data()));

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
