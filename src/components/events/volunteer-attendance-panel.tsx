"use client";

import React, { useState, useTransition } from "react";
import { VolunteerMember, markVolunteerAttendanceAction } from "@/actions/volunteer-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle2, XCircle, Clock, AlertCircle, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VolunteerAttendancePanelProps {
  eventId: string;
  initialVolunteers: VolunteerMember[];
  readOnly?: boolean;
}

export default function VolunteerAttendancePanel({
  eventId,
  initialVolunteers,
  readOnly = false,
}: VolunteerAttendancePanelProps) {
  const [volunteers, setVolunteers] = useState<VolunteerMember[]>(initialVolunteers);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "PRESENT" | "ABSENT" | "NOT_MARKED">("ALL");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleMarkAttendance = (volunteerId: string, status: "PRESENT" | "ABSENT") => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await markVolunteerAttendanceAction({
          eventId,
          volunteerId,
          status,
        });

        if (res.success) {
          const now = new Date().toISOString();
          setVolunteers((prev) =>
            prev.map((v) =>
              v.studentId === volunteerId
                ? {
                    ...v,
                    attendanceStatus: status,
                    markedAt: now,
                  }
                : v
            )
          );
        }
      } catch (err: any) {
        setError(err.message || "Failed to mark volunteer attendance.");
      }
    });
  };

  const filteredVolunteers = volunteers.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase()) ||
      (v.rollNumber && v.rollNumber.toLowerCase().includes(search.toLowerCase())) ||
      (v.department && v.department.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter =
      filter === "ALL"
        ? true
        : filter === "NOT_MARKED"
        ? v.attendanceStatus === "NOT_MARKED"
        : v.attendanceStatus === filter;

    return matchesSearch && matchesFilter;
  });

  const presentCount = volunteers.filter((v) => v.attendanceStatus === "PRESENT").length;
  const absentCount = volunteers.filter((v) => v.attendanceStatus === "ABSENT").length;
  const unmarkedCount = volunteers.filter((v) => v.attendanceStatus === "NOT_MARKED").length;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="border border-border bg-card p-4">
          <div className="font-mono text-[10px] text-muted-foreground mb-1 uppercase">Total Volunteers</div>
          <div className="font-heading text-2xl font-bold text-foreground">{volunteers.length}</div>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="font-mono text-[10px] text-muted-foreground mb-1 uppercase">Present</div>
          <div className="font-heading text-2xl font-bold text-primary">{presentCount}</div>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="font-mono text-[10px] text-muted-foreground mb-1 uppercase">Absent</div>
          <div className="font-heading text-2xl font-bold text-destructive">{absentCount}</div>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="font-mono text-[10px] text-muted-foreground mb-1 uppercase">Unmarked</div>
          <div className="font-heading text-2xl font-bold text-muted-foreground">{unmarkedCount}</div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-none border-destructive bg-destructive/5 text-destructive font-mono text-xs uppercase">
          <AlertCircle size={14} className="mr-2 shrink-0" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Controls / Filter Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search volunteers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-surface-container-low border border-border pl-9 py-2 font-mono text-xs rounded-none shadow-none h-9"
          />
        </div>

        <div className="flex border border-border">
          {(["ALL", "PRESENT", "ABSENT", "NOT_MARKED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:bg-surface-container-low"
              }`}
            >
              {f === "NOT_MARKED" ? "UNMARKED" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Volunteer Attendance Table */}
      <div className="border border-border bg-card">
        <div className={`hidden md:grid ${readOnly ? "grid-cols-10" : "grid-cols-12"} border-b border-border bg-surface-container px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-bold`}>
          <div className="col-span-3">Volunteer Name</div>
          <div className="col-span-2">Register No.</div>
          <div className="col-span-2">Department</div>
          <div className="col-span-3">Attendance Audit</div>
          {!readOnly && <div className="col-span-2 text-right">Mark Attendance</div>}
        </div>

        {filteredVolunteers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground font-mono text-xs uppercase">
            No assigned volunteers found for this filter.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredVolunteers.map((v) => {
              const markedAtStr = v.markedAt
                ? new Date(v.markedAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                : null;

              return (
                <div
                  key={v.studentId}
                  className={`flex flex-col md:grid ${readOnly ? "grid-cols-10" : "grid-cols-12"} gap-3 md:gap-2 px-4 py-3 font-mono text-xs items-start md:items-center hover:bg-surface-container-low/50`}
                >
                  <div className="md:col-span-3">
                    <span className="font-sans font-bold text-foreground block">{v.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate block">{v.email}</span>
                  </div>

                  <div className="md:col-span-2 text-muted-foreground">
                    {v.rollNumber || "N/A"}
                  </div>

                  <div className="md:col-span-2 text-muted-foreground">
                    {v.department || "N/A"}
                  </div>

                  <div className="md:col-span-3 text-[10px] text-muted-foreground">
                    {v.attendanceStatus !== "NOT_MARKED" ? (
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground uppercase">{v.attendanceStatus}</span>
                        {markedAtStr && (
                          <span className="flex items-center gap-1 mt-0.5">
                            <Clock size={10} /> {markedAtStr} {v.markedByName ? `by ${v.markedByName}` : ""}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="italic text-muted-foreground">Not Marked Yet</span>
                    )}
                  </div>

                  {!readOnly && (
                    <div className="md:col-span-2 text-right flex items-center justify-end gap-2 w-full md:w-auto">
                      <button
                        onClick={() => handleMarkAttendance(v.studentId, "PRESENT")}
                        disabled={isPending}
                        className={`px-3 py-1 font-mono text-[10px] uppercase font-bold border transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1 ${
                          v.attendanceStatus === "PRESENT"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        <CheckCircle2 size={12} />
                        <span>Present</span>
                      </button>

                      <button
                        onClick={() => handleMarkAttendance(v.studentId, "ABSENT")}
                        disabled={isPending}
                        className={`px-3 py-1 font-mono text-[10px] uppercase font-bold border transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1 ${
                          v.attendanceStatus === "ABSENT"
                            ? "bg-destructive text-destructive-foreground border-destructive"
                            : "bg-background text-foreground border-border hover:border-destructive/50"
                        }`}
                      >
                        <XCircle size={12} />
                        <span>Absent</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
