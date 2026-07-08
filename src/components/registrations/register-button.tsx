"use client";

import { useState } from "react";
import { toast } from "sonner";
import { registerForEvent, cancelRegistration } from "@/actions/registration.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generateRegistrationQR } from "@/lib/qr";
import { Loader2, QrCode, UserCheck, UserX } from "lucide-react";
import Image from "next/image";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface RegisterButtonProps {
  eventId: string;
  isRegistered: boolean;
  isFull: boolean;
  deadlinePassed: boolean;
  registrationId?: string;
  qrCode?: string;
}

export function RegisterButton({
  eventId,
  isRegistered,
  isFull,
  deadlinePassed,
  registrationId,
  qrCode,
}: RegisterButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const handleRegister = async () => {
    setIsLoading(true);
    const result = await registerForEvent(eventId);
    if (result.success) {
      toast.success("Registered successfully!");
      setQrDataUrl(result.data.qrDataUrl);
      setShowQR(true);
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
  };

  const handleShowQR = async () => {
    if (qrCode) {
      const dataUrl = await generateRegistrationQR(qrCode);
      setQrDataUrl(dataUrl);
      setShowQR(true);
    }
  };

  const handleCancel = async () => {
    if (!registrationId) return;
    const result = await cancelRegistration(registrationId);
    if (result.success) {
      toast.success("Registration cancelled");
      window.location.reload();
    } else {
      toast.error(result.error);
    }
  };

  if (isRegistered) {
    return (
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleShowQR}>
          <QrCode className="mr-2 h-4 w-4" />
          Show QR Code
        </Button>
        <Button variant="destructive" onClick={() => setShowCancel(true)}>
          <UserX className="mr-2 h-4 w-4" />
          Cancel Registration
        </Button>

        {/* QR Dialog */}
        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogContent className="sm:max-w-[350px]">
            <DialogHeader>
              <DialogTitle>Your Registration QR Code</DialogTitle>
            </DialogHeader>
            {qrDataUrl && (
              <div className="flex flex-col items-center gap-3 pt-2">
                <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
                <p className="text-xs text-muted-foreground text-center">
                  Show this QR code to the volunteer at the event entrance
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={showCancel}
          onOpenChange={setShowCancel}
          title="Cancel Registration"
          description="Are you sure you want to cancel your registration for this event? You may not be able to re-register if the event is full."
          onConfirm={handleCancel}
          confirmLabel="Cancel Registration"
        />
      </div>
    );
  }

  if (isFull || deadlinePassed) {
    return (
      <Button disabled>
        {isFull ? "Event Full" : "Registration Closed"}
      </Button>
    );
  }

  return (
    <>
      <Button onClick={handleRegister} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <UserCheck className="mr-2 h-4 w-4" />
        )}
        Register for Event
      </Button>

      {/* QR Dialog after registration */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Registration Confirmed! 🎉</DialogTitle>
          </DialogHeader>
          {qrDataUrl && (
            <div className="flex flex-col items-center gap-3 pt-2">
              <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
              <p className="text-xs text-muted-foreground text-center">
                Save this QR code. Show it to the volunteer at the event entrance to mark your attendance.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
