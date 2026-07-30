"use client";

import React, { useState, useTransition } from "react";
import { VolunteerMember, toggleVolunteerStatusAction } from "@/actions/volunteer-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UserCheck, UserMinus, Plus, ShieldCheck, Heart, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VolunteerListProps {
  eventId: string;
  initialVolunteers: VolunteerMember[];
  allRegistrations: {
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

export default function VolunteerList({
  eventId,
  initialVolunteers,
  allRegistrations,
  isAdmin,
}: VolunteerListProps) {
  const [volunteers, setVolunteers] = useState<VolunteerMember[]>(initialVolunteers);
  const [registrations, setRegistrations] = useState(allRegistrations);
  const [search, setSearch] = useState("");
  const [assignSearch, setAssignSearch] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleToggleVolunteer = (studentId: string, currentIsVolunteer: boolean) => {
    setError(null);
    const nextState = !currentIsVolunteer;

    startTransition(async () => {
      try {
        const res = await toggleVolunteerStatusAction({
          eventId,
          studentId,
          isVolunteer: nextState,
        });

        if (res.success) {
          // Update local states
          if (nextState) {
            // Promoted to volunteer
            const targetReg = registrations.find((r) => r.studentId === studentId);
            if (targetReg) {
              const newVol: VolunteerMember = {
                registrationId: targetReg.registrationId,
                studentId: targetReg.studentId,
                eventId,
                eventRole: "volunteer",
                status: targetReg.status as any,
                name: targetReg.name,
                email: targetReg.email,
                rollNumber: targetReg.rollNumber,
                department: targetReg.department,
                attendanceStatus: "NOT_MARKED",
              };
              setVolunteers((prev) => [...prev.filter((v) => v.studentId !== studentId), newVol]);
            }
          } else {
            // Revoked volunteer status
            setVolunteers((prev) => prev.filter((v) => v.studentId !== studentId));
          }

          setRegistrations((prev) =>
            prev.map((r) => (r.studentId === studentId ? { ...r, eventRole: nextState ? "volunteer" : "participant" } : r))
          );
        }
      } catch (err: any) {
        setError(err.message || "Failed to update volunteer status.");
      }
    });
  };

  const filteredVolunteers = volunteers.filter((v) => {
    const q = search.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q) ||
      (v.rollNumber && v.rollNumber.toLowerCase().includes(q)) ||
      (v.department && v.department.toLowerCase().includes(q))
    );
  });

  const availableParticipants = registrations.filter((r) => {
    const isAlreadyVol = r.eventRole === "volunteer";
    if (isAlreadyVol) return false;
    const q = assignSearch.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      (r.rollNumber && r.rollNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4">
        <div>
          <div className="flex items-center gap-2">
            <Heart size={16} className="text-primary" />
            <h3 className="font-heading text-lg font-bold text-foreground">
              Event Volunteer Management
            </h3>
          </div>
          <p className="font-mono text-xs text-muted-foreground mt-0.5">
            Total Volunteers Assigned: {volunteers.length}
          </p>
        </div>

        {isAdmin && (
          <Button
            onClick={() => setShowAssignModal(true)}
            className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider rounded-none h-9 px-4 shadow-none hover:bg-primary-container"
          >
            <Plus size={14} className="mr-1.5" />
            Assign Volunteer
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-none border-destructive bg-destructive/5 text-destructive font-mono text-xs uppercase">
          <AlertCircle size={14} className="mr-2 shrink-0" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filter Bar */}
      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search volunteers by name, roll number, or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-surface-container-low border border-border pl-9 py-2 font-mono text-xs rounded-none shadow-none h-9"
        />
      </div>

      {/* Volunteers Table */}
      <div className="border border-border bg-card">
        <div className="hidden md:grid grid-cols-12 border-b border-border bg-surface-container px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
          <div className="col-span-3">Volunteer Name</div>
          <div className="col-span-2">Register No.</div>
          <div className="col-span-2">Department</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2 text-right">Attendance / Action</div>
        </div>

        {filteredVolunteers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground font-mono text-xs uppercase">
            No assigned volunteers found for this event.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredVolunteers.map((v) => (
              <div
                key={v.studentId}
                className="flex flex-col md:grid md:grid-cols-12 gap-2 px-4 py-3 font-mono text-xs items-start md:items-center hover:bg-surface-container-low/50"
              >
                <div className="md:col-span-3 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <UserCheck size={14} />
                  </div>
                  <div>
                    <span className="font-sans font-bold text-foreground block">{v.name}</span>
                    <span className="text-[9px] text-primary uppercase font-bold tracking-widest">VOLUNTEER</span>
                  </div>
                </div>

                <div className="md:col-span-2 text-muted-foreground">
                  {v.rollNumber || "N/A"}
                </div>

                <div className="md:col-span-2 text-muted-foreground">
                  {v.department || "N/A"}
                </div>

                <div className="md:col-span-3 text-muted-foreground truncate">
                  {v.email}
                </div>

                <div className="md:col-span-2 text-right flex items-center justify-end gap-2 w-full md:w-auto">
                  <span
                    className={`px-2 py-0.5 text-[9px] uppercase font-semibold border ${
                      v.attendanceStatus === "PRESENT"
                        ? "bg-primary/10 text-primary border-primary/30"
                        : v.attendanceStatus === "ABSENT"
                        ? "bg-destructive/10 text-destructive border-destructive/30"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {v.attendanceStatus === "NOT_MARKED" ? "UNMARKED" : v.attendanceStatus}
                  </span>

                  {isAdmin && (
                    <button
                      onClick={() => handleToggleVolunteer(v.studentId, true)}
                      disabled={isPending}
                      className="p-1 text-destructive hover:bg-destructive/10 border border-destructive/20 rounded-none transition-colors disabled:opacity-50 cursor-pointer"
                      title="Remove Volunteer Status"
                    >
                      <UserMinus size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Volunteer Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-surface-container px-6 py-4 border-b border-border flex justify-between items-center">
              <div>
                <h4 className="font-heading font-bold text-foreground text-sm uppercase">Assign Volunteer</h4>
                <p className="font-mono text-[10px] text-muted-foreground">
                  Select a registered attendee to assign as event volunteer
                </p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-muted-foreground hover:text-foreground font-mono text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search registered attendees..."
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  className="bg-surface-container-low border border-border pl-9 py-2 font-mono text-xs rounded-none shadow-none h-9"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border p-2">
              {availableParticipants.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground font-mono text-xs uppercase">
                  No eligible registered participants found to assign as volunteer.
                </div>
              ) : (
                availableParticipants.map((reg) => (
                  <div
                    key={reg.studentId}
                    className="p-3 flex items-center justify-between hover:bg-surface-container-low transition-colors"
                  >
                    <div>
                      <span className="font-sans font-bold text-foreground block text-xs">{reg.name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {reg.rollNumber || reg.email}
                      </span>
                    </div>

                    <Button
                      onClick={() => {
                        handleToggleVolunteer(reg.studentId, false);
                      }}
                      disabled={isPending}
                      className="bg-primary text-primary-foreground font-mono text-[10px] uppercase h-7 px-3 rounded-none shadow-none"
                    >
                      Assign Volunteer
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="bg-surface-container px-6 py-3 border-t border-border flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowAssignModal(false)}
                className="font-mono text-xs uppercase rounded-none h-8"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
