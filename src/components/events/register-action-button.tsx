"use client";

import React, { useState, useTransition, useOptimistic } from "react";
import { registerForEventAction, cancelRegistrationAction } from "@/actions/registration";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface RegisterActionButtonProps {
  eventId: string;
  initialStatus: "REGISTERED" | "CANCELLED" | "WAITLISTED" | null;
  isFull: boolean;
  isRegistrationOpen: boolean;
}

export default function RegisterActionButton({
  eventId,
  initialStatus,
  isFull,
  isRegistrationOpen,
}: RegisterActionButtonProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredWhatsappLink, setRegisteredWhatsappLink] = useState<string | null>(null);

  // Optimistic status updates
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    status,
    (state, nextStatus: "REGISTERED" | "CANCELLED" | "WAITLISTED" | null) => nextStatus
  );

  const handleRegister = async () => {
    setError(null);
    startTransition(async () => {
      const nextStatus = isFull ? "WAITLISTED" : "REGISTERED";
      setOptimisticStatus(nextStatus);
      try {
        const res = await registerForEventAction(eventId);
        if (res.success) {
          setStatus(res.status as any);
          if (res.status === "REGISTERED") {
            setRegisteredWhatsappLink(res.whatsappInviteLink || null);
            setShowSuccessModal(true);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to register");
      }
    });
  };

  const handleCancel = async () => {
    setError(null);
    if (!confirm("Are you sure you want to cancel your registration?")) return;

    startTransition(async () => {
      setOptimisticStatus("CANCELLED");
      try {
        const res = await cancelRegistrationAction(eventId);
        if (res.success) {
          setStatus("CANCELLED");
        }
      } catch (err: any) {
        setError(err.message || "Failed to cancel");
      }
    });
  };

  if (!isRegistrationOpen && optimisticStatus !== "REGISTERED" && optimisticStatus !== "WAITLISTED") {
    return (
      <div className="border border-border p-4 bg-surface-container text-center font-mono text-xs uppercase text-muted-foreground">
        Registration is closed.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="rounded-none border-destructive bg-destructive/5 text-destructive font-mono text-xs uppercase">
          <AlertCircle size={14} className="mr-2 shrink-0" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {optimisticStatus === "REGISTERED" && (
        <div className="space-y-3">
          <div className="border border-tertiary bg-tertiary/5 text-tertiary p-4 font-mono text-xs uppercase text-center">
            Registration Status: Confirmed / Registered
          </div>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
            className="w-full border-destructive text-destructive font-mono text-xs uppercase tracking-wider py-6 hover:bg-destructive/5 active:scale-98 transition-all rounded-none h-11 shadow-none"
          >
            Cancel Registration Record
          </Button>
        </div>
      )}

      {optimisticStatus === "WAITLISTED" && (
        <div className="space-y-3">
          <div className="border border-primary bg-primary/5 text-primary p-4 font-mono text-xs uppercase text-center font-bold">
            Registration Status: Waitlisted
          </div>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
            className="w-full border-destructive text-destructive font-mono text-xs uppercase tracking-wider py-6 hover:bg-destructive/5 active:scale-98 transition-all rounded-none h-11 shadow-none"
          >
            Cancel Waitlist Record
          </Button>
        </div>
      )}

      {(optimisticStatus === null || optimisticStatus === "CANCELLED") && (
        <Button
          onClick={handleRegister}
          disabled={isPending}
          className="w-full bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest py-6 hover:bg-primary-container active:scale-98 transition-all rounded-none h-11 shadow-none"
        >
          {isPending
            ? "Submitting…"
            : isFull
            ? "Join waitlist"
            : "Register"}
        </Button>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-md w-full p-6 space-y-4 shadow-xl rounded-none">
            <div className="space-y-1">
              <h3 className="font-heading text-xl font-bold text-foreground">
                Registration Successful!
              </h3>
              <p className="font-sans text-sm text-muted-foreground">
                You have successfully registered for this event.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
              {registeredWhatsappLink ? (
                <a
                  href={registeredWhatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-mono text-xs uppercase tracking-wider rounded-none h-10 shadow-none">
                    Join WhatsApp Group
                  </Button>
                </a>
              ) : null}
              <Button
                variant="outline"
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 border-border font-mono text-xs uppercase tracking-wider rounded-none h-10 shadow-none"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
