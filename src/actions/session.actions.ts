"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sessionSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { ActionResult, SessionWithRelations } from "@/types";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}

export async function getSessionsByEvent(eventId: string): Promise<SessionWithRelations[]> {
  return prisma.session.findMany({
    where: { eventId },
    include: {
      event: { select: { id: true, title: true, venue: true } },
      volunteerAssignments: {
        include: {
          volunteer: { select: { id: true, name: true, email: true } },
        },
      },
      _count: { select: { attendance: true } },
    },
    orderBy: { startTime: "asc" },
  }) as Promise<SessionWithRelations[]>;
}

export async function createSession(
  data: Record<string, unknown>
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const validated = sessionSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message };
    }

    const { startTime, endTime, eventId, title, venue } = validated.data;

    const eventRecord = await prisma.event.findUnique({
      where: { id: eventId },
      select: { date: true },
    });
    if (!eventRecord) return { success: false, error: "Event not found" };

    const dateStr = eventRecord.date.toISOString().split("T")[0];
    const session = await prisma.session.create({
      data: {
        title,
        venue,
        eventId,
        startTime: new Date(`${dateStr}T${startTime}`),
        endTime: new Date(`${dateStr}T${endTime}`),
      },
    });

    revalidatePath(`/admin/events/${eventId}/sessions`);
    return { success: true, data: { id: session.id } };
  } catch (error) {
    console.error("createSession error:", error);
    return { success: false, error: "Failed to create session" };
  }
}

export async function updateSession(
  id: string,
  data: Record<string, unknown>
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const validated = sessionSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message };
    }

    const { startTime, endTime, eventId, title, venue } = validated.data;

    const eventRecord = await prisma.event.findUnique({
      where: { id: eventId },
      select: { date: true },
    });
    if (!eventRecord) return { success: false, error: "Event not found" };

    const dateStr = eventRecord.date.toISOString().split("T")[0];
    await prisma.session.update({
      where: { id },
      data: {
        title,
        venue,
        startTime: new Date(`${dateStr}T${startTime}`),
        endTime: new Date(`${dateStr}T${endTime}`),
      },
    });

    revalidatePath(`/admin/events/${eventId}/sessions`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("updateSession error:", error);
    return { success: false, error: "Failed to update session" };
  }
}

export async function deleteSession(id: string, eventId: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    await prisma.session.delete({ where: { id } });
    revalidatePath(`/admin/events/${eventId}/sessions`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("deleteSession error:", error);
    return { success: false, error: "Failed to delete session" };
  }
}

export async function assignVolunteer(
  volunteerId: string,
  sessionId: string,
  eventId: string
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    const existing = await prisma.volunteerAssignment.findUnique({
      where: { volunteerId_sessionId: { volunteerId, sessionId } },
    });
    if (existing) {
      return { success: false, error: "Volunteer is already assigned to this session" };
    }

    await prisma.volunteerAssignment.create({
      data: { volunteerId, sessionId, eventId },
    });

    revalidatePath(`/admin/events/${eventId}/sessions`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("assignVolunteer error:", error);
    return { success: false, error: "Failed to assign volunteer" };
  }
}

export async function removeVolunteerAssignment(
  assignmentId: string,
  eventId: string
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    await prisma.volunteerAssignment.delete({ where: { id: assignmentId } });
    revalidatePath(`/admin/events/${eventId}/sessions`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("removeVolunteerAssignment error:", error);
    return { success: false, error: "Failed to remove volunteer assignment" };
  }
}

export async function getVolunteerSessions(volunteerId: string) {
  return prisma.volunteerAssignment.findMany({
    where: { volunteerId },
    include: {
      session: {
        include: {
          event: { select: { id: true, title: true, venue: true, date: true } },
          _count: { select: { attendance: true } },
        },
      },
      event: { select: { id: true, title: true, status: true } },
    },
    orderBy: { session: { startTime: "asc" } },
  });
}
