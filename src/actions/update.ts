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
    throw new Error("Unauthorized. Staff access required.");
  }

  return session.user;
}

export async function postUpdateAction(params: {
  scope: "EVENT" | "DEPARTMENT";
  eventId?: string;
  content: string;
}) {
  const staff = await verifyStaff();
  const { scope, eventId, content } = params;

  if (scope === "EVENT" && !eventId) {
    throw new Error("Event selection is required for event-scoped updates.");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Create Update
    const update = await tx.update.create({
      data: {
        authorId: staff.id,
        scope,
        eventId: scope === "EVENT" ? eventId : null,
        content,
      },
      include: {
        event: true,
      },
    });

    // 2. Dispatch Notifications based on scope
    if (scope === "EVENT" && eventId) {
      // Find all registered or waitlisted students for this event
      const registrants = await tx.registration.findMany({
        where: {
          eventId,
          status: { in: ["REGISTERED", "WAITLISTED"] },
        },
        select: { studentId: true },
      });

      const notifications = registrants.map((reg) => ({
        userId: reg.studentId,
        type: "UPDATE_POSTED" as const,
        message: `[${update.event?.title || "Event"}] Update posted: "${content.slice(0, 60)}..."`,
        linkUrl: `/student/events/${eventId}`,
      }));

      if (notifications.length > 0) {
        await tx.notification.createMany({
          data: notifications,
        });
      }
    } else {
      // Department-wide update: send to all students
      const students = await tx.user.findMany({
        where: { role: "STUDENT" },
        select: { id: true },
      });

      const notifications = students.map((std) => ({
        userId: std.id,
        type: "UPDATE_POSTED" as const,
        message: `Department Announcement: "${content.slice(0, 65)}..."`,
        linkUrl: `/student/updates`,
      }));

      if (notifications.length > 0) {
        await tx.notification.createMany({
          data: notifications,
        });
      }
    }

    revalidatePath("/student");
    revalidatePath("/student/updates");
    revalidatePath("/volunteer/updates");
    revalidatePath("/admin/updates");
    if (eventId) {
      revalidatePath(`/student/events/${eventId}`);
    }

    return { success: true };
  });
}

export async function getUpdatesAction(eventId?: string) {
  return await prisma.update.findMany({
    where: eventId ? { eventId } : {},
    include: {
      author: {
        select: { name: true, role: true },
      },
      event: {
        select: { title: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Fetch all events current staff can write updates for
export async function getActiveEventOptionsAction() {
  await verifyStaff();
  return await prisma.event.findMany({
    where: { status: { not: "ARCHIVED" } },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });
}
