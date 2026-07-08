"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { eventSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { ActionResult, EventWithRelations, EventFilters } from "@/types";
import type { EventStatus } from "@prisma/client";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized: Please sign in");
  return session;
}

export async function getEvents(filters?: EventFilters): Promise<EventWithRelations[]> {
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.category) where.category = filters.category;
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { venue: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters?.dateFrom || filters?.dateTo) {
    where.date = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
  }

  return prisma.event.findMany({
    where,
    include: {
      coordinator: { select: { id: true, name: true, email: true } },
      sessions: true,
      _count: { select: { registrations: true, sessions: true } },
    },
    orderBy: { date: "desc" },
  }) as Promise<EventWithRelations[]>;
}

export async function getEvent(id: string): Promise<EventWithRelations | null> {
  return prisma.event.findUnique({
    where: { id },
    include: {
      coordinator: { select: { id: true, name: true, email: true } },
      sessions: {
        include: {
          volunteerAssignments: {
            include: { volunteer: { select: { id: true, name: true, email: true } } },
          },
          _count: { select: { attendance: true } },
        },
        orderBy: { startTime: "asc" },
      },
      _count: { select: { registrations: true, sessions: true } },
    },
  }) as Promise<EventWithRelations | null>;
}

export async function createEvent(
  data: Record<string, unknown>
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const validated = eventSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message };
    }

    const { date, startTime, endTime, registrationDeadline, ...rest } = validated.data;

    const event = await prisma.event.create({
      data: {
        ...rest,
        date: new Date(date),
        startTime: new Date(`${date}T${startTime}`),
        endTime: new Date(`${date}T${endTime}`),
        registrationDeadline: new Date(registrationDeadline),
        posterUrl: rest.posterUrl || null,
      },
    });

    revalidatePath("/admin/events");
    return { success: true, data: { id: event.id } };
  } catch (error) {
    console.error("createEvent error:", error);
    return { success: false, error: "Failed to create event" };
  }
}

export async function updateEvent(
  id: string,
  data: Record<string, unknown>
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const validated = eventSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message };
    }

    const { date, startTime, endTime, registrationDeadline, ...rest } = validated.data;

    await prisma.event.update({
      where: { id },
      data: {
        ...rest,
        date: new Date(date),
        startTime: new Date(`${date}T${startTime}`),
        endTime: new Date(`${date}T${endTime}`),
        registrationDeadline: new Date(registrationDeadline),
        posterUrl: rest.posterUrl || null,
      },
    });

    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${id}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("updateEvent error:", error);
    return { success: false, error: "Failed to update event" };
  }
}

export async function deleteEvent(id: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    await prisma.event.delete({ where: { id } });
    revalidatePath("/admin/events");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("deleteEvent error:", error);
    return { success: false, error: "Failed to delete event" };
  }
}

export async function updateEventStatus(
  id: string,
  status: EventStatus
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    await prisma.event.update({ where: { id }, data: { status } });
    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${id}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("updateEventStatus error:", error);
    return { success: false, error: "Failed to update event status" };
  }
}

export async function getPublishedEvents(filters?: EventFilters) {
  return getEvents({ ...filters, status: "PUBLISHED" });
}
