import { z } from "zod";
import { EventCategory, EventStatus } from "@prisma/client";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  registerNumber: z.string().min(3, "Please enter your register number"),
  department: z.string().min(2, "Please enter your department"),
  phone: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// ─── Event ────────────────────────────────────────────────────────────────────

export const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  posterUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  venue: z.string().min(2, "Please enter a venue"),
  date: z.string().min(1, "Please select a date"),
  startTime: z.string().min(1, "Please select a start time"),
  endTime: z.string().min(1, "Please select an end time"),
  registrationDeadline: z.string().min(1, "Please select a registration deadline"),
  maxParticipants: z.coerce.number().int().min(1, "Must allow at least 1 participant"),
  category: z.nativeEnum(EventCategory),
  status: z.nativeEnum(EventStatus).default("DRAFT"),
  coordinatorId: z.string().min(1, "Please select a coordinator"),
});

export type EventFormData = z.infer<typeof eventSchema>;

// ─── Session ──────────────────────────────────────────────────────────────────

export const sessionSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  venue: z.string().min(2, "Please enter a venue"),
  startTime: z.string().min(1, "Please select a start time"),
  endTime: z.string().min(1, "Please select an end time"),
  eventId: z.string().min(1, "Event ID is required"),
});

export type SessionFormData = z.infer<typeof sessionSchema>;

// ─── Volunteer Assignment ─────────────────────────────────────────────────────

export const volunteerAssignmentSchema = z.object({
  volunteerId: z.string().min(1, "Please select a volunteer"),
  sessionId: z.string().min(1, "Please select a session"),
  eventId: z.string().min(1, "Event ID is required"),
});

// ─── Attendance ───────────────────────────────────────────────────────────────

export const markAttendanceSchema = z.object({
  qrCode: z.string().optional(),
  registerNumber: z.string().optional(),
  sessionId: z.string().min(1, "Session ID is required"),
  method: z.enum(["QR_SCAN", "MANUAL"]).default("MANUAL"),
});
