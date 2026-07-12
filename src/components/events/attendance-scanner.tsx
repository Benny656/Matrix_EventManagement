"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import { markAttendanceAction, overrideWaitlistAction } from "@/actions/attendance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, TriangleAlert } from "lucide-react";

interface ActiveSession {
  id: string;
  title: string;
  venue: string;
  event: {
    title: string;
  };
}

interface AttendanceScannerProps {
  sessions: ActiveSession[];
}

export default function AttendanceScanner({ sessions }: AttendanceScannerProps) {
  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.id || "");
  const [manualRollNumber, setManualRollNumber] = useState("");
  const [isPending, startTransition] = useTransition();

  // Scan Alerts State
  const [scanResult, setScanResult] = useState<{
    type: "SUCCESS" | "WARNING" | "ERROR";
    message: string;
    studentName?: string;
    studentId?: string;
  } | null>(null);

  // Scanner container ref
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !selectedSessionId) return;

    // Dynamically import html5-qrcode
    let html5QrcodeScanner: any;
    import("html5-qrcode").then((lib) => {
      html5QrcodeScanner = new lib.Html5QrcodeScanner(
        "qr-reader-viewport",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
        },
        /* verbose= */ false
      );

      const onScanSuccess = (decodedText: string) => {
        // Stop scanning temporarily
        html5QrcodeScanner.clear().catch(console.error);

        // Process QR code (usually contains the student's roll number)
        triggerCheckIn(decodedText, "SCANNED");
      };

      const onScanFailure = (error: any) => {
        // Silence noise warnings
      };

      html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    }).catch(console.error);

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch((err: any) => console.warn("Failed to clear QR reader: ", err));
      }
    };
  }, [selectedSessionId]);

  const triggerCheckIn = (rollNumber: string, method: "SCANNED" | "MANUAL") => {
    setScanResult(null);
    if (!selectedSessionId) {
      setScanResult({ type: "ERROR", message: "Please select an active session block first." });
      return;
    }

    startTransition(async () => {
      try {
        const result = await markAttendanceAction({
          sessionId: selectedSessionId,
          rollNumber: rollNumber.trim(),
          method,
        });

        if (result.success) {
          setScanResult({
            type: "SUCCESS",
            message: result.message,
            studentName: result.studentName,
          });
          setManualRollNumber("");
        } else {
          setScanResult({
            type: result.error === "WAITLISTED" ? "WARNING" : "ERROR",
            message: result.message || "An unknown error occurred.",
            studentName: result.studentName,
            studentId: result.studentId,
          });
        }
      } catch (err: any) {
        setScanResult({
          type: "ERROR",
          message: err.message || "Attendance system request failed.",
        });
      }
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRollNumber.trim()) return;
    triggerCheckIn(manualRollNumber, "MANUAL");
  };

  const handleOverride = async () => {
    if (!scanResult?.studentId || !selectedSessionId) return;

    startTransition(async () => {
      try {
        const res = await overrideWaitlistAction({
          sessionId: selectedSessionId,
          studentId: scanResult.studentId!,
        });

        if (res.success) {
          setScanResult({
            type: "SUCCESS",
            message: `${scanResult.studentName} promoted from Waitlist and Checked-In successfully!`,
            studentName: scanResult.studentName,
          });
          setManualRollNumber("");
        }
      } catch (err: any) {
        setScanResult({
          type: "ERROR",
          message: err.message || "Waitlist override failed.",
        });
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto pb-12">
      {/* Session Selection & Status Alerts (4 columns) */}
      <div className="lg:col-span-4 space-y-6">
        <div className="border border-border p-6 bg-card space-y-4">
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground border-b border-border pb-1 font-semibold">
            Select Active Block
          </h3>

          <div className="flex flex-col gap-1">
            <Label className="font-mono text-[10px] text-muted-foreground uppercase" htmlFor="session-select">Session</Label>
            <select
              id="session-select"
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full bg-background border border-border text-foreground px-3 py-3 font-mono text-xs focus:border-primary focus:border-2 focus:outline-none transition-all rounded-none"
            >
              {sessions.length === 0 ? (
                <option value="">No Active Sessions Available</option>
              ) : (
                sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.event.title.slice(0, 15)}...] {s.title}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Scan Status Alerts */}
        {scanResult && (
          <div className="space-y-3">
            {scanResult.type === "SUCCESS" && (
              <Alert className="rounded-none border-tertiary bg-tertiary/5 text-tertiary font-mono text-xs uppercase">
                <CheckCircle2 size={14} className="mr-2 shrink-0" />
                <div>
                  <AlertTitle className="font-bold tracking-wide">CHECK-IN CONFIRMED</AlertTitle>
                  <AlertDescription className="mt-1">{scanResult.message}</AlertDescription>
                </div>
              </Alert>
            )}

            {scanResult.type === "ERROR" && (
              <Alert variant="destructive" className="rounded-none border-destructive bg-destructive/5 text-destructive font-mono text-xs uppercase">
                <AlertCircle size={14} className="mr-2 shrink-0" />
                <div>
                  <AlertTitle className="font-bold tracking-wide">ACCESS DENIED</AlertTitle>
                  <AlertDescription className="mt-1">{scanResult.message}</AlertDescription>
                </div>
              </Alert>
            )}

            {scanResult.type === "WARNING" && (
              <Alert className="rounded-none border-primary bg-primary/5 text-primary font-mono text-xs uppercase">
                <TriangleAlert size={14} className="mr-2 shrink-0" />
                <div>
                  <AlertTitle className="font-bold tracking-wide">WAITLISTED WARNING</AlertTitle>
                  <AlertDescription className="mt-1">{scanResult.message}</AlertDescription>
                  <Button
                    onClick={handleOverride}
                    disabled={isPending}
                    className="mt-3 bg-primary text-primary-foreground font-mono text-[10px] py-1.5 px-3 h-8 hover:bg-primary-container active:scale-95 transition-all shadow-none rounded-none w-full"
                  >
                    Confirm Override & Check-in
                  </Button>
                </div>
              </Alert>
            )}
          </div>
        )}
      </div>

      {/* Camera Viewport & Manual Form (8 columns) */}
      <div className="lg:col-span-8 space-y-6">
        {/* QR Viewport */}
        <div className="border border-border bg-card p-6 space-y-4">
          <div className="border-b border-border pb-3 bg-surface-container -mx-6 px-6 -mt-6 flex justify-between items-center">
            <span className="font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Camera Scanner</span>
            <span className="font-mono text-[10px] text-muted-foreground uppercase">ID Scanner</span>
          </div>

          <div className="bg-surface-container-low border border-border p-4 flex flex-col items-center justify-center min-h-[300px]">
            <div id="qr-reader-viewport" className="w-full max-w-md overflow-hidden bg-black aspect-square border border-border"></div>
            <p className="font-sans text-[11px] text-muted-foreground text-center mt-3">
              Position the student ID barcode / QR code within the highlighted viewfinder frame.
            </p>
          </div>
        </div>

        {/* Manual Fallback Form */}
        <div className="border border-border bg-card p-6 space-y-4">
          <div className="border-b border-border pb-3 bg-surface-container -mx-6 px-6 -mt-6">
            <span className="font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Manual Entry Fallback</span>
          </div>

          <form onSubmit={handleManualSubmit} className="flex gap-4 items-end">
            <div className="flex-1 flex flex-col gap-1">
              <Label className="font-mono text-[10px] text-muted-foreground uppercase" htmlFor="roll-input">Student Roll Number</Label>
              <Input
                id="roll-input"
                className="w-full bg-background border border-border text-foreground px-3 py-5 font-mono text-sm focus-visible:ring-1 focus-visible:ring-primary rounded-none shadow-none h-10"
                placeholder="e.g. Kits1248"
                value={manualRollNumber}
                onChange={(e) => setManualRollNumber(e.target.value)}
                disabled={isPending}
              />
            </div>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-secondary text-secondary-foreground font-mono text-xs uppercase tracking-widest py-5 px-6 hover:opacity-90 active:scale-95 transition-all h-10 rounded-none shadow-none"
            >
              Verify Check-in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
