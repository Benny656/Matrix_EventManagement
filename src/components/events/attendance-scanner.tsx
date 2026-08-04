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
  Camera,
  Keyboard,
  Search,
  Loader2,
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
  event: { title: string };
}

interface AttendanceScannerProps {
  sessions: ActiveSession[];
}

// ──────────────────────────────────────────────────────────────────────────────
// Type Declarations for Browser Native BarcodeDetector API
// ──────────────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats?: string[] }): {
        detect: (image: ImageBitmapSource) => Promise<Array<{ rawValue: string; format: string }>>;
      };
      getSupportedFormats: () => Promise<string[]>;
    };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Roll-number normalisation
// ──────────────────────────────────────────────────────────────────────────────
//
// ID-card barcodes often encode extra preamble bytes before the actual roll
// number (e.g. CODE-128 Symbology Identifier "c1" or "c2" → raw decoded string
// arrives as "c1URK25CS7035" or "c2URK25CS7035" instead of "URK25CS7035").
//
// Normalization steps:
// 1. Trim whitespace.
// 2. Convert scanned text to uppercase.
// 3. Find first occurrence of "URK".
// 4. Discard everything before "URK".
// 5. Use normalized roll number. Fall back to original scanned value if "URK" not found.
//
function normalizeRollNumber(raw: string): string {
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();
  const idx = upper.indexOf("URK");
  if (idx === -1) {
    return upper || trimmed;
  }
  return upper.slice(idx);
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
  const [activeTab, setActiveTab] = useState<"SCANNER" | "MANUAL">("SCANNER");
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [registeredStudents, setRegisteredStudents] = useState<
    { id: string; name: string; rollNumber: string | null }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Camera / scanner state ─────────────────────────────────────────────────
  // Prevents a second scan firing while a check-in is in-flight / cooling down
  const processingRef = useRef(false);
  const scannerRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const detectorRef = useRef<any>(null);

  const [scannerReady, setScannerReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // ── Camera Selection states ───────────────────────────────────────────────
  const [devices, setDevices] = useState<{ id: string; label: string }[]>([]);
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

  // ── Camera + Barcode Scanning loop ─────────────────────────────────────────
  useEffect(() => {
    if (!selectedSessionId || activeTab !== "SCANNER") return;

    let isMounted = true;

    // Reset per-session state
    setScannerReady(false);
    setCameraError(null);
    processingRef.current = false;

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

    // Helper: Native BarcodeDetector scanner
    const startNativeScanner = async () => {
      let formats = ["code_128", "qr_code"];
      if (typeof window.BarcodeDetector?.getSupportedFormats === "function") {
        try {
          const supported = await window.BarcodeDetector.getSupportedFormats();
          const filtered = formats.filter((f) => supported.includes(f));
          if (filtered.length > 0) formats = filtered;
          else if (supported.length > 0) formats = supported;
        } catch (e) {
          // keep default formats
        }
      }

      try {
        const devicesList = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devicesList.filter((d) => d.kind === "videoinput");
        if (videoInputs.length > 0 && isMounted) {
          const mappedDevices = videoInputs.map((d, index) => ({
            id: d.deviceId,
            label: d.label || `Camera ${index + 1}`,
          }));
          setDevices(mappedDevices);
          if (!activeDeviceId) {
            const backCamera = mappedDevices.find((d) => d.label.toLowerCase().includes("back"));
            setActiveDeviceId(backCamera ? backCamera.id : mappedDevices[0].id);
          }
        }
      } catch (err) {
        console.warn("Failed to enumerate camera devices:", err);
      }

      if (!isMounted) return;

      let stream: MediaStream | null = null;
      try {
        const videoConstraints: MediaTrackConstraints = activeDeviceId
          ? { deviceId: { exact: activeDeviceId } }
          : { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } };

        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
        } catch (err) {
          if (activeDeviceId) {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
            });
          } else {
            throw err;
          }
        }
      } catch (err: any) {
        console.error("Native camera access error:", err);
        if (isMounted) setCameraError("Camera access denied or unavailable.");
        return;
      }

      if (!isMounted || !stream) {
        if (stream) stream.getTracks().forEach((t) => t.stop());
        return;
      }

      const container = document.getElementById("reader-container");
      if (!container) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      container.innerHTML = "";
      const videoEl = document.createElement("video");
      videoEl.setAttribute("playsinline", "true");
      videoEl.setAttribute("autoplay", "true");
      videoEl.muted = true;
      videoEl.style.width = "100%";
      videoEl.style.height = "100%";
      videoEl.style.objectFit = "cover";
      videoEl.srcObject = stream;
      container.appendChild(videoEl);

      // Guard against the play() promise resolving/rejecting after this
      // effect has already been cleaned up (session switched, tab changed,
      // component unmounted). Without this check, an AbortError from a
      // stale play() call can still fall through to the checks below and
      // act on a video element or stream that no longer belongs to the
      // current run.
      try {
        await videoEl.play();
      } catch (e) {
        console.warn("Video play error:", e);
      }

      if (!isMounted) {
        stream.getTracks().forEach((t) => t.stop());
        container.innerHTML = "";
        return;
      }

      mediaStreamRef.current = stream;
      detectorRef.current = new window.BarcodeDetector!({ formats });

      if (isMounted) setScannerReady(true);

      const scanLoop = async () => {
        if (!isMounted || !mediaStreamRef.current || !detectorRef.current) return;

        if (videoEl.readyState >= 2 && !processingRef.current) {
          try {
            const barcodes = await detectorRef.current.detect(videoEl);
            if (barcodes && barcodes.length > 0 && !processingRef.current && isMounted) {
              const rawValue = barcodes[0].rawValue;
              if (rawValue) {
                processingRef.current = true;
                await onConfirmedScan(rawValue);
                setTimeout(() => {
                  processingRef.current = false;
                }, COOLDOWN_MS);
              }
            }
          } catch (err) {
            // Ignore frame detection errors
          }
        }

        if (isMounted) {
          animFrameRef.current = requestAnimationFrame(scanLoop);
        }
      };

      animFrameRef.current = requestAnimationFrame(scanLoop);
    };

    // Helper: html5-qrcode fallback scanner
    const startHtml5QrcodeScanner = async () => {
      let Html5Qrcode: any;
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
          const mappedDevices = allDevices.map((d: any) => ({
            id: d.id,
            label: d.label || d.id,
          }));
          setDevices(mappedDevices);
          if (!activeDeviceId) {
            const backCamera = mappedDevices.find((d: any) => d.label.toLowerCase().includes("back"));
            setActiveDeviceId(backCamera ? backCamera.id : mappedDevices[0].id);
          }
        }
      } catch (err) {
        console.warn("Failed to enumerate camera devices:", err);
      }

      if (!isMounted) return;

      const container = document.getElementById("reader-container");
      if (container) {
        container.innerHTML = "";
      }

      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning || scannerRef.current.getState() === 2) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch (e) {}
      }

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
          () => {
            // Ignore parse errors
          }
        );
        if (isMounted) setScannerReady(true);
      } catch (err: any) {
        console.error("Scanner start error:", err);
        if (isMounted) setCameraError("Camera access denied or unavailable.");
      }
    };

    // Determine engine based on window.BarcodeDetector availability
    const hasNativeBarcodeDetector =
      typeof window !== "undefined" &&
      "BarcodeDetector" in window &&
      typeof window.BarcodeDetector === "function";

    if (hasNativeBarcodeDetector) {
      startNativeScanner();
    } else {
      startHtml5QrcodeScanner();
    }

    return () => {
      isMounted = false;

      // Clean up native stream & animation frame
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }

      // Pause any in-flight video before it's removed from the DOM below.
      // If videoEl.play() hasn't resolved yet when the container is cleared
      // a few lines down, the browser throws an unhandled AbortError
      // ("The play() request was interrupted because the media was removed
      // from the document"). Explicitly pausing and detaching the stream
      // from the element first avoids that race.
      const existingVideo = document.querySelector(
        "#reader-container video"
      ) as HTMLVideoElement | null;
      if (existingVideo) {
        try {
          existingVideo.pause();
          existingVideo.srcObject = null;
        } catch (e) {
          // Element may already be mid-teardown — safe to ignore.
        }
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      detectorRef.current = null;

      // Clean up html5-qrcode fallback instance
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        try {
          if (scanner.isScanning || scanner.getState() === 2) {
            scanner
              .stop()
              .then(() => {
                try {
                  scanner.clear();
                } catch (e) {}
              })
              .catch((e: any) => console.log("Stop error:", e));
          } else {
            scanner.clear();
          }
        } catch (e) {}
      }

      const container = document.getElementById("reader-container");
      if (container) {
        container.innerHTML = "";
      }

      setScannerReady(false);
    };
  }, [selectedSessionId, activeDeviceId, activeTab]);

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
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full pb-10 px-1 sm:px-0">
      {/* ── 1. Compact Session & Checked-in Count Header ───────────────────── */}
      <div className="border border-border bg-card p-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <select
              id="session-select"
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full bg-transparent border-none text-foreground font-sans text-sm font-bold focus:outline-none uppercase tracking-tight truncate cursor-pointer py-1"
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
          <div className="shrink-0 bg-primary/10 border border-primary/20 px-2.5 py-1 flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-primary uppercase font-bold tracking-wider">Checked In:</span>
            <span className="font-heading text-sm font-bold text-primary">{checkedInCount}</span>
          </div>
        </div>
      </div>

      {/* ── 2. Top Segmented Mode Tabs ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-1.5 border border-border bg-card p-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("SCANNER")}
          className={`flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider transition-all h-12 rounded-none cursor-pointer ${
            activeTab === "SCANNER"
              ? "bg-primary text-primary-foreground font-bold shadow-none"
              : "text-muted-foreground hover:text-foreground hover:bg-surface-container"
          }`}
        >
          <Camera size={18} />
          <span>Camera Scanner</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("MANUAL")}
          className={`flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider transition-all h-12 rounded-none cursor-pointer ${
            activeTab === "MANUAL"
              ? "bg-primary text-primary-foreground font-bold shadow-none"
              : "text-muted-foreground hover:text-foreground hover:bg-surface-container"
          }`}
        >
          <Keyboard size={18} />
          <span>Manual Entry</span>
        </button>
      </div>

      {/* ── 3. Scan Result Alert Notification ──────────────────────────────── */}
      {optimisticScanResult && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          {optimisticScanResult.type === "SUCCESS" && (
            <Alert className="rounded-none border-tertiary bg-tertiary/10 text-tertiary font-mono text-xs uppercase p-4 shadow-sm">
              <CheckCircle2 size={18} className="mr-2 shrink-0 text-tertiary" />
              <div>
                <AlertTitle className="font-bold tracking-wide">CHECK-IN CONFIRMED</AlertTitle>
                <AlertDescription className="mt-1 text-xs">{optimisticScanResult.message}</AlertDescription>
              </div>
            </Alert>
          )}
          {optimisticScanResult.type === "ERROR" && (
            <Alert variant="destructive" className="rounded-none border-destructive bg-destructive/10 text-destructive font-mono text-xs uppercase p-4 shadow-sm">
              <AlertCircle size={18} className="mr-2 shrink-0 text-destructive" />
              <div>
                <AlertTitle className="font-bold tracking-wide">ACCESS DENIED</AlertTitle>
                <AlertDescription className="mt-1 text-xs">{optimisticScanResult.message}</AlertDescription>
              </div>
            </Alert>
          )}
          {optimisticScanResult.type === "WARNING" && (
            <Alert className="rounded-none border-primary bg-primary/10 text-primary font-mono text-xs uppercase p-4 shadow-sm">
              <TriangleAlert size={18} className="mr-2 shrink-0 text-primary" />
              <div>
                <AlertTitle className="font-bold tracking-wide">WAITLISTED WARNING</AlertTitle>
                <AlertDescription className="mt-1 text-xs">{optimisticScanResult.message}</AlertDescription>
                <Button
                  onClick={handleOverride}
                  disabled={isPending}
                  className="mt-3 bg-primary text-primary-foreground font-mono text-xs py-2 px-4 h-11 hover:bg-primary-container active:scale-95 transition-all shadow-none rounded-none w-full cursor-pointer"
                >
                  Confirm Override &amp; Check-in
                </Button>
              </div>
            </Alert>
          )}
        </div>
      )}

      {/* ── 4. Main Content: Camera Scanner View ────────────────────────────── */}
      {activeTab === "SCANNER" && (
        <div className="space-y-4">
          <div className="relative w-full bg-black overflow-hidden aspect-[3/4] sm:aspect-square max-h-[58vh] border border-border shadow-md">
            <div id="reader-container" className="absolute inset-0 w-full h-full object-cover [&>video]:object-cover [&>video]:w-full [&>video]:h-full border-none outline-none" />

            {devices.length > 1 && scannerReady && (
              <button
                onClick={switchCamera}
                aria-label="Switch camera"
                className="absolute top-4 left-4 z-20 p-3 rounded-full bg-black/65 text-white hover:bg-black/85 transition-colors active:scale-95 cursor-pointer shadow-lg"
              >
                <RefreshCw size={20} />
              </button>
            )}

            {scannerReady && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute inset-0 bg-black/35" />
                <div
                  className="relative z-10"
                  style={{ width: "min(68vw, 240px)", height: "min(68vw, 240px)" }}
                >
                  <span className="absolute -top-[2px] -left-[2px] w-7 h-7 border-t-[3px] border-l-[3px] border-primary" />
                  <span className="absolute -top-[2px] -right-[2px] w-7 h-7 border-t-[3px] border-r-[3px] border-primary" />
                  <span className="absolute -bottom-[2px] -left-[2px] w-7 h-7 border-b-[3px] border-l-[3px] border-primary" />
                  <span className="absolute -bottom-[2px] -right-[2px] w-7 h-7 border-b-[3px] border-r-[3px] border-primary" />
                  <span
                    className="absolute left-0 right-0 h-[2px] bg-primary/90"
                    style={{ animation: "scanline 1.8s ease-in-out infinite" }}
                  />
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <span className="inline-block font-mono text-[11px] text-white/90 uppercase tracking-wider bg-black/60 backdrop-blur-sm px-3 py-1.5 border border-white/10">
                    Align Barcode or QR Code in Frame
                  </span>
                </div>
              </div>
            )}

            {!scannerReady && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85">
                <ScanLine size={36} className="text-primary animate-pulse" />
                <p className="font-mono text-xs text-white/70 uppercase tracking-widest">
                  Initializing camera feed…
                </p>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 px-8 text-center">
                <AlertCircle size={32} className="text-destructive" />
                <p className="font-mono text-xs text-white/80 uppercase tracking-widest">
                  {cameraError}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 5. Main Content: Manual Entry & Directory Search View ─────────────── */}
      {activeTab === "MANUAL" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Quick Roll Number Entry Card */}
          <div className="border border-border bg-card p-4 space-y-3 shadow-sm">
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-bold border-b border-border pb-2">
              Quick Check-in by Roll Number
            </h3>
            <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
              <div className="flex-1 flex flex-col gap-1.5">
                <Label className="font-mono text-[10px] text-muted-foreground uppercase" htmlFor="manual-roll-input">
                  Roll Number
                </Label>
                <Input
                  id="manual-roll-input"
                  className="w-full bg-background border border-border text-foreground px-3.5 font-mono text-sm focus-visible:ring-1 focus-visible:ring-primary rounded-none shadow-none h-12 uppercase"
                  placeholder="e.g. URK25CS7035"
                  value={manualRollNumber}
                  onChange={(e) => setManualRollNumber(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <Button
                type="submit"
                disabled={isPending || !manualRollNumber.trim()}
                className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider px-6 h-12 hover:bg-primary-container active:scale-95 transition-all rounded-none shadow-none cursor-pointer shrink-0"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Checking...
                  </span>
                ) : (
                  "Check In"
                )}
              </Button>
            </form>
          </div>

          {/* Student Search & Direct Check-in */}
          <div className="border border-border bg-card p-4 space-y-3 shadow-sm">
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-bold border-b border-border pb-2">
              Search Registered Students
            </h3>
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-3.5 text-muted-foreground" />
              <Input
                id="search-input"
                className="w-full bg-background border border-border text-foreground pl-10 pr-3.5 font-sans text-sm focus-visible:ring-1 focus-visible:ring-primary rounded-none shadow-none h-12"
                placeholder="Search name or roll number…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isPending}
              />
            </div>

            {searchQuery && (
              <div className="border border-border divide-y divide-border max-h-64 overflow-y-auto bg-background">
                {filteredStudents.length === 0 ? (
                  <div className="p-4 text-xs text-muted-foreground font-mono uppercase text-center">
                    No Matching Registrations Found
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className="p-3.5 flex justify-between items-center bg-surface-container-low hover:bg-surface-container/45 transition-all gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-sans text-sm font-bold text-foreground block truncate">
                          {student.name}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground block mt-0.5">
                          {student.rollNumber || "NO ROLL NUMBER"}
                        </span>
                      </div>
                      <Button
                        onClick={() => triggerManualCheckIn(student.id)}
                        disabled={isPending}
                        className="bg-primary text-primary-foreground font-mono text-xs uppercase py-2 px-4 h-10 rounded-none shadow-none shrink-0 cursor-pointer"
                      >
                        Check In
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}