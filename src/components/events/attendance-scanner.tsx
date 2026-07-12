"use client";

import React, { useEffect, useRef, useState, useTransition, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import {
  overrideWaitlistAction,
  markAttendanceByScan,
  markAttendanceManual,
  getRegisteredStudentsAction,
  getSessionCheckInCountAction
} from "@/actions/attendance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle2,
  AlertCircle,
  TriangleAlert,
  ScanLine,
  ChevronDown,
  X,
} from "lucide-react";

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
  const router = useRouter();
  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.id || "");
  const [manualRollNumber, setManualRollNumber] = useState("");
  const [isPending, startTransition] = useTransition();

  // Checked-in count and registered students states
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [registeredStudents, setRegisteredStudents] = useState<{ id: string; name: string; rollNumber: string | null }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Camera / scanner state
  const html5QrcodeRef = useRef<any>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannerReady, setScannerReady] = useState(false);

  // Whether manual entry panel is open
  const [showManual, setShowManual] = useState(false);

  // Fetch session data (checked-in count and registrations) when session ID changes
  useEffect(() => {
    if (!selectedSessionId) return;
    const fetchSessionData = async () => {
      try {
        const [count, students] = await Promise.all([
          getSessionCheckInCountAction(selectedSessionId),
          getRegisteredStudentsAction(selectedSessionId)
        ]);
        setCheckedInCount(count);
        setRegisteredStudents(students);
      } catch (e) {
        console.error("Failed to load session details", e);
      }
    };
    fetchSessionData();
  }, [selectedSessionId]);

  // Scan Alerts State
  const [scanResult, setScanResult] = useState<{
    type: "SUCCESS" | "WARNING" | "ERROR";
    message: string;
    studentName?: string;
    studentId?: string;
  } | null>(null);

  // Optimistic Scan Result
  const [optimisticScanResult, setOptimisticScanResult] = useOptimistic(
    scanResult,
    (state, nextResult: typeof scanResult) => nextResult
  );

  // Start camera scanner using Html5Qrcode (low-level API — no library UI rendered)
  useEffect(() => {
    if (typeof window === "undefined" || !selectedSessionId) return;

    let html5Qrcode: any;
    let stopped = false;

    setCameraError(null);
    setScannerReady(false);

    import("html5-qrcode").then((lib) => {
      if (stopped) return;

      // Clean up any previous instance
      if (html5QrcodeRef.current) {
        html5QrcodeRef.current.stop().catch(() => {}).finally(() => {
          html5QrcodeRef.current = null;
        });
      }

      html5Qrcode = new lib.Html5Qrcode("qr-video-container");
      html5QrcodeRef.current = html5Qrcode;

      const onScanSuccess = (decodedText: string) => {
        // Briefly pause scanning to process
        html5Qrcode.pause(true);
        triggerCheckIn(decodedText, "SCANNED").finally(() => {
          // Resume after 2 seconds so double-scans are avoided
          setTimeout(() => {
            if (!stopped && html5QrcodeRef.current) {
              html5QrcodeRef.current.resume();
            }
          }, 2000);
        });
      };

      const config = {
        fps: 10,
        // qrbox is purely visual guidance — the actual detection region is full video
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1.0,
        formatsToSupport: [
          lib.Html5QrcodeSupportedFormats.QR_CODE,
          lib.Html5QrcodeSupportedFormats.CODE_128,
          lib.Html5QrcodeSupportedFormats.CODE_39,
        ],
      };

      html5Qrcode
        .start(
          // Prefer rear/back camera on mobile devices
          { facingMode: "environment" },
          config,
          onScanSuccess,
          /* onScanFailure — silence frame-by-frame failures */ () => {}
        )
        .then(() => {
          if (!stopped) setScannerReady(true);
        })
        .catch((err: any) => {
          if (!stopped) {
            console.error("Camera start failed:", err);
            setCameraError(
              typeof err === "string"
                ? err
                : "Camera access denied. Please allow camera permissions and try again."
            );
          }
        });
    }).catch((err) => {
      console.error("Failed to load html5-qrcode:", err);
      setCameraError("Failed to load scanner module.");
    });

    return () => {
      stopped = true;
      if (html5QrcodeRef.current) {
        html5QrcodeRef.current.stop().catch(() => {});
        html5QrcodeRef.current = null;
      }
    };
    // Re-run when session changes (so camera restarts cleanly)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSessionId]);

  // triggerCheckIn returns a Promise so the scanner can await resume timing
  const triggerCheckIn = (rollNumber: string, method: "SCANNED" | "MANUAL"): Promise<void> => {
    setScanResult(null);
    if (!selectedSessionId) {
      setScanResult({ type: "ERROR", message: "Please select an active session block first." });
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      startTransition(async () => {
        try {
          const result = await markAttendanceByScan(selectedSessionId, rollNumber.trim());

          if (result.status === "success") {
            setScanResult({
              type: "SUCCESS",
              message: `${result.student.name} successfully checked in.`,
              studentName: result.student.name,
            });
            setManualRollNumber("");
            setCheckedInCount((c) => c + 1);

            const updatedStudents = await getRegisteredStudentsAction(selectedSessionId);
            setRegisteredStudents(updatedStudents);

            router.refresh();
          } else if (result.status === "already_checked_in") {
            setScanResult({
              type: "SUCCESS",
              message: `${result.student.name} is already checked in for this session.`,
              studentName: result.student.name,
            });
          } else if (result.status === "not_registered") {
            setScanResult({
              type: "ERROR",
              message: `No active registration found for student with roll number "${rollNumber}".`,
            });
          } else {
            setScanResult({
              type: "ERROR",
              message: result.message || "An unknown error occurred.",
            });
          }
        } catch (err: any) {
          setScanResult({
            type: "ERROR",
            message: err.message || "Attendance system request failed.",
          });
        } finally {
          resolve();
        }
      });
    });
  };

  const triggerManualCheckIn = (studentId: string) => {
    setScanResult(null);
    if (!selectedSessionId) {
      setScanResult({ type: "ERROR", message: "Please select an active session block first." });
      return;
    }

    startTransition(async () => {
      try {
        const result = await markAttendanceManual(selectedSessionId, studentId);

        if (result.status === "success") {
          setScanResult({
            type: "SUCCESS",
            message: `${result.student.name} successfully checked in manually.`,
            studentName: result.student.name,
          });
          setSearchQuery("");
          setCheckedInCount((c) => c + 1);

          const updatedStudents = await getRegisteredStudentsAction(selectedSessionId);
          setRegisteredStudents(updatedStudents);

          router.refresh();
        } else if (result.status === "already_checked_in") {
          setScanResult({
            type: "SUCCESS",
            message: `${result.student.name} is already checked in for this session.`,
            studentName: result.student.name,
          });
        } else if (result.status === "not_registered") {
          setScanResult({
            type: "ERROR",
            message: "Student is not registered for this event.",
          });
        } else {
          setScanResult({
            type: "ERROR",
            message: result.message || "An unknown error occurred.",
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
      setOptimisticScanResult({
        type: "SUCCESS",
        message: `${scanResult.studentName} promoted from Waitlist and Checked-In successfully!`,
        studentName: scanResult.studentName,
      });
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
          setCheckedInCount((c) => c + 1);

          const updatedStudents = await getRegisteredStudentsAction(selectedSessionId);
          setRegisteredStudents(updatedStudents);

          router.refresh();
        }
      } catch (err: any) {
        setScanResult({
          type: "ERROR",
          message: err.message || "Waitlist override failed.",
        });
      }
    });
  };

  const filteredStudents = registeredStudents.filter((student) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return false;
    return (
      student.name.toLowerCase().includes(query) ||
      (student.rollNumber && student.rollNumber.toLowerCase().includes(query))
    );
  });

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full pb-12">

      {/* ── Top Status Bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between border border-border bg-card px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Active Session</p>
          <p className="font-sans text-sm font-bold text-foreground truncate mt-0.5">
            {selectedSession ? `${selectedSession.event.title} — ${selectedSession.title}` : "No session selected"}
          </p>
        </div>
        <div className="text-right ml-4 shrink-0">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Checked In</p>
          <p className="font-heading text-2xl font-bold text-primary leading-none mt-0.5">{checkedInCount}</p>
        </div>
      </div>

      {/* ── Camera Viewfinder ───────────────────────────────────────── */}
      <div className="relative w-full bg-black overflow-hidden" style={{ aspectRatio: "1 / 1" }}>

        {/* The html5-qrcode library renders its <video> inside this div.
            We size it to fill the parent and hide any library-injected UI chrome. */}
        <div
          id="qr-video-container"
          className="absolute inset-0 w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_img]:hidden"
        />

        {/* Scan-frame overlay — purely visual guidance */}
        {scannerReady && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Dim corners */}
            <div className="absolute inset-0 bg-black/40" />
            {/* Transparent cutout frame — 60vw capped at 240px */}
            <div
              className="relative z-10 border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
              style={{ width: "min(60vw,240px)", height: "min(60vw,240px)" }}
            >
              {/* Corner ticks */}
              <span className="absolute -top-[2px] -left-[2px] w-5 h-5 border-t-4 border-l-4 border-primary" />
              <span className="absolute -top-[2px] -right-[2px] w-5 h-5 border-t-4 border-r-4 border-primary" />
              <span className="absolute -bottom-[2px] -left-[2px] w-5 h-5 border-b-4 border-l-4 border-primary" />
              <span className="absolute -bottom-[2px] -right-[2px] w-5 h-5 border-b-4 border-r-4 border-primary" />
              {/* Animated scan line */}
              <span className="absolute left-0 right-0 top-1/2 h-[2px] bg-primary/70 animate-[scanline_1.8s_ease-in-out_infinite]" />
            </div>
            <p className="absolute bottom-6 left-0 right-0 text-center font-mono text-[11px] text-white/70 uppercase tracking-widest">
              Point camera at student ID barcode or QR
            </p>
          </div>
        )}

        {/* Camera loading / error state */}
        {!scannerReady && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
            <ScanLine size={32} className="text-primary animate-pulse" />
            <p className="font-mono text-xs text-white/60 uppercase tracking-widest">Starting camera…</p>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 px-8">
            <AlertCircle size={28} className="text-destructive" />
            <p className="font-mono text-xs text-white/80 uppercase tracking-widest text-center">{cameraError}</p>
          </div>
        )}
      </div>

      {/* ── Session Selector ─────────────────────────────────────────── */}
      <div className="border border-border bg-card px-4 py-3 flex items-center gap-3">
        <ChevronDown size={14} className="text-muted-foreground shrink-0" />
        <select
          id="session-select"
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          className="flex-1 bg-transparent border-none text-foreground font-mono text-xs focus:outline-none uppercase tracking-wider"
        >
          {sessions.length === 0 ? (
            <option value="">No Active Sessions Available</option>
          ) : (
            sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.event.title} — {s.title}
              </option>
            ))
          )}
        </select>
      </div>

      {/* ── Scan Result Alert ─────────────────────────────────────────── */}
      {optimisticScanResult && (
        <div>
          {optimisticScanResult.type === "SUCCESS" && (
            <Alert className="rounded-none border-tertiary bg-tertiary/5 text-tertiary font-mono text-xs uppercase">
              <CheckCircle2 size={14} className="mr-2 shrink-0" />
              <div>
                <AlertTitle className="font-bold tracking-wide">CHECK-IN CONFIRMED</AlertTitle>
                <AlertDescription className="mt-1">{optimisticScanResult.message}</AlertDescription>
              </div>
            </Alert>
          )}

          {optimisticScanResult.type === "ERROR" && (
            <Alert variant="destructive" className="rounded-none border-destructive bg-destructive/5 text-destructive font-mono text-xs uppercase">
              <AlertCircle size={14} className="mr-2 shrink-0" />
              <div>
                <AlertTitle className="font-bold tracking-wide">ACCESS DENIED</AlertTitle>
                <AlertDescription className="mt-1">{optimisticScanResult.message}</AlertDescription>
              </div>
            </Alert>
          )}

          {optimisticScanResult.type === "WARNING" && (
            <Alert className="rounded-none border-primary bg-primary/5 text-primary font-mono text-xs uppercase">
              <TriangleAlert size={14} className="mr-2 shrink-0" />
              <div>
                <AlertTitle className="font-bold tracking-wide">WAITLISTED WARNING</AlertTitle>
                <AlertDescription className="mt-1">{optimisticScanResult.message}</AlertDescription>
                <Button
                  onClick={handleOverride}
                  disabled={isPending}
                  className="mt-3 bg-primary text-primary-foreground font-mono text-[10px] py-1.5 px-3 h-8 hover:bg-primary-container active:scale-95 transition-all shadow-none rounded-none w-full"
                >
                  Confirm Override &amp; Check-in
                </Button>
              </div>
            </Alert>
          )}
        </div>
      )}

      {/* ── Manual Entry Panel (collapsible) ──────────────────────────── */}
      <div className="border border-border bg-card">
        <button
          type="button"
          onClick={() => setShowManual((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:bg-surface-container transition-colors"
        >
          <span>Enter Manually</span>
          <span className={`transition-transform ${showManual ? "rotate-180" : ""}`}>
            <ChevronDown size={14} />
          </span>
        </button>

        {showManual && (
          <div className="border-t border-border px-4 pb-5 pt-4 space-y-5">
            {/* Search registered students */}
            <div className="flex flex-col gap-1.5">
              <Label className="font-mono text-[10px] text-muted-foreground uppercase" htmlFor="search-input">
                Search Registered Student
              </Label>
              <Input
                id="search-input"
                className="w-full bg-background border border-border text-foreground px-3 font-sans text-sm focus-visible:ring-1 focus-visible:ring-primary rounded-none shadow-none h-10"
                placeholder="Name or roll number…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isPending}
              />

              {searchQuery && (
                <div className="mt-1 border border-border divide-y divide-border max-h-48 overflow-y-auto bg-background">
                  {filteredStudents.length === 0 ? (
                    <div className="p-3 text-xs text-muted-foreground font-mono uppercase">No Matching Registrations Found</div>
                  ) : (
                    filteredStudents.map((student) => (
                      <div key={student.id} className="p-3 flex justify-between items-center bg-surface-container-low hover:bg-surface-container/45 transition-all">
                        <div className="min-w-0">
                          <span className="font-sans text-xs font-bold text-foreground block truncate">{student.name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground block">{student.rollNumber || "NO ROLL NUMBER"}</span>
                        </div>
                        <Button
                          onClick={() => triggerManualCheckIn(student.id)}
                          disabled={isPending}
                          className="bg-primary text-primary-foreground font-mono text-[10px] uppercase py-1 px-3.5 h-8 rounded-none shadow-none"
                        >
                          Check In
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Quick roll number entry */}
            <div className="border-t border-dashed border-border pt-4">
              <form onSubmit={handleManualSubmit} className="flex gap-4 items-end">
                <div className="flex-1 flex flex-col gap-1">
                  <Label className="font-mono text-[10px] text-muted-foreground uppercase" htmlFor="roll-input">
                    Quick Check-in by Roll Number
                  </Label>
                  <Input
                    id="roll-input"
                    className="w-full bg-background border border-border text-foreground px-3 font-mono text-sm focus-visible:ring-1 focus-visible:ring-primary rounded-none shadow-none h-10"
                    placeholder="e.g. Kits1248"
                    value={manualRollNumber}
                    onChange={(e) => setManualRollNumber(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-secondary text-secondary-foreground font-mono text-xs uppercase tracking-widest px-6 h-10 hover:opacity-90 active:scale-95 transition-all rounded-none shadow-none"
                >
                  Verify
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
