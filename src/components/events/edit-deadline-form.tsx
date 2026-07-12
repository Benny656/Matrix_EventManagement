"use client";

import React, { useState, useTransition } from "react";
import { updateEventDeadlineAction } from "@/actions/event";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Calendar, Pencil, X, Check } from "lucide-react";

interface EditDeadlineFormProps {
  eventId: string;
  initialDeadline: Date | null;
}

export default function EditDeadlineForm({ eventId, initialDeadline }: EditDeadlineFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [noDeadline, setNoDeadline] = useState(!initialDeadline);
  
  // Format initial date for input field
  const getLocalDateString = (date: Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [deadlineStr, setDeadlineStr] = useState(getLocalDateString(initialDeadline));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    
    if (!noDeadline && !deadlineStr) {
      setError("Please select a date or check 'No Cutoff'.");
      return;
    }

    startTransition(async () => {
      try {
        const targetDate = noDeadline ? null : new Date(deadlineStr);
        const res = await updateEventDeadlineAction(eventId, targetDate);
        if (res.success) {
          setIsEditing(false);
        }
      } catch (err: any) {
        setError(err.message || "Failed to update deadline");
      }
    });
  };

  const handleCancel = () => {
    setNoDeadline(!initialDeadline);
    setDeadlineStr(getLocalDateString(initialDeadline));
    setError(null);
    setIsEditing(false);
  };

  const formattedCurrentDeadline = initialDeadline
    ? new Date(initialDeadline).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "No registration cutoff (Open indefinitely)";

  return (
    <div className="border border-border p-6 bg-card space-y-4">
      <div className="flex justify-between items-center border-b border-border pb-1">
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          Registration Cutoff
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-primary hover:text-primary-container p-1 font-mono text-[10px] uppercase flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
            title="Edit deadline"
          >
            <Pencil size={12} />
            Modify
          </button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-none border-destructive bg-destructive/5 text-destructive font-mono text-xs uppercase p-3">
          <AlertCircle size={14} className="mr-2 shrink-0" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isEditing ? (
        <div className="flex items-center gap-3 py-1">
          <Calendar size={16} className="text-muted-foreground shrink-0" />
          <div className="font-mono text-xs text-foreground font-medium">
            {formattedCurrentDeadline}
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {/* Checkbox for No Cutoff */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editNoDeadline"
              checked={noDeadline}
              onChange={(e) => setNoDeadline(e.target.checked)}
              disabled={isPending}
              className="h-4 w-4 border-border rounded-none text-primary bg-background focus:ring-primary"
            />
            <Label
              className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider cursor-pointer"
              htmlFor="editNoDeadline"
            >
              No cutoff (open registration)
            </Label>
          </div>

          {/* Date Picker Input */}
          <div className="flex flex-col gap-1">
            <Label
              className="font-mono text-[10px] text-muted-foreground uppercase"
              htmlFor="editDeadlineInput"
            >
              Cutoff Date
            </Label>
            <Input
              id="editDeadlineInput"
              type="date"
              value={deadlineStr}
              onChange={(e) => setDeadlineStr(e.target.value)}
              disabled={noDeadline || isPending}
              className="w-full bg-background border border-border text-foreground px-3 py-2 font-mono text-xs focus-visible:ring-1 focus-visible:ring-primary rounded-none shadow-none disabled:opacity-50 h-9"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="border border-border bg-background text-foreground hover:bg-muted font-mono text-[10px] uppercase tracking-wider px-3 py-2 flex items-center gap-1 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <X size={12} />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/80 font-mono text-[10px] uppercase tracking-wider px-3 py-2 flex items-center gap-1 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <span>Updating...</span>
              ) : (
                <>
                  <Check size={12} />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
