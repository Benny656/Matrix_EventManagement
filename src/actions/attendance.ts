"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

async function verifyStaff() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "VOLUNTEER" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized. Staff permissions required.");
  }

  return session.user;
}

export async function markAttendanceAction(params: {
  sessionId: string;
  rollNumber: string;
  method: "SCANNED" | "MANUAL";
}) {
  const staff = await verifyStaff();
  const { sessionId, rollNumber, method } = params;

  // 1. Fetch student and session in parallel (Step 1 of parallel queries)
  const [student, session] = await Promise.all([
    prisma.user.findFirst({
      where: {
        rollNumber: {
          equals: rollNumber,
          mode: "insensitive", // case insensitive matching
        },
        role: "STUDENT",
      },
    }),
    prisma.session.findUnique({
      where: { id: sessionId },
      include: { event: true },
    }),
  ]);

  if (!student) {
    return {
      success: false,
      error: "STUDENT_NOT_FOUND" as const,
      message: `No student found with roll number "${rollNumber}" on Matrix system.`,
    };
  }

  if (!session) {
    return {
      success: false,
      error: "SESSION_NOT_FOUND" as const,
      message: "Session block not found.",
    };
  }

  // 2. Fetch existing attendance and registration in parallel (Step 2 of parallel queries)
  const [existingAttendance, registration] = await Promise.all([
    prisma.attendance.findFirst({
      where: {
        sessionId,
        studentId: student.id,
      },
    }),
    prisma.registration.findUnique({
      where: {
        studentId_eventId: {
          studentId: student.id,
          eventId: session.eventId,
        },
      },
    }),
  ]);

  if (existingAttendance) {
    return {
      success: false,
      error: "ALREADY_MARKED" as const,
      message: `${student.name} is already checked in for this session.`,
      studentName: student.name,
    };
  }

  if (!registration || registration.status === "CANCELLED") {
    return {
      success: false,
      error: "NOT_REGISTERED" as const,
      message: `${student.name} is not registered for this event.`,
      studentName: student.name,
      studentId: student.id,
    };
  }

  if (registration.status === "WAITLISTED") {
    return {
      success: false,
      error: "WAITLISTED" as const,
      message: `${student.name} is currently on the WAITLIST. Confirm override to check-in.`,
      studentName: student.name,
      studentId: student.id,
    };
  }

  // 5. Successful confirmed check-in
  await prisma.attendance.create({
    data: {
      sessionId,
      studentId: student.id,
      checkInMethod: method,
      markedById: staff.id,
    },
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

  return await prisma.$transaction(async (tx) => {
    const session = await tx.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new Error("Session not found");

    // Promote waitlist to registered
    await tx.registration.update({
      where: {
        studentId_eventId: {
          studentId,
          eventId: session.eventId,
        },
      },
      data: { status: "REGISTERED" },
    });

    // Mark attendance
    await tx.attendance.create({
      data: {
        sessionId,
        studentId,
        checkInMethod: "MANUAL",
        markedById: staff.id,
      },
    });

    return { success: true };
  });
}

// Helper to list all upcoming and ongoing sessions for selection in the scanner
export async function getActiveSessionsAction() {
  await verifyStaff();

  const sessions = await prisma.session.findMany({
    where: {
      event: {
        NOT: { status: "ARCHIVED" },
      },
    },
    include: {
      event: {
        select: { title: true },
      },
    },
    orderBy: { startTime: "asc" },
  });

  return sessions;
}
