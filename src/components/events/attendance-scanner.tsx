"use client";

import React, { useEffect, useRef, useState, useTransition, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import {
  markAttendanceAction,
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
  const router = useRouter();
  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.id || "");
  const [manualRollNumber, setManualRollNumber] = useState("");
  const [isPending, startTransition] = useTransition();

  // Checked-in count and registered students states
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [registeredStudents, setRegisteredStudents] = useState<{ id: string; name: string; rollNumber: string | null }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

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
          formatsToSupport: [
            lib.Html5QrcodeSupportedFormats.QR_CODE,
            lib.Html5QrcodeSupportedFormats.CODE_128,
            lib.Html5QrcodeSupportedFormats.CODE_39,
          ]
        },
        /* verbose= */ false
      );

      const onScanSuccess = (decodedText: string) => {
        // Stop scanning temporarily
        html5QrcodeScanner.clear().catch(console.error);

        // Process code (roll number or barcode)
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
        const result = await markAttendanceByScan(selectedSessionId, rollNumber.trim());

        if (result.status === "success") {
          setScanResult({
            type: "SUCCESS",
            message: `${result.student.name} successfully checked in.`,
            studentName: result.student.name,
          });
          setManualRollNumber("");
          setCheckedInCount((c) => c + 1);
          
          // Re-fetch registered students list to update check-in possibilities
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
          
          // Re-fetch registered students list
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
        {optimisticScanResult && (
          <div className="space-y-3">
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
            <span className="font-mono text-[10px] text-primary uppercase font-bold">Checked In: {checkedInCount}</span>
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
          <div className="border-b border-border pb-3 bg-surface-container -mx-6 px-6 -mt-6 flex justify-between items-center">
            <span className="font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Manual Entry Fallback</span>
            <span className="font-mono text-[10px] text-primary uppercase font-bold">Checked In: {checkedInCount}</span>
          </div>

          {/* Search Box */}
          <div className="flex flex-col gap-1.5 pb-2">
            <Label className="font-mono text-[10px] text-muted-foreground uppercase" htmlFor="search-input">Search Registered Student</Label>
            <Input
              id="search-input"
              className="w-full bg-background border border-border text-foreground px-3 py-5 font-sans text-sm focus-visible:ring-1 focus-visible:ring-primary rounded-none shadow-none h-10"
              placeholder="Search by student name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isPending}
            />

            {searchQuery && (
              <div className="mt-2 border border-border divide-y divide-border max-h-48 overflow-y-auto bg-background">
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

          <div className="border-t border-dashed border-border pt-4">
            <form onSubmit={handleManualSubmit} className="flex gap-4 items-end">
              <div className="flex-1 flex flex-col gap-1">
                <Label className="font-mono text-[10px] text-muted-foreground uppercase" htmlFor="roll-input">Quick Check-in by Roll Number</Label>
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
                Verify
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
