"use client";

import React, { useState, useTransition, useOptimistic } from "react";
import { registerForEventAction, cancelRegistrationAction } from "@/actions/registration";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

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

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const confirmAndRegister = async () => {
    setError(null);
    startTransition(async () => {
      setOptimisticStatus("REGISTERED");
      try {
        const res = await registerForEventAction(eventId);
        if (res.success) {
          setStatus(res.status as any);
          setShowConfirmModal(false);
          if (res.status === "REGISTERED") {
            setRegisteredWhatsappLink(res.whatsappInviteLink || null);
            setShowSuccessModal(true);
          }
        } else {
          setShowConfirmModal(false);
        }
      } catch (err: any) {
        setShowConfirmModal(false);
        setError(err.message || "Failed to register");
      }
    });
  };

  if (!isRegistrationOpen && optimisticStatus !== "REGISTERED") {
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
        <div className="space-y-2">
          <div className="border border-tertiary bg-tertiary/5 text-tertiary p-4 font-mono text-xs uppercase text-center font-bold">
            Registration Status: Confirmed / Registered
          </div>
          <p className="font-mono text-[10px] text-muted-foreground text-center uppercase">
            Registrations are final and cannot be cancelled.
          </p>
        </div>
      )}

      {(optimisticStatus === null || optimisticStatus === "CANCELLED") && (
        isFull ? null : (
          <Button
            onClick={() => setShowConfirmModal(true)}
            disabled={isPending}
            className="w-full bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest py-6 hover:bg-primary-container active:scale-98 transition-all rounded-none h-11 shadow-none cursor-pointer"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin shrink-0 text-primary-foreground" />
                <span>Submitting...</span>
              </span>
            ) : (
              "Register"
            )}
          </Button>
        )
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-md w-full p-6 space-y-4 shadow-xl rounded-none">
            {isPending ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <Loader2 size={48} className="animate-spin text-primary" />
                <h3 className="font-heading text-xl font-bold text-foreground text-center uppercase tracking-wider">
                  Wait, you are not done...
                </h3>
                <p className="font-sans text-sm text-muted-foreground text-center">
                  Processing your registration. Please do not close this window.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <h3 className="font-heading text-xl font-bold text-foreground">
                    Confirm Registration
                  </h3>
                  <div className="border border-destructive/30 bg-destructive/5 text-destructive p-3 font-mono text-xs uppercase">
                    <span className="font-bold block mb-1">Important Notice:</span>
                    Once registered, you cannot cancel your registration.
                  </div>
                  <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                    Are you sure you want to proceed with registering for this event?
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmModal(false)}
                    disabled={isPending}
                    className="flex-1 border-border font-mono text-xs uppercase tracking-wider rounded-none h-10 shadow-none"
                  >
                    Go Back
                  </Button>
                  <Button
                    onClick={confirmAndRegister}
                    disabled={isPending}
                    className="flex-1 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider rounded-none h-10 shadow-none"
                  >
                    Confirm & Register
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
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
