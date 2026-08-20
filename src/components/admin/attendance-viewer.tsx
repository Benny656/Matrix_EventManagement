"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Search, Loader2, Calendar as CalendarIcon, Clock, Filter, QrCode, Keyboard, FileText, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  getAdminEventsAction, 
  getAdminSessionsAction, 
  getSessionAttendanceAction 
} from "@/actions/admin-attendance";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface AttendanceViewerProps {
  initialEventId?: string;
}

export default function AttendanceViewer({ initialEventId }: AttendanceViewerProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"ALL" | "SCANNED" | "MANUAL">("ALL");

  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isPending, startTransition] = useTransition();

  // 1. Load Events on Mount
  useEffect(() => {
    getAdminEventsAction()
      .then((data) => {
        setEvents(data);
        if (data.length > 0) {
          const targetId = initialEventId && data.some((e) => e.id === initialEventId) ? initialEventId : data[0].id;
          handleEventChange(targetId);
        }
      })
      .finally(() => setIsLoadingEvents(false));
  }, [initialEventId]);

  // 2. Handle Event Selection Change
  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    setSelectedSessionId("");
    setSessions([]);
    setAttendances([]);

    if (!eventId) return;

    startTransition(() => {
      getAdminSessionsAction(eventId).then((data) => {
        setSessions(data);
        if (data.length > 0) {
          handleSessionChange(data[0].id);
        }
      });
    });
  };

  // 3. Handle Session Selection Change
  const handleSessionChange = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setAttendances([]);

    if (!sessionId) return;

    startTransition(() => {
      getSessionAttendanceAction(sessionId).then((data) => {
        setAttendances(data);
      });
    });
  };

  // Filtering Logic
  const filteredAttendances = attendances.filter((att) => {
    // 1. Check Method Filter
    if (filterMode !== "ALL" && att.checkInMethod !== filterMode) {
      return false;
    }

    // 2. Check Search Query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const nameMatch = att.name?.toLowerCase().includes(q);
      const rollMatch = att.rollNumber?.toLowerCase().includes(q);
      const deptMatch = att.department?.toLowerCase().includes(q);
      const yearMatch = att.yearOfStudy?.toLowerCase().includes(q);
      if (!nameMatch && !rollMatch && !deptMatch && !yearMatch) return false;
    }

    return true;
  });

  // Export PDF Handler (Name, URK, Dept, Year, Check-in Time, Method)
  const exportPDF = () => {
    if (filteredAttendances.length === 0) return;
    const doc = new jsPDF();

    const currentEvt = events.find((e) => e.id === selectedEventId);
    const currentSess = sessions.find((s) => s.id === selectedSessionId);

    const titleText = `Attendance Report: ${currentEvt?.title || "Event"}`;
    const subtitleText = `Session: ${currentSess?.title || "Session"}`;

    doc.setFontSize(14);
    doc.text(titleText, 14, 15);
    doc.setFontSize(10);
    doc.text(subtitleText, 14, 22);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27);

    const tableRows = filteredAttendances.map((att) => [
      att.name || "N/A",
      att.rollNumber || "N/A",
      att.department || "N/A",
      att.yearOfStudy || "N/A",
      att.checkInTime
        ? new Date(att.checkInTime).toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })
        : "N/A",
      att.checkInMethod || "N/A",
    ]);

    autoTable(doc, {
      startY: 32,
      head: [["Name", "URK", "Dept", "Year", "Check-in Date & Time", "Method"]],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
    });

    const eventSlug = (currentEvt?.title || "event").replace(/[^a-zA-Z0-9]/g, "_");
    const sessionSlug = (currentSess?.title || "session").replace(/[^a-zA-Z0-9]/g, "_");
    doc.save(`${eventSlug}_${sessionSlug}_Attendance.pdf`);
  };

  // Export Excel Handler (Name, URK, Dept, Year, Check-in Date & Time, Method)
  const exportExcel = () => {
    if (filteredAttendances.length === 0) return;
    const currentEvt = events.find((e) => e.id === selectedEventId);
    const currentSess = sessions.find((s) => s.id === selectedSessionId);

    const excelData = filteredAttendances.map((att) => ({
      Name: att.name || "N/A",
      URK: att.rollNumber || "N/A",
      Dept: att.department || "N/A",
      Year: att.yearOfStudy || "N/A",
      "Check-in Date & Time": att.checkInTime
        ? new Date(att.checkInTime).toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })
        : "N/A",
      Method: att.checkInMethod || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    const eventSlug = (currentEvt?.title || "event").replace(/[^a-zA-Z0-9]/g, "_");
    const sessionSlug = (currentSess?.title || "session").replace(/[^a-zA-Z0-9]/g, "_");
    XLSX.writeFile(workbook, `${eventSlug}_${sessionSlug}_Attendance.xlsx`);
  };

  if (isLoadingEvents) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-3">
        <Loader2 className="animate-spin" size={32} />
        <p className="font-mono text-sm uppercase tracking-widest">Loading Events...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* ── Selection Controls ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Event Select */}
        <div className="border border-border bg-card p-4 space-y-2">
          <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2 font-semibold">
            <CalendarIcon size={14} />
            Target Event
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => handleEventChange(e.target.value)}
            disabled={isPending}
            className="w-full bg-surface-container border border-border text-foreground font-sans text-sm focus:outline-none focus:border-primary p-2.5 rounded-none uppercase tracking-wide cursor-pointer disabled:opacity-50"
          >
            <option value="">-- Select an Event --</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title} ({evt.date})
              </option>
            ))}
          </select>
        </div>

        {/* Session Select */}
        <div className="border border-border bg-card p-4 space-y-2">
          <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2 font-semibold">
            <Clock size={14} />
            Target Session
          </label>
          <select
            value={selectedSessionId}
            onChange={(e) => handleSessionChange(e.target.value)}
            disabled={!selectedEventId || isPending || sessions.length === 0}
            className="w-full bg-surface-container border border-border text-foreground font-sans text-sm focus:outline-none focus:border-primary p-2.5 rounded-none uppercase tracking-wide cursor-pointer disabled:opacity-50"
          >
            {sessions.length === 0 ? (
              <option value="">No sessions found</option>
            ) : (
              <option value="">-- Select a Session --</option>
            )}
            {sessions.map((sess) => (
              <option key={sess.id} value={sess.id}>
                {sess.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Filter & Search & Export Toolbar ───────────────────────────────────────── */}
      {selectedSessionId && (
        <div className="border border-border bg-card p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Left side: Filter Toggle & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Filter Toggle */}
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-muted-foreground shrink-0" />
                <div className="flex border border-border bg-surface-container p-0.5 w-full sm:w-auto">
                  <button
                    onClick={() => setFilterMode("ALL")}
                    className={`flex-1 sm:flex-none px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider font-bold transition-colors ${
                      filterMode === "ALL" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-container-high"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterMode("SCANNED")}
                    className={`flex-1 sm:flex-none px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider font-bold transition-colors flex items-center justify-center gap-1.5 ${
                      filterMode === "SCANNED" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-container-high"
                    }`}
                  >
                    <QrCode size={12} />
                    Scanned
                  </button>
                  <button
                    onClick={() => setFilterMode("MANUAL")}
                    className={`flex-1 sm:flex-none px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider font-bold transition-colors flex items-center justify-center gap-1.5 ${
                      filterMode === "MANUAL" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-container-high"
                    }`}
                  >
                    <Keyboard size={12} />
                    Manual
                  </button>
                </div>
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search name, URK, dept..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border text-foreground pl-9 pr-3 font-sans text-sm h-10 rounded-none shadow-none focus-visible:ring-1 focus-visible:ring-primary uppercase"
                />
              </div>
            </div>

            {/* Right side: Export PDF & Excel Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={exportPDF}
                disabled={filteredAttendances.length === 0}
                variant="outline"
                className="font-mono text-xs uppercase tracking-wider rounded-none h-10 px-4 shadow-none border-border hover:bg-surface-container flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <FileText size={14} className="text-destructive" />
                <span>Export PDF</span>
              </Button>
              <Button
                onClick={exportExcel}
                disabled={filteredAttendances.length === 0}
                variant="outline"
                className="font-mono text-xs uppercase tracking-wider rounded-none h-10 px-4 shadow-none border-border hover:bg-surface-container flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <FileSpreadsheet size={14} className="text-primary" />
                <span>Export Excel</span>
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* ── Data Grid ─────────────────────────────────────────────────────── */}
      {selectedSessionId && (
        <div className="border border-border bg-card">
          <div className="bg-surface-container px-6 py-3 border-b border-border flex justify-between items-center">
            <h3 className="font-mono text-xs uppercase tracking-widest text-foreground font-semibold">
              Attendance Records Log
              {isPending && <Loader2 size={12} className="inline ml-2 animate-spin text-primary" />}
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {filteredAttendances.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            {isPending && attendances.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                <p className="font-mono text-xs uppercase tracking-wider">Fetching records...</p>
              </div>
            ) : filteredAttendances.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest">
                No attendance records found.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground bg-surface-container/30">
                    <th className="py-3 px-4 font-semibold">Student Name</th>
                    <th className="py-3 px-4 font-semibold">URK (Roll No.)</th>
                    <th className="py-3 px-4 font-semibold">Department</th>
                    <th className="py-3 px-4 font-semibold">Year</th>
                    <th className="py-3 px-4 font-semibold">Check-in Time</th>
                    <th className="py-3 px-4 font-semibold text-right">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAttendances.map((att) => {
                    const timeStr = new Date(att.checkInTime).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    });
                    
                    const isScanned = att.checkInMethod === "SCANNED";

                    return (
                      <tr key={att.id} className="hover:bg-surface-container/20 transition-colors font-mono text-xs">
                        <td className="py-3 px-4 font-sans text-sm font-bold text-foreground">
                          {att.name}
                        </td>
                        <td className="py-3 px-4 uppercase text-muted-foreground">
                          {att.rollNumber || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {att.department || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {att.yearOfStudy || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                          {timeStr}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[9px] uppercase font-bold border ${
                            isScanned
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-tertiary/10 text-tertiary border-tertiary/20"
                          }`}>
                            {isScanned ? <QrCode size={10} /> : <Keyboard size={10} />}
                            {att.checkInMethod}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
