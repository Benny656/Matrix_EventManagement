"use client";

import React, { useEffect, useRef, useState, useTransition, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import {
  overrideWaitlistAction,
  markAttendanceByScan,
  markAttendanceManual,
  getRegisteredStudentsAction,
  getSessionCheckInCountAction,
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
  RefreshCw,
} from "lucide-react";

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

/** How many consecutive frames must decode to the exact same string before we fire. */
const CONFIRM_FRAMES = 3;

/** Milliseconds to block new scans after a confirmed read. */
const COOLDOWN_MS = 2500;

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

interface ActiveSession {
  id: string;
  title: string;
  venue: string;
  event: { title: string };
}

interface AttendanceScannerProps {
  sessions: ActiveSession[];
}

// ──────────────────────────────────────────────────────────────────────────────
// Roll-number normalisation
// ──────────────────────────────────────────────────────────────────────────────
//
// ID-card barcodes often encode extra preamble bytes before the actual roll
// number (e.g. CODE-128 Symbology Identifier "C1" → the raw decoded string
// arrives as "C1URK25CS7025" instead of "URK25CS7025").
//
// This helper extracts the substring starting at the first "URK" occurrence,
// which is the canonical prefix for all Karunya roll numbers.
// Returns null when no "URK" is found, signalling an invalid scan.
//
function normalizeRollNumber(raw: string): string {
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();
  const idx = upper.indexOf("URK");
  if (idx === -1) return trimmed;
  // User asked for "URK25CS7035", we can preserve the rest of the string case or uppercase it.
  // Slicing from idx ensures we drop everything before URK.
  return trimmed.slice(idx);
}

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────

export default function AttendanceScanner({ sessions }: AttendanceScannerProps) {
  const router = useRouter();

  // ── Session & manual-entry state ───────────────────────────────────────────
  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.id || "");
  const [manualRollNumber, setManualRollNumber] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showManual, setShowManual] = useState(false);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [registeredStudents, setRegisteredStudents] = useState<
    { id: string; name: string; rollNumber: string | null }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Camera / scanner state ─────────────────────────────────────────────────
  // Prevents a second scan firing while a check-in is in-flight / cooling down
  const processingRef = useRef(false);
  const scannerRef = useRef<any>(null);

  const [scannerReady, setScannerReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // ── Camera Selection states ───────────────────────────────────────────────
  const [devices, setDevices] = useState<any[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>("");

  // ── Scan-result alert state (with optimistic) ──────────────────────────────
  const [scanResult, setScanResult] = useState<{
    type: "SUCCESS" | "WARNING" | "ERROR";
    message: string;
    studentName?: string;
    studentId?: string;
  } | null>(null);

  const [optimisticScanResult, setOptimisticScanResult] = useOptimistic(
    scanResult,
    (_state, nextResult: typeof scanResult) => nextResult
  );

  // ── Fetch session data whenever the selected session changes ───────────────
  useEffect(() => {
    if (!selectedSessionId) return;
    (async () => {
      try {
        const [count, students] = await Promise.all([
          getSessionCheckInCountAction(selectedSessionId),
          getRegisteredStudentsAction(selectedSessionId),
        ]);
        setCheckedInCount(count);
        setRegisteredStudents(students);
      } catch (e) {
        console.error("Failed to load session details", e);
      }
    })();
  }, [selectedSessionId]);

  // ── Camera + html5-qrcode loop ───────────────────────────────────────
  useEffect(() => {
    if (!selectedSessionId) return;

    let isMounted = true;

    // Reset per-session state
    setScannerReady(false);
    setCameraError(null);
    processingRef.current = false;

    // We must lazily import html5-qrcode to avoid SSR issues
    let Html5Qrcode: any;

    const onConfirmedScan = async (decodedText: string) => {
      setScanResult(null);
      const rollNumber = normalizeRollNumber(decodedText);
      if (!rollNumber) {
        setScanResult({
          type: "ERROR",
          message: `Unrecognised barcode value — no roll number found in "${decodedText}".`,
        });
        return;
      }
      try {
        const result = await markAttendanceByScan(selectedSessionId, rollNumber);
        if (!isMounted) return;
        if (result.status === "success") {
          setScanResult({
            type: "SUCCESS",
            message: `${result.student.name} successfully checked in.`,
            studentName: result.student.name,
          });
          setCheckedInCount((c) => c + 1);
          const updated = await getRegisteredStudentsAction(selectedSessionId);
          setRegisteredStudents(updated);
          router.refresh();
        } else if (result.status === "already_checked_in") {
          setScanResult({
            type: "SUCCESS",
            message: `${result.student.name} is already checked in.`,
            studentName: result.student.name,
          });
        } else if (result.status === "not_registered") {
          setScanResult({
            type: "ERROR",
            message: `No active registration found for "${rollNumber}".`,
          });
        } else {
          setScanResult({
            type: "ERROR",
            message: result.message || "An unknown error occurred.",
          });
        }
      } catch (err: any) {
        if (!isMounted) return;
        setScanResult({
          type: "ERROR",
          message: err.message || "Attendance system request failed.",
        });
      }
    };

    const startScanner = async () => {
      try {
        const h5q = await import("html5-qrcode");
        Html5Qrcode = h5q.Html5Qrcode;
      } catch (e) {
        if (isMounted) setCameraError("Failed to load barcode decoder.");
        return;
      }

      if (!isMounted) return;

      try {
        const allDevices = await Html5Qrcode.getCameras();
        if (allDevices && allDevices.length > 0 && isMounted) {
          setDevices(allDevices);
          if (!activeDeviceId) {
            // Prefer a back camera if available based on label, else take the first
            const backCamera = allDevices.find((d: any) => d.label.toLowerCase().includes("back"));
            setActiveDeviceId(backCamera ? backCamera.id : allDevices[0].id);
          }
        }
      } catch (err) {
        console.warn("Failed to enumerate camera devices:", err);
      }

      if (!isMounted) return;

      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning || scannerRef.current.getState() === 2) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch (e) {}
      }
      
      const el = document.getElementById("reader-container");
      if (!el) return; // if DOM element unmounted

      const html5QrCode = new Html5Qrcode("reader-container");
      scannerRef.current = html5QrCode;

      try {
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        const cameraIdOrConfig = activeDeviceId ? activeDeviceId : { facingMode: "environment" };

        await html5QrCode.start(
          cameraIdOrConfig,
          config,
          async (decodedText: string) => {
            if (!processingRef.current && isMounted) {
              processingRef.current = true;
              await onConfirmedScan(decodedText);
              setTimeout(() => {
                processingRef.current = false;
              }, COOLDOWN_MS);
            }
          },
          (errorMessage: string) => {
            // Ignore parse errors
          }
        );
        if (isMounted) setScannerReady(true);
      } catch (err: any) {
        console.error("Scanner start error:", err);
        if (isMounted) setCameraError("Camera access denied or unavailable.");
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        try {
          if (scanner.isScanning || scanner.getState() === 2) {
            scanner.stop().then(() => {
              try { scanner.clear(); } catch(e){}
            }).catch((e: any) => console.log("Stop error:", e));
          } else {
            scanner.clear();
          }
        } catch(e) {}
      }
      setScannerReady(false);
    };
  }, [selectedSessionId, activeDeviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Switch Camera ──────────────────────────────────────────────────────────
  const switchCamera = () => {
    if (devices.length <= 1) return;
    const currentIndex = devices.findIndex((d: any) => d.id === activeDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    if (nextDevice) {
      setActiveDeviceId(nextDevice.id);
    }
  };

  // ── Manual check-in helpers ───────────────────────────────────────────────
  const triggerCheckIn = (rawInput: string) => {
    setScanResult(null);
    if (!selectedSessionId) {
      setScanResult({ type: "ERROR", message: "Please select an active session block first." });
      return;
    }

    // Apply the same URK-normalisation as the scanner path so that a stray
    // prefix typed in the manual field is silently discarded.
    const rollNumber = normalizeRollNumber(rawInput.trim()) ?? rawInput.trim();

    startTransition(async () => {
      try {
        const result = await markAttendanceByScan(selectedSessionId, rollNumber);

        if (result.status === "success") {
          setScanResult({
            type: "SUCCESS",
            message: `${result.student.name} successfully checked in.`,
            studentName: result.student.name,
          });
          setManualRollNumber("");
          setCheckedInCount((c) => c + 1);
          const updated = await getRegisteredStudentsAction(selectedSessionId);
          setRegisteredStudents(updated);
          router.refresh();
        } else if (result.status === "already_checked_in") {
          setScanResult({
            type: "SUCCESS",
            message: `${result.student.name} is already checked in.`,
            studentName: result.student.name,
          });
        } else if (result.status === "not_registered") {
          setScanResult({
            type: "ERROR",
            message: `No active registration found for "${rollNumber}".`,
          });
        } else {
          setScanResult({ type: "ERROR", message: result.message || "An unknown error occurred." });
        }
      } catch (err: any) {
        setScanResult({ type: "ERROR", message: err.message || "Attendance system request failed." });
      }
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
          const updated = await getRegisteredStudentsAction(selectedSessionId);
          setRegisteredStudents(updated);
          router.refresh();
        } else if (result.status === "already_checked_in") {
          setScanResult({
            type: "SUCCESS",
            message: `${result.student.name} is already checked in.`,
            studentName: result.student.name,
          });
        } else if (result.status === "not_registered") {
          setScanResult({ type: "ERROR", message: "Student is not registered for this event." });
        } else {
          setScanResult({ type: "ERROR", message: result.message || "An unknown error occurred." });
        }
      } catch (err: any) {
        setScanResult({ type: "ERROR", message: err.message || "Attendance system request failed." });
      }
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRollNumber.trim()) return;
    triggerCheckIn(manualRollNumber);
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
          const updated = await getRegisteredStudentsAction(selectedSessionId);
          setRegisteredStudents(updated);
          router.refresh();
        }
      } catch (err: any) {
        setScanResult({ type: "ERROR", message: err.message || "Waitlist override failed." });
      }
    });
  };

  const filteredStudents = registeredStudents.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return false;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(q))
    );
  });

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full pb-12">



      {/* ── Top status bar ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border border-border bg-card px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Active Session</p>
          <p className="font-sans text-sm font-bold text-foreground truncate mt-0.5">
            {selectedSession
              ? `${selectedSession.event.title} — ${selectedSession.title}`
              : "No session selected"}
          </p>
        </div>
        <div className="text-right ml-4 shrink-0">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Checked In</p>
          <p className="font-heading text-2xl font-bold text-primary leading-none mt-0.5">
            {checkedInCount}
          </p>
        </div>
      </div>

      {/* ── Camera viewfinder ──────────────────────────────────────────────── */}
      <div className="relative w-full bg-black overflow-hidden" style={{ aspectRatio: "1 / 1" }}>

        {/* Live video — html5-qrcode will mount inside here */}
        <div id="reader-container" className="absolute inset-0 w-full h-full object-cover [&>video]:object-cover [&>video]:w-full [&>video]:h-full border-none outline-none" />



        {/* Camera switch toggle — only rendered when multiple cameras are found */}
        {devices.length > 1 && scannerReady && (
          <button
            onClick={switchCamera}
            aria-label="Switch camera"
            className="absolute top-3 left-3 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors active:scale-95"
          >
            <RefreshCw size={20} />
          </button>
        )}

        {/* Scan-frame overlay — purely visual guidance over the live feed */}
        {scannerReady && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Dimmed surround */}
            <div className="absolute inset-0 bg-black/35" />

            {/* Transparent cutout with corner brackets */}
            <div
              className="relative z-10"
              style={{ width: "min(62vw, 240px)", height: "min(62vw, 240px)" }}
            >
              {/* Corner ticks */}
              <span className="absolute -top-[2px] -left-[2px] w-6 h-6 border-t-[3px] border-l-[3px] border-primary" />
              <span className="absolute -top-[2px] -right-[2px] w-6 h-6 border-t-[3px] border-r-[3px] border-primary" />
              <span className="absolute -bottom-[2px] -left-[2px] w-6 h-6 border-b-[3px] border-l-[3px] border-primary" />
              <span className="absolute -bottom-[2px] -right-[2px] w-6 h-6 border-b-[3px] border-r-[3px] border-primary" />

              {/* Animated scan line — CSS keyframe defined in globals.css */}
              <span
                className="absolute left-0 right-0 h-[2px] bg-primary/80"
                style={{ animation: "scanline 1.8s ease-in-out infinite" }}
              />
            </div>

            <p className="absolute bottom-5 left-0 right-0 text-center font-mono text-[11px] text-white/65 uppercase tracking-widest">
              Point camera at student ID barcode or QR
            </p>
          </div>
        )}

        {/* Loading state */}
        {!scannerReady && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
            <ScanLine size={32} className="text-primary animate-pulse" />
            <p className="font-mono text-xs text-white/60 uppercase tracking-widest">
              Starting camera…
            </p>
          </div>
        )}

        {/* Error state */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 px-8 text-center">
            <AlertCircle size={28} className="text-destructive" />
            <p className="font-mono text-xs text-white/80 uppercase tracking-widest">
              {cameraError}
            </p>
          </div>
        )}
      </div>

      {/* ── Session selector ──────────────────────────────────────────────── */}
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

      {/* ── Scan result alert ─────────────────────────────────────────────── */}
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

      {/* ── Manual entry panel (collapsible) ─────────────────────────────── */}
      <div className="border border-border bg-card">
        <button
          type="button"
          onClick={() => setShowManual((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:bg-surface-container transition-colors"
        >
          <span>Enter Manually</span>
          <ChevronDown
            size={14}
            className={`transition-transform ${showManual ? "rotate-180" : ""}`}
          />
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
                    <div className="p-3 text-xs text-muted-foreground font-mono uppercase">
                      No Matching Registrations Found
                    </div>
                  ) : (
                    filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className="p-3 flex justify-between items-center bg-surface-container-low hover:bg-surface-container/45 transition-all"
                      >
                        <div className="min-w-0">
                          <span className="font-sans text-xs font-bold text-foreground block truncate">
                            {student.name}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground block">
                            {student.rollNumber || "NO ROLL NUMBER"}
                          </span>
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
