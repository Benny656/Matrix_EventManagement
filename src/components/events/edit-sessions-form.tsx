"use client";

import React, { useState, useTransition } from "react";
import { addSessionAction, updateSessionAction, deleteSessionAction } from "@/actions/event";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus, Edit2, Trash2, Loader2, Clock } from "lucide-react";

export interface SessionWithAttendance {
  id: string;
  eventId: string;
  title: string;
  startTime: string;
  endTime?: string | null;
  attendances?: any[];
}

interface EditSessionsFormProps {
  eventId: string;
  sessions: SessionWithAttendance[];
}

const toLocalDatetimeInput = (isoStr?: string | null) => {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function EditSessionsForm({ eventId, sessions }: EditSessionsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionWithAttendance | null>(null);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const openAddModal = () => {
    setError(null);
    setEditingSession(null);
    setTitle("");
    setStartTime("");
    setEndTime("");
    setIsModalOpen(true);
  };

  const openEditModal = (session: SessionWithAttendance) => {
    setError(null);
    setEditingSession(session);
    setTitle(session.title || "");
    setStartTime(toLocalDatetimeInput(session.startTime));
    setEndTime(toLocalDatetimeInput(session.endTime));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSession(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Session title is required.");
      return;
    }
    if (!startTime) {
      setError("Start time is required.");
      return;
    }

    startTransition(async () => {
      try {
        if (editingSession) {
          const res = await updateSessionAction(editingSession.id, {
            title: title.trim(),
            startTime,
            endTime: endTime ? endTime : null,
          });
          if (res.success) {
            closeModal();
          }
        } else {
          const res = await addSessionAction(eventId, {
            title: title.trim(),
            startTime,
            endTime: endTime ? endTime : null,
          });
          if (res.success) {
            closeModal();
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to save session.");
      }
    });
  };

  const handleDelete = async (session: SessionWithAttendance) => {
    if (!confirm(`Are you sure you want to delete session "${session.title}"?`)) return;

    setError(null);
    startTransition(async () => {
      try {
        await deleteSessionAction(session.id);
      } catch (err: any) {
        setError(err.message || "Failed to delete session.");
      }
    });
  };

  return (
    <div className="border border-border p-6 bg-card space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-2">
          <Clock size={14} />
          Event Sessions Timeline
        </h3>
        <Button
          type="button"
          onClick={openAddModal}
          size="sm"
          className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider h-8 rounded-none shadow-none cursor-pointer"
        >
          <Plus size={14} className="mr-1" /> Add Session
        </Button>
      </div>

      {error && !isModalOpen && (
        <Alert variant="destructive" className="rounded-none border-destructive bg-destructive/5 text-destructive font-mono text-xs uppercase">
          <AlertCircle size={14} className="mr-2 shrink-0" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {sessions.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-border bg-surface-container/20">
          <p className="font-mono text-xs text-muted-foreground uppercase mb-3">
            No session blocks scheduled yet.
          </p>
          <Button
            type="button"
            onClick={openAddModal}
            variant="outline"
            size="sm"
            className="font-mono text-xs uppercase tracking-wider border-border rounded-none h-8 shadow-none"
          >
            <Plus size={14} className="mr-1" /> Add First Session
          </Button>
        </div>
      ) : (
        <div className="relative border-l border-border pl-6 ml-2 space-y-6">
          {sessions.map((sess) => {
            const startStr = sess.startTime
              ? new Date(sess.startTime).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })
              : "";
            const endStr = sess.endTime
              ? new Date(sess.endTime).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })
              : null;
            const dateStr = sess.startTime
              ? new Date(sess.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "";
            const scanCount = sess.attendances ? sess.attendances.length : 0;

            return (
              <div key={sess.id} className="relative group">
                <span className="absolute -left-[31px] top-1.5 w-2 h-2 bg-primary rounded-full ring-4 ring-background"></span>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="font-mono text-[10px] text-primary uppercase font-bold tracking-wider">
                      {dateStr} / {startStr}{endStr ? ` - ${endStr}` : ""}
                    </span>
                    <h4 className="font-sans text-sm font-bold text-foreground mt-0.5">{sess.title}</h4>
                    <span className="font-mono text-[10px] text-muted-foreground block mt-1">
                      Arrivals: {scanCount} Scanned
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(sess)}
                      disabled={isPending}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-none"
                      title="Edit Session"
                    >
                      <Edit2 size={13} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(sess)}
                      disabled={isPending}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive rounded-none"
                      title="Delete Session"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-md w-full p-6 space-y-4 shadow-xl rounded-none">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-heading text-lg font-bold text-foreground">
                {editingSession ? "Edit Session" : "Add New Session"}
              </h3>
            </div>

            {error && (
              <Alert variant="destructive" className="rounded-none border-destructive bg-destructive/5 text-destructive font-mono text-xs uppercase">
                <AlertCircle size={14} className="mr-2 shrink-0" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="sessionTitle" className="text-muted-foreground uppercase text-[11px]">
                  Session Title *
                </Label>
                <Input
                  id="sessionTitle"
                  placeholder="e.g. Keynote Speech / Workshop"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="bg-background rounded-none border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sessionStart" className="text-muted-foreground uppercase text-[11px]">
                  Start Date & Time *
                </Label>
                <Input
                  id="sessionStart"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="bg-background rounded-none border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sessionEnd" className="text-muted-foreground uppercase text-[11px]">
                  End Date & Time (Optional)
                </Label>
                <Input
                  id="sessionEnd"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-background rounded-none border-border"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={isPending}
                  className="flex-1 border-border font-mono text-xs uppercase tracking-wider rounded-none h-10 shadow-none"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider rounded-none h-10 shadow-none cursor-pointer"
                >
                  {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin shrink-0" />
                      <span>Saving...</span>
                    </span>
                  ) : editingSession ? (
                    "Update Session"
                  ) : (
                    "Add Session"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
