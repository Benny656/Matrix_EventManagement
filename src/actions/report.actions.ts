"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}

type ReportType = "registrations" | "attendance" | "session-attendance";

interface ReportOptions {
  eventId?: string;
  sessionId?: string;
}

export async function generateReportData(
  type: ReportType,
  options: ReportOptions = {}
): Promise<Record<string, unknown>[]> {
  await requireAdmin();

  switch (type) {
    case "registrations": {
      const where = options.eventId ? { eventId: options.eventId } : {};
      const records = await prisma.registration.findMany({
        where: { ...where, status: "CONFIRMED" },
        include: {
          student: { select: { name: true, email: true, registerNumber: true, department: true } },
          event: { select: { title: true, date: true, venue: true } },
        },
        orderBy: { registeredAt: "asc" },
      });

      return records.map((r) => ({
        "Register Number": r.student.registerNumber ?? "N/A",
        Name: r.student.name,
        Email: r.student.email,
        Department: r.student.department ?? "N/A",
        Event: r.event.title,
        "Event Date": r.event.date.toLocaleDateString("en-IN"),
        Venue: r.event.venue,
        "Registered At": r.registeredAt.toLocaleDateString("en-IN"),
        Status: r.status,
      }));
    }

    case "attendance": {
      const where = options.eventId
        ? { registration: { eventId: options.eventId } }
        : {};
      const records = await prisma.attendance.findMany({
        where,
        include: {
          registration: {
            include: {
              student: { select: { name: true, email: true, registerNumber: true, department: true } },
              event: { select: { title: true, date: true } },
            },
          },
          session: { select: { title: true } },
          markedBy: { select: { name: true } },
        },
        orderBy: { markedAt: "asc" },
      });

      return records.map((a) => ({
        "Register Number": a.registration.student.registerNumber ?? "N/A",
        Name: a.registration.student.name,
        Email: a.registration.student.email,
        Department: a.registration.student.department ?? "N/A",
        Event: a.registration.event.title,
        Session: a.session.title,
        "Marked At": a.markedAt.toLocaleString("en-IN"),
        Method: a.method,
        "Marked By": a.markedBy.name,
      }));
    }

    case "session-attendance": {
      if (!options.sessionId) throw new Error("sessionId required for session-attendance report");
      const records = await prisma.attendance.findMany({
        where: { sessionId: options.sessionId },
        include: {
          registration: {
            include: {
              student: { select: { name: true, email: true, registerNumber: true, department: true } },
            },
          },
          markedBy: { select: { name: true } },
        },
        orderBy: { markedAt: "asc" },
      });

      return records.map((a) => ({
        "Register Number": a.registration.student.registerNumber ?? "N/A",
        Name: a.registration.student.name,
        Email: a.registration.student.email,
        Department: a.registration.student.department ?? "N/A",
        "Marked At": a.markedAt.toLocaleString("en-IN"),
        Method: a.method,
        "Marked By": a.markedBy.name,
      }));
    }

    default:
      return [];
  }
}
