"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

async function verifyStudent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "STUDENT") {
    throw new Error("Unauthorized. Student credentials required.");
  }

  return session.user;
}

export async function registerForEventAction(eventId: string) {
  const user = await verifyStudent();

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch Event details and capacity
    const event = await tx.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          where: { status: "REGISTERED" },
        },
      },
    });

    if (!event) throw new Error("Event not found");

    if (event.status === "ARCHIVED") {
      throw new Error("Cannot register for an archived event.");
    }

    if (new Date() > new Date(event.registrationDeadline)) {
      throw new Error("Registration deadline has passed.");
    }

    // Check if user already has a registration record
    const existing = await tx.registration.findUnique({
      where: {
        studentId_eventId: {
          studentId: user.id,
          eventId: eventId,
        },
      },
    });

    if (existing && existing.status !== "CANCELLED") {
      throw new Error("You are already registered or waitlisted for this event.");
    }

    // Calculate if we need to waitlist
    const activeCount = event.registrations.length;
    const isWaitlist = activeCount >= event.maxParticipants;
    const newStatus = isWaitlist ? ("WAITLISTED" as const) : ("REGISTERED" as const);

    if (existing) {
      // Re-activate cancelled registration
      await tx.registration.update({
        where: { id: existing.id },
        data: {
          status: newStatus,
          createdAt: new Date(), // Reset timestamp for waitlist ordering
        },
      });
    } else {
      // Create new registration record
      await tx.registration.create({
        data: {
          studentId: user.id,
          eventId: eventId,
          status: newStatus,
        },
      });
    }

    // Create Notification
    await tx.notification.create({
      data: {
        userId: user.id,
        type: isWaitlist ? "UPDATE_POSTED" : "NEW_EVENT",
        message: isWaitlist
          ? `You have been added to the waitlist for ${event.title}.`
          : `Registration confirmed for ${event.title}!`,
        linkUrl: `/student/events/${eventId}`,
      },
    });

    // Revalidate paths
    revalidatePath("/student");
    revalidatePath(`/student/events/${eventId}`);
    revalidatePath("/student/registrations");
    revalidatePath(`/volunteer/events/${eventId}`);
    revalidatePath(`/admin/events/${eventId}`);

    return { success: true, status: newStatus };
  });
}

export async function cancelRegistrationAction(eventId: string) {
  const user = await verifyStudent();

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.registration.findUnique({
      where: {
        studentId_eventId: {
          studentId: user.id,
          eventId: eventId,
        },
      },
      include: {
        event: true,
      },
    });

    if (!existing || existing.status === "CANCELLED") {
      throw new Error("No active registration found to cancel.");
    }

    const previousStatus = existing.status;

    // Update status to CANCELLED
    await tx.registration.update({
      where: { id: existing.id },
      data: { status: "CANCELLED" },
    });

    // If student was confirmed, promote the first waitlisted student
    if (previousStatus === "REGISTERED") {
      const nextWaitlisted = await tx.registration.findFirst({
        where: {
          eventId: eventId,
          status: "WAITLISTED",
        },
        orderBy: { createdAt: "asc" },
        include: {
          student: true,
        },
      });

      if (nextWaitlisted) {
        await tx.registration.update({
          where: { id: nextWaitlisted.id },
          data: { status: "REGISTERED" },
        });

        // Notify promoted student
        await tx.notification.create({
          data: {
            userId: nextWaitlisted.studentId,
            type: "NEW_EVENT",
            message: `Good news! You have been promoted from the waitlist and registered for ${existing.event.title}.`,
            linkUrl: `/student/events/${eventId}`,
          },
        });
      }
    }

    // Revalidate paths
    revalidatePath("/student");
    revalidatePath(`/student/events/${eventId}`);
    revalidatePath("/student/registrations");
    revalidatePath(`/volunteer/events/${eventId}`);
    revalidatePath(`/admin/events/${eventId}`);

    return { success: true };
  });
}
