"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}

export async function getVolunteers() {
  return prisma.user.findMany({
    where: { role: "VOLUNTEER" },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      phone: true,
      createdAt: true,
      _count: { select: { volunteerAssignments: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getStudents() {
  return prisma.user.findMany({
    where: { role: "STUDENT" },
    select: {
      id: true,
      name: true,
      email: true,
      registerNumber: true,
      department: true,
      phone: true,
      createdAt: true,
      _count: { select: { registrations: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function promoteToVolunteer(userId: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    await prisma.user.update({ where: { id: userId }, data: { role: "VOLUNTEER" } });
    revalidatePath("/admin/volunteers");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("promoteToVolunteer error:", error);
    return { success: false, error: "Failed to promote user" };
  }
}

export async function demoteToStudent(userId: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    await prisma.user.update({ where: { id: userId }, data: { role: "STUDENT" } });
    revalidatePath("/admin/volunteers");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("demoteToStudent error:", error);
    return { success: false, error: "Failed to demote user" };
  }
}

export async function getAdminDashboardStats() {
  const [totalEvents, activeEvents, totalRegistrations, totalAttendance] = await Promise.all([
    prisma.event.count(),
    prisma.event.count({ where: { status: { in: ["PUBLISHED", "ONGOING"] } } }),
    prisma.registration.count({ where: { status: "CONFIRMED" } }),
    prisma.attendance.count(),
  ]);

  // Calculate attendance percentage vs registrations
  const attendancePercentage =
    totalRegistrations > 0 ? Math.round((totalAttendance / totalRegistrations) * 100) : 0;

  const recentEvents = await prisma.event.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      coordinator: { select: { id: true, name: true, email: true } },
      _count: { select: { registrations: true, sessions: true } },
      sessions: true,
    },
  });

  const recentRegistrations = await prisma.registration.findMany({
    take: 5,
    orderBy: { registeredAt: "desc" },
    include: {
      student: { select: { id: true, name: true, email: true, registerNumber: true, department: true } },
      event: { select: { id: true, title: true, date: true, venue: true } },
      attendance: true,
    },
  });

  return {
    totalEvents,
    activeEvents,
    totalRegistrations,
    attendancePercentage,
    recentEvents,
    recentRegistrations,
  };
}

export async function getAnalyticsData() {
  // Events by category
  const eventsByCategory = await prisma.event.groupBy({
    by: ["category"],
    _count: { id: true },
  });

  // Events by status
  const eventsByStatus = await prisma.event.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  // Registrations per event (top 10)
  const topEvents = await prisma.event.findMany({
    take: 10,
    orderBy: { currentRegistrations: "desc" },
    select: {
      id: true,
      title: true,
      currentRegistrations: true,
      maxParticipants: true,
    },
  });

  // Monthly registration trends (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const registrationTrends = await prisma.registration.findMany({
    where: { registeredAt: { gte: sixMonthsAgo } },
    select: { registeredAt: true },
    orderBy: { registeredAt: "asc" },
  });

  return { eventsByCategory, eventsByStatus, topEvents, registrationTrends };
}
