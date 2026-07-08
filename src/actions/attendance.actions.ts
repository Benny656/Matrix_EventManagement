"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { parseQrData } from "@/lib/utils";
import type { ActionResult, AttendanceWithRelations } from "@/types";

async function requireVolunteerOrAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  if (!["VOLUNTEER", "ADMIN"].includes(session.user.role as string)) {
    throw new Error("Unauthorized: Volunteer or Admin access required");
  }
  return session;
}

export async function markAttendanceByQR(
  qrData: string,
  sessionId: string
): Promise<ActionResult<{ studentName: string; registerNumber: string | null }>> {
  try {
    const authSession = await requireVolunteerOrAdmin();

    const qrCode = parseQrData(qrData);
    if (!qrCode) return { success: false, error: "Invalid QR code format" };

    const registration = await prisma.registration.findUnique({
      where: { qrCode },
      include: {
        student: { select: { id: true, name: true, registerNumber: true } },
        event: { select: { id: true, title: true } },
      },
    });

    if (!registration) return { success: false, error: "Registration not found for this QR code" };
    if (registration.status !== "CONFIRMED") return { success: false, error: "Registration is not active" };

    // Check session belongs to event
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { eventId: true },
    });
    if (!session || session.eventId !== registration.eventId) {
      return { success: false, error: "QR code does not match this event" };
    }

    // Check duplicate
    const existing = await prisma.attendance.findUnique({
      where: { registrationId_sessionId: { registrationId: registration.id, sessionId } },
    });
    if (existing) return { success: false, error: `${registration.student.name} has already been marked present` };

    await prisma.attendance.create({
      data: {
        registrationId: registration.id,
        sessionId,
        markedById: authSession.user.id,
        method: "QR_SCAN",
      },
    });

    revalidatePath("/volunteer/attendance");
    return {
      success: true,
      data: { studentName: registration.student.name, registerNumber: registration.student.registerNumber },
    };
  } catch (error) {
    console.error("markAttendanceByQR error:", error);
    return { success: false, error: "Failed to mark attendance" };
  }
}

export async function markAttendanceManual(
  registerNumber: string,
  sessionId: string
): Promise<ActionResult<{ studentName: string }>> {
  try {
    const authSession = await requireVolunteerOrAdmin();

    const student = await prisma.user.findFirst({
      where: { registerNumber, role: "STUDENT" },
    });
    if (!student) return { success: false, error: "Student not found with that register number" };

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { eventId: true },
    });
    if (!session) return { success: false, error: "Session not found" };

    const registration = await prisma.registration.findUnique({
      where: { studentId_eventId: { studentId: student.id, eventId: session.eventId } },
    });
    if (!registration) return { success: false, error: "Student is not registered for this event" };
    if (registration.status !== "CONFIRMED") return { success: false, error: "Registration is not active" };

    const existing = await prisma.attendance.findUnique({
      where: { registrationId_sessionId: { registrationId: registration.id, sessionId } },
    });
    if (existing) return { success: false, error: `${student.name} is already marked present` };

    await prisma.attendance.create({
      data: {
        registrationId: registration.id,
        sessionId,
        markedById: authSession.user.id,
        method: "MANUAL",
      },
    });

    revalidatePath("/volunteer/attendance");
    return { success: true, data: { studentName: student.name } };
  } catch (error) {
    console.error("markAttendanceManual error:", error);
    return { success: false, error: "Failed to mark attendance" };
  }
}

export async function getSessionAttendance(sessionId: string): Promise<AttendanceWithRelations[]> {
  return prisma.attendance.findMany({
    where: { sessionId },
    include: {
      registration: {
        include: {
          student: { select: { id: true, name: true, email: true, registerNumber: true } },
          event: { select: { id: true, title: true } },
        },
      },
      session: { select: { id: true, title: true } },
      markedBy: { select: { id: true, name: true } },
    },
    orderBy: { markedAt: "desc" },
  }) as Promise<AttendanceWithRelations[]>;
}

export async function getMyAttendance(studentId: string) {
  return prisma.attendance.findMany({
    where: { registration: { studentId } },
    include: {
      registration: {
        include: {
          event: { select: { id: true, title: true, date: true } },
        },
      },
      session: { select: { id: true, title: true, startTime: true, endTime: true } },
    },
    orderBy: { markedAt: "desc" },
  });
}

export async function getEventAttendanceSummary(eventId: string) {
  const sessions = await prisma.session.findMany({
    where: { eventId },
    include: {
      _count: { select: { attendance: true } },
    },
  });

  const totalRegistrations = await prisma.registration.count({
    where: { eventId, status: "CONFIRMED" },
  });

  return { sessions, totalRegistrations };
}
