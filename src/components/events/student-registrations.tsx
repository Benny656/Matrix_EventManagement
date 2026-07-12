"use client";

import React, { useState, useTransition } from "react";
import { cancelRegistrationAction } from "@/actions/registration";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RegistrationWithEvent {
  id: string;
  status: "REGISTERED" | "CANCELLED" | "WAITLISTED";
  createdAt: Date;
  event: {
    id: string;
    title: string;
    description: string;
    venue: string;
    date: Date;
    category: string;
  };
}

export default function StudentRegistrations({ initialRegistrations }: { initialRegistrations: RegistrationWithEvent[] }) {
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const activeRegistrations = registrations.filter((r) => r.status !== "CANCELLED");

  const handleCancel = async (eventId: string) => {
    setError(null);
    if (!confirm("Are you sure you want to cancel your registration? This action will promote the next student on the waitlist.")) return;

    startTransition(async () => {
      try {
        const res = await cancelRegistrationAction(eventId);
        if (res.success) {
          // Mark as CANCELLED in local state
          setRegistrations((prev) =>
            prev.map((r) =>
              r.event.id === eventId ? { ...r, status: "CANCELLED" as const } : r
            )
          );
        }
      } catch (err: any) {
        setError(err.message || "Failed to cancel registration");
      }
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="rounded-none border-destructive bg-destructive/5 text-destructive font-mono text-xs uppercase">
          <span className="material-symbols-outlined text-[16px] mr-2">error</span>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {activeRegistrations.length === 0 ? (
        <div className="border border-border p-12 text-center text-muted-foreground font-mono text-xs uppercase bg-card">
          No active registrations or waitlisted events found.
        </div>
      ) : (
        <div className="space-y-4">
          {activeRegistrations.map((reg) => {
            const dateStr = new Date(reg.event.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div key={reg.id} className="border border-border bg-card p-0 hover:border-primary transition-all duration-200">
                <div className="flex items-stretch">
                  <div className={`w-1 ${reg.status === "REGISTERED" ? "bg-tertiary" : "bg-primary"}`}></div>
                  <div className="p-4 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{reg.event.category}</span>
                        <span className={`px-2 py-[2px] font-mono text-[9px] uppercase font-semibold border ${
                          reg.status === "REGISTERED"
                            ? "bg-tertiary/10 text-tertiary border-tertiary/20"
                            : "bg-primary/10 text-primary border-primary/20"
                        }`}>
                          {reg.status}
                        </span>
                      </div>
                      <h3 className="font-heading text-base font-bold text-foreground">{reg.event.title}</h3>
                      <p className="font-mono text-xs text-muted-foreground mt-1">
                        Venue: {reg.event.venue} • Date: {dateStr}
                      </p>
                    </div>

                    <div>
                      <Button
                        variant="outline"
                        onClick={() => handleCancel(reg.event.id)}
                        disabled={isPending}
                        className="border-destructive text-destructive font-mono text-[11px] uppercase tracking-wider py-2 px-4 hover:bg-destructive/5 active:scale-95 transition-all h-9 rounded-none shadow-none"
                      >
                        Cancel registration
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
