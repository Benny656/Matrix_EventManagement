"use client";

import React, { useState } from "react";
import AttendeeList from "@/components/events/attendee-list";
import VolunteerList from "@/components/events/volunteer-list";
import VolunteerAttendancePanel from "@/components/events/volunteer-attendance-panel";
import { VolunteerMember } from "@/actions/volunteer-management";
import { Users, Heart, ClipboardCheck } from "lucide-react";

interface AdminEventTabsProps {
  eventId: string;
  registrations: any[];
  volunteers: VolunteerMember[];
  allRegistrationsForVolunteerAssignment: {
    registrationId: string;
    studentId: string;
    name: string;
    email: string;
    rollNumber: string | null;
    department: string | null;
    eventRole: "participant" | "volunteer";
    status: string;
  }[];
  isAdmin: boolean;
}

export default function AdminEventTabs({
  eventId,
  registrations,
  volunteers,
  allRegistrationsForVolunteerAssignment,
  isAdmin,
}: AdminEventTabsProps) {
  const [activeTab, setActiveTab] = useState<"PARTICIPANTS" | "VOLUNTEERS" | "VOLUNTEER_ATTENDANCE">("PARTICIPANTS");

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-border bg-card">
        <button
          onClick={() => setActiveTab("PARTICIPANTS")}
          className={`flex items-center gap-2 px-5 py-3 font-mono text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === "PARTICIPANTS"
              ? "border-primary text-primary font-bold bg-surface-container-low"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users size={14} />
          <span>Participants ({registrations.filter((r) => r.eventRole !== "volunteer").length})</span>
        </button>

        <button
          onClick={() => setActiveTab("VOLUNTEERS")}
          className={`flex items-center gap-2 px-5 py-3 font-mono text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === "VOLUNTEERS"
              ? "border-primary text-primary font-bold bg-surface-container-low"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Heart size={14} />
          <span>Volunteers ({volunteers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("VOLUNTEER_ATTENDANCE")}
          className={`flex items-center gap-2 px-5 py-3 font-mono text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === "VOLUNTEER_ATTENDANCE"
              ? "border-primary text-primary font-bold bg-surface-container-low"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ClipboardCheck size={14} />
          <span>Volunteer Attendance</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "PARTICIPANTS" && (
        <AttendeeList registrations={registrations.filter((r) => r.eventRole !== "volunteer") as any} />
      )}

      {activeTab === "VOLUNTEERS" && (
        <VolunteerList
          eventId={eventId}
          initialVolunteers={volunteers}
          allRegistrations={allRegistrationsForVolunteerAssignment}
          isAdmin={isAdmin}
        />
      )}

      {activeTab === "VOLUNTEER_ATTENDANCE" && (
        <VolunteerAttendancePanel
          eventId={eventId}
          initialVolunteers={volunteers}
          readOnly={isAdmin}
        />
      )}
    </div>
  );
}
