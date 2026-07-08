"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { generateRegistrationQR } from "@/lib/qr";
import type { ActionResult, RegistrationWithRelations } from "@/types";

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized: Please sign in");
  return session;
}

export async function registerForEvent(eventId: string): Promise<ActionResult<{ qrDataUrl: string; registrationId: string }>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Check event exists and is published
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return { success: false, error: "Event not found" };
    if (event.status !== "PUBLISHED") return { success: false, error: "Event is not open for registration" };
    if (new Date() > event.registrationDeadline) return { success: false, error: "Registration deadline has passed" };
    if (event.currentRegistrations >= event.maxParticipants) return { success: false, error: "Event is full" };

    // Check duplicate
    const existing = await prisma.registration.findUnique({
      where: { studentId_eventId: { studentId: userId, eventId } },
    });
    if (existing) {
      if (existing.status === "CANCELLED") {
        // Re-activate
        const updated = await prisma.registration.update({
          where: { id: existing.id },
          data: { status: "CONFIRMED", cancelledAt: null },
        });
        await prisma.event.update({ where: { id: eventId }, data: { currentRegistrations: { increment: 1 } } });
        const qrDataUrl = await generateRegistrationQR(updated.qrCode);
        revalidatePath("/student/my-registrations");
        return { success: true, data: { qrDataUrl, registrationId: updated.id } };
      }
      return { success: false, error: "You are already registered for this event" };
    }

    // Create registration
    const registration = await prisma.registration.create({
      data: { studentId: userId, eventId, status: "CONFIRMED" },
    });

    // Increment count
    await prisma.event.update({
      where: { id: eventId },
      data: { currentRegistrations: { increment: 1 } },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        title: "Registration Confirmed",
        message: `You have successfully registered for "${event.title}".`,
        type: "REGISTRATION",
        link: `/student/my-registrations`,
      },
    });

    const qrDataUrl = await generateRegistrationQR(registration.qrCode);

    revalidatePath("/student/events");
    revalidatePath("/student/my-registrations");
    revalidatePath(`/student/events/${eventId}`);

    return { success: true, data: { qrDataUrl, registrationId: registration.id } };
  } catch (error) {
    console.error("registerForEvent error:", error);
    return { success: false, error: "Failed to register for event" };
  }
}

export async function cancelRegistration(registrationId: string): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { event: { select: { title: true } } },
    });
    if (!registration) return { success: false, error: "Registration not found" };
    if (registration.studentId !== userId) return { success: false, error: "Unauthorized" };
    if (registration.status === "CANCELLED") return { success: false, error: "Already cancelled" };

    await prisma.registration.update({
      where: { id: registrationId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    await prisma.event.update({
      where: { id: registration.eventId },
      data: { currentRegistrations: { decrement: 1 } },
    });

    revalidatePath("/student/my-registrations");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("cancelRegistration error:", error);
    return { success: false, error: "Failed to cancel registration" };
  }
}

export async function getMyRegistrations(): Promise<RegistrationWithRelations[]> {
  const session = await requireAuth();
  return prisma.registration.findMany({
    where: { studentId: session.user.id },
    include: {
      student: { select: { id: true, name: true, email: true, registerNumber: true, department: true } },
      event: { select: { id: true, title: true, date: true, venue: true } },
      attendance: true,
    },
    orderBy: { registeredAt: "desc" },
  }) as Promise<RegistrationWithRelations[]>;
}

export async function getEventRegistrations(eventId: string): Promise<RegistrationWithRelations[]> {
  return prisma.registration.findMany({
    where: { eventId },
    include: {
      student: { select: { id: true, name: true, email: true, registerNumber: true, department: true } },
      event: { select: { id: true, title: true, date: true, venue: true } },
      attendance: true,
    },
    orderBy: { registeredAt: "desc" },
  }) as Promise<RegistrationWithRelations[]>;
}

export async function getAllRegistrations(): Promise<RegistrationWithRelations[]> {
  return prisma.registration.findMany({
    include: {
      student: { select: { id: true, name: true, email: true, registerNumber: true, department: true } },
      event: { select: { id: true, title: true, date: true, venue: true } },
      attendance: true,
    },
    orderBy: { registeredAt: "desc" },
  }) as Promise<RegistrationWithRelations[]>;
}

export async function manualRegisterStudent(
  studentRegisterNumber: string,
  eventId: string
): Promise<ActionResult<{ registrationId: string }>> {
  try {
    const authSession = await requireAuth();
    if (!["ADMIN", "VOLUNTEER"].includes(authSession.user.role as string)) {
      return { success: false, error: "Unauthorized" };
    }

    const student = await prisma.user.findFirst({
      where: { registerNumber: studentRegisterNumber, role: "STUDENT" },
    });
    if (!student) return { success: false, error: "Student not found with that register number" };

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return { success: false, error: "Event not found" };

    const existing = await prisma.registration.findUnique({
      where: { studentId_eventId: { studentId: student.id, eventId } },
    });
    if (existing && existing.status !== "CANCELLED") {
      return { success: false, error: "Student is already registered" };
    }

    let registration;
    if (existing?.status === "CANCELLED") {
      registration = await prisma.registration.update({
        where: { id: existing.id },
        data: { status: "CONFIRMED", cancelledAt: null },
      });
    } else {
      registration = await prisma.registration.create({
        data: { studentId: student.id, eventId, status: "CONFIRMED" },
      });
      await prisma.event.update({
        where: { id: eventId },
        data: { currentRegistrations: { increment: 1 } },
      });
    }

    revalidatePath("/volunteer/registrations");
    return { success: true, data: { registrationId: registration.id } };
  } catch (error) {
    console.error("manualRegisterStudent error:", error);
    return { success: false, error: "Failed to register student" };
  }
}
