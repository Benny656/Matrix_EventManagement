"use client";

import React, { useState, useTransition } from "react";
import { updateEventRegistrationStatusAction } from "@/actions/event";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock, Unlock, Loader2 } from "lucide-react";

interface EditRegistrationStatusFormProps {
  eventId: string;
  initialRegistrationOpen: boolean;
}

export default function EditRegistrationStatusForm({ eventId, initialRegistrationOpen }: EditRegistrationStatusFormProps) {
  const [isOpen, setIsOpen] = useState(initialRegistrationOpen);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    const nextState = !isOpen;
    setError(null);

    startTransition(async () => {
      try {
        const res = await updateEventRegistrationStatusAction(eventId, nextState);
        if (res.success) {
          setIsOpen(nextState);
        }
      } catch (err: any) {
        setError(err.message || "Failed to update registration status");
      }
    });
  };

  return (
    <div className="border border-border p-6 bg-card space-y-4">
      <div className="flex justify-between items-center border-b border-border pb-2">
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          Registration Status
        </h3>
        <span
          className={`px-2 py-0.5 font-mono text-[9px] uppercase font-bold border ${
            isOpen
              ? "bg-primary/10 text-primary border-primary/30"
              : "bg-destructive/10 text-destructive border-destructive/30"
          }`}
        >
          {isOpen ? "OPEN" : "CLOSED"}
        </span>
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-none border-destructive bg-destructive/5 text-destructive font-mono text-xs uppercase p-3">
          <AlertCircle size={14} className="mr-2 shrink-0" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between gap-4 pt-1">
        <p className="font-sans text-xs text-muted-foreground leading-relaxed">
          {isOpen
            ? "Students can currently register for this event."
            : "Registrations are locked. New students cannot register."}
        </p>

        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`shrink-0 font-mono text-[10px] uppercase font-bold tracking-wider px-3.5 py-2.5 flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-60 cursor-pointer active:scale-95 ${
            isOpen
              ? "bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {isPending ? (
            <>
              <Loader2 size={13} className="animate-spin shrink-0" />
              <span>Updating...</span>
            </>
          ) : isOpen ? (
            <>
              <Lock size={13} className="shrink-0" />
              <span>Close Registration</span>
            </>
          ) : (
            <>
              <Unlock size={13} className="shrink-0" />
              <span>Open Registration</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
