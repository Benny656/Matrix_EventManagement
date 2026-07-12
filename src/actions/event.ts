"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import * as z from "zod";

const sessionSchema = z.object({
  title: z.string().min(2, "Session title is required"),
  venue: z.string().min(2, "Session venue is required"),
  startTime: z.string().or(z.date()).transform((val) => new Date(val)),
  endTime: z.string().or(z.date()).transform((val) => new Date(val)),
});

const eventSchema = z.object({
  title: z.string().min(2, "Event title is required"),
  description: z.string().min(5, "Event description must be at least 5 characters"),
  posterUrl: z.string().optional().nullable(),
  venue: z.string().min(2, "Event venue is required"),
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  registrationDeadline: z.string().or(z.date()).transform((val) => new Date(val)),
  maxParticipants: z.number().min(1, "Capacity must be at least 1"),
  category: z.string().min(2, "Category is required"),
  coordinatorName: z.string().min(2, "Coordinator name is required"),
  sessions: z.array(sessionSchema).min(1, "At least one session is required"),
});

export type EventInput = z.infer<typeof eventSchema>;

// Helper to verify user permissions
async function verifyAuth(allowedRoles: ("ADMIN" | "VOLUNTEER")[]) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !allowedRoles.includes(session.user.role as any)) {
    throw new Error("Unauthorized. Insufficient permissions.");
  }

  return session.user;
}

export async function createEventAction(input: EventInput) {
  const user = await verifyAuth(["ADMIN", "VOLUNTEER"]);
  
  const validated = eventSchema.parse(input);

  // Run in transaction to ensure all or nothing
  const event = await prisma.$transaction(async (tx) => {
    const newEvent = await tx.event.create({
      data: {
        title: validated.title,
        description: validated.description,
        posterUrl: validated.posterUrl,
        venue: validated.venue,
        date: validated.date,
        registrationDeadline: validated.registrationDeadline,
        maxParticipants: validated.maxParticipants,
        category: validated.category,
        coordinatorName: validated.coordinatorName,
        createdById: user.id,
        status: "UPCOMING",
        sessions: {
          create: validated.sessions.map((s) => ({
            title: s.title,
            venue: s.venue,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        },
      },
      include: {
        sessions: true,
      },
    });

    // Create a notification for department-wide updates
    await tx.notification.createMany({
      data: (await tx.user.findMany({ select: { id: true } })).map((u) => ({
        userId: u.id,
        type: "NEW_EVENT",
        message: `New event published: ${validated.title}. Registration open until ${validated.registrationDeadline.toLocaleDateString()}.`,
        linkUrl: `/student/events/${newEvent.id}`,
      })),
    });

    return newEvent;
  });

  revalidatePath("/student");
  revalidatePath("/volunteer");
  revalidatePath("/admin");
  return { success: true, eventId: event.id };
}

export async function updateEventAction(id: string, input: Omit<EventInput, "sessions">) {
  await verifyAuth(["ADMIN", "VOLUNTEER"]);

  const baseSchema = eventSchema.omit({ sessions: true });
  const validated = baseSchema.parse(input);

  await prisma.event.update({
    where: { id },
    data: {
      title: validated.title,
      description: validated.description,
      posterUrl: validated.posterUrl,
      venue: validated.venue,
      date: validated.date,
      registrationDeadline: validated.registrationDeadline,
      maxParticipants: validated.maxParticipants,
      category: validated.category,
      coordinatorName: validated.coordinatorName,
    },
  });

  revalidatePath(`/student/events/${id}`);
  revalidatePath(`/volunteer/events/${id}`);
  revalidatePath("/volunteer/events");
  revalidatePath("/admin/events");
  return { success: true };
}

export async function archiveEventAction(id: string) {
  await verifyAuth(["ADMIN", "VOLUNTEER"]);

  await prisma.event.update({
    where: { id },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date(),
    },
  });

  revalidatePath("/student");
  revalidatePath("/volunteer");
  revalidatePath("/admin");
  revalidatePath(`/student/events/${id}`);
  revalidatePath(`/volunteer/events/${id}`);
  return { success: true };
}

export async function getEventsAction(includeArchived = false) {
  const events = await prisma.event.findMany({
    where: includeArchived ? {} : { NOT: { status: "ARCHIVED" } },
    include: {
      sessions: true,
      _count: {
        select: { registrations: true },
      },
    },
    orderBy: { date: "asc" },
  });

  // Dynamically update status based on current time
  const now = new Date();
  const updatedEvents = await Promise.all(
    events.map(async (event) => {
      if (event.status === "ARCHIVED") return event;

      let newStatus: "UPCOMING" | "ONGOING" | "COMPLETED" = "UPCOMING";

      // If registrations are active but event date has passed
      const hasOngoingSession = event.sessions.some(
        (s) => now >= s.startTime && now <= s.endTime
      );
      const allSessionsFinished = event.sessions.every((s) => now > s.endTime);

      if (hasOngoingSession) {
        newStatus = "ONGOING";
      } else if (allSessionsFinished && event.sessions.length > 0) {
        newStatus = "COMPLETED";
      }

      if (newStatus !== event.status) {
        await prisma.event.update({
          where: { id: event.id },
          data: { status: newStatus },
        });
        event.status = newStatus;
      }

      return event;
    })
  );

  return updatedEvents;
}
