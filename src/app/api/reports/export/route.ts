import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function escapeCSV(val: any) {
  if (val === null || val === undefined) return "";
  let str = String(val);
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const role = session.user.role;
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

      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          sessions: {
            orderBy: { startTime: "asc" },
          },
          registrations: {
            include: {
              student: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!event) {
        return new NextResponse("Event not found", { status: 404 });
      }

      // Fetch all attendance for these sessions
      const sessionIds = event.sessions.map((s) => s.id);
      const attendances = await prisma.attendance.findMany({
        where: { sessionId: { in: sessionIds } },
        include: { session: true },
      });

      // Map studentId -> list of session titles they attended
      const attendanceMap: Record<string, string[]> = {};
      attendances.forEach((att) => {
        if (!attendanceMap[att.studentId]) {
          attendanceMap[att.studentId] = [];
        }
        attendanceMap[att.studentId].push(att.session.title);
      });

      filename = `event_${event.title.replace(/\s+/g, "_")}_attendance.csv`;

      // Headers
      const headersList = [
        "Student Name",
        "Roll Number",
        "Email",
        "Phone",
        "Registration Status",
        "Registration Date",
        "Attended Sessions",
        "Total Sessions Attended",
      ];
      csvContent += headersList.map(escapeCSV).join(",") + "\n";

      event.registrations.forEach((reg) => {
        const studentSessions = attendanceMap[reg.studentId] || [];
        const row = [
          reg.student.name,
          reg.student.rollNumber || "N/A",
          reg.student.email,
          reg.student.phone || "N/A",
          reg.status,
          reg.createdAt.toISOString(),
          studentSessions.join("; "),
          studentSessions.length,
        ];
        csvContent += row.map(escapeCSV).join(",") + "\n";
      });
    } else if (type === "events-summary") {
      if (role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
      }

      const events = await prisma.event.findMany({
        include: {
          sessions: {
            include: {
              attendances: true,
            },
          },
          registrations: true,
        },
        orderBy: { date: "asc" },
      });

      filename = "events_summary_report.csv";

      const headersList = [
        "Event ID",
        "Title",
        "Category",
        "Date",
        "Venue",
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

      events.forEach((evt) => {
        const rsvps = evt.registrations.filter((r) => r.status === "REGISTERED").length;
        const waitlisted = evt.registrations.filter((r) => r.status === "WAITLISTED").length;
        const cancelled = evt.registrations.filter((r) => r.status === "CANCELLED").length;

        // Unique check-ins across all sessions of the event
        const checkedInStudentIds = new Set<string>();
        evt.sessions.forEach((sess) => {
          sess.attendances.forEach((att) => {
            checkedInStudentIds.add(att.studentId);
          });
        });
        const uniqueCheckIns = checkedInStudentIds.size;
        const rate = rsvps > 0 ? ((uniqueCheckIns / rsvps) * 100).toFixed(1) : "0.0";

        const row = [
          evt.id,
          evt.title,
          evt.category,
          evt.date.toISOString(),
          evt.venue,
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

      const volunteers = await prisma.user.findMany({
        where: { role: "VOLUNTEER" },
        include: {
          markedAttendances: true,
        },
        orderBy: { name: "asc" },
      });

      filename = "volunteers_performance_report.csv";

      const headersList = [
        "Volunteer Name",
        "Email",
        "Phone",
        "Account Created At",
        "Total Check-ins Validated",
      ];
      csvContent += headersList.map(escapeCSV).join(",") + "\n";

      volunteers.forEach((v) => {
        const row = [
          v.name,
          v.email,
          v.phone || "N/A",
          v.createdAt.toISOString(),
          v.markedAttendances.length,
        ];
        csvContent += row.map(escapeCSV).join(",") + "\n";
      });
    } else if (type === "students-registration-log") {
      if (role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
      }

      const registrations = await prisma.registration.findMany({
        include: {
          student: true,
          event: true,
        },
        orderBy: { createdAt: "desc" },
      });

      filename = "students_registration_log.csv";

      const headersList = [
        "Student Name",
        "Roll Number",
        "Email",
        "Phone",
        "Event Title",
        "Event Category",
        "Event Date",
        "Registration Status",
        "Registration Date",
      ];
      csvContent += headersList.map(escapeCSV).join(",") + "\n";

      registrations.forEach((reg) => {
        const row = [
          reg.student.name,
          reg.student.rollNumber || "N/A",
          reg.student.email,
          reg.student.phone || "N/A",
          reg.event.title,
          reg.event.category,
          reg.event.date.toISOString(),
          reg.status,
          reg.createdAt.toISOString(),
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
