import type {
  User,
  Event,
  Session,
  Registration,
  Attendance,
  VolunteerAssignment,
  Notification,
  UserRole,
  EventStatus,
  EventCategory,
  RegistrationStatus,
  AttendanceMethod,
  NotificationType,
} from "@prisma/client";

// Re-export Prisma types for convenience
export type {
  User,
  Event,
  Session,
  Registration,
  Attendance,
  VolunteerAssignment,
  Notification,
  UserRole,
  EventStatus,
  EventCategory,
  RegistrationStatus,
  AttendanceMethod,
  NotificationType,
};

// ─── Extended types with relations ────────────────────────────────────────────

export type EventWithRelations = Event & {
  coordinator: Pick<User, "id" | "name" | "email">;
  sessions: Session[];
  _count: {
    registrations: number;
    sessions: number;
  };
};

export type SessionWithRelations = Session & {
  event: Pick<Event, "id" | "title" | "venue">;
  volunteerAssignments: (VolunteerAssignment & {
    volunteer: Pick<User, "id" | "name" | "email">;
  })[];
  _count: {
    attendance: number;
  };
};

export type RegistrationWithRelations = Registration & {
  student: Pick<User, "id" | "name" | "email" | "registerNumber" | "department">;
  event: Pick<Event, "id" | "title" | "date" | "venue">;
  attendance: Attendance[];
};

export type AttendanceWithRelations = Attendance & {
  registration: Registration & {
    student: Pick<User, "id" | "name" | "email" | "registerNumber">;
    event: Pick<Event, "id" | "title">;
  };
  session: Pick<Session, "id" | "title">;
  markedBy: Pick<User, "id" | "name">;
};

export type NotificationWithDetails = Notification;

// ─── Dashboard stat types ─────────────────────────────────────────────────────

export type AdminDashboardStats = {
  totalEvents: number;
  activeEvents: number;
  totalRegistrations: number;
  attendancePercentage: number;
  recentEvents: EventWithRelations[];
  recentRegistrations: RegistrationWithRelations[];
};

export type VolunteerDashboardStats = {
  assignedEvents: number;
  assignedSessions: number;
  totalAttendanceMarked: number;
  todaysSessions: SessionWithRelations[];
};

export type StudentDashboardStats = {
  upcomingEvents: number;
  myRegistrations: number;
  attendedSessions: number;
  recentRegistrations: RegistrationWithRelations[];
};

// ─── Action result types ──────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Filter / pagination types ────────────────────────────────────────────────

export type PaginationParams = {
  page?: number;
  perPage?: number;
};

export type EventFilters = {
  status?: EventStatus;
  category?: EventCategory;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type RegistrationFilters = {
  status?: RegistrationStatus;
  eventId?: string;
  search?: string;
};

export type AttendanceFilters = {
  sessionId?: string;
  eventId?: string;
  search?: string;
};
