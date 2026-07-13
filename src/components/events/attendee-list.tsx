"use client";

import React from "react";

interface User {
  id: string;
  name: string;
  email: string;
  rollNumber: string | null;
}

interface Registration {
  id: string;
  status: "REGISTERED" | "CANCELLED" | "WAITLISTED";
  createdAt: Date;
  student: User;
}

interface AttendeeListProps {
  registrations: Registration[];
}

export default function AttendeeList({ registrations }: AttendeeListProps) {
  const confirmed = registrations.filter((r) => r.status === "REGISTERED");
  const waitlisted = registrations.filter((r) => r.status === "WAITLISTED");

  return (
    <div className="space-y-8">
      {/* Confirmed registrations */}
      <div className="space-y-3">
        <div className="flex justify-between items-end border-b border-border pb-1">
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-semibold">Confirmed Attendees</h3>
          <span className="font-mono text-[10px] bg-surface-container px-2 py-0.5 border border-border">{confirmed.length} RECORDS</span>
        </div>

        {confirmed.length === 0 ? (
          <div className="border border-border p-6 text-center text-muted-foreground font-mono text-xs uppercase bg-card">
            No confirmed registrations.
          </div>
        ) : (
          <div className="border border-border bg-card overflow-hidden">
            <div className="hidden sm:grid grid-cols-12 bg-surface-container px-4 py-2 border-b border-border font-mono text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
              <div className="col-span-5">Student Name</div>
              <div className="col-span-4">Roll Number</div>
              <div className="col-span-3 text-right">Confirmed Date</div>
            </div>
            <div className="divide-y divide-border font-mono text-xs">
              {confirmed.map((reg) => (
                <div key={reg.id} className="flex flex-col sm:grid sm:grid-cols-12 px-4 py-3 gap-1 sm:gap-0 sm:items-center hover:bg-surface-container-low/50">
                  <div className="sm:col-span-5 pr-2 font-sans font-semibold text-foreground">{reg.student.name}</div>
                  <div className="sm:col-span-4 text-muted-foreground">
                    <span className="inline sm:hidden text-muted-foreground/60 text-[9px] uppercase font-bold mr-1 font-mono">Roll:</span>
                    {reg.student.rollNumber || "N/A"}
                  </div>
                  <div className="sm:col-span-3 sm:text-right text-muted-foreground">
                    <span className="inline sm:hidden text-muted-foreground/60 text-[9px] uppercase font-bold mr-1 font-mono">RSVP Date:</span>
                    {new Date(reg.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Waitlist queue */}
      <div className="space-y-3">
        <div className="flex justify-between items-end border-b border-border pb-1">
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-semibold">Waitlisted Queue</h3>
          <span className="font-mono text-[10px] bg-surface-container px-2 py-0.5 border border-border">{waitlisted.length} RECORDS</span>
        </div>

        {waitlisted.length === 0 ? (
          <div className="border border-border p-6 text-center text-muted-foreground font-mono text-xs uppercase bg-card">
            No students currently waitlisted.
          </div>
        ) : (
          <div className="border border-border bg-card overflow-hidden">
            <div className="hidden sm:grid grid-cols-12 bg-surface-container px-4 py-2 border-b border-border font-mono text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
              <div className="col-span-1">Pos</div>
              <div className="col-span-5">Student Name</div>
              <div className="col-span-4">Roll Number</div>
              <div className="col-span-2 text-right">Requested Date</div>
            </div>
            <div className="divide-y divide-border font-mono text-xs">
              {waitlisted.map((reg, idx) => (
                <div key={reg.id} className="flex flex-col sm:grid sm:grid-cols-12 px-4 py-3 gap-1 sm:gap-0 sm:items-center hover:bg-surface-container-low/50">
                  <div className="flex items-center gap-2 sm:col-span-6">
                    <span className="font-bold text-primary sm:w-8">#{idx + 1}</span>
                    <span className="font-sans font-semibold text-foreground">{reg.student.name}</span>
                  </div>
                  <div className="sm:col-span-4 text-muted-foreground pl-6 sm:pl-0">
                    <span className="inline sm:hidden text-muted-foreground/60 text-[9px] uppercase font-bold mr-1 font-mono">Roll:</span>
                    {reg.student.rollNumber || "N/A"}
                  </div>
                  <div className="sm:col-span-2 sm:text-right text-muted-foreground pl-6 sm:pl-0">
                    <span className="inline sm:hidden text-muted-foreground/60 text-[9px] uppercase font-bold mr-1 font-mono">Waitlisted:</span>
                    {new Date(reg.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
