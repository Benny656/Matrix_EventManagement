"use client";

import React, { useState, useTransition } from "react";
import { updateEventCapacityAction } from "@/actions/event";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Users, Pencil, X, Check } from "lucide-react";

interface EditCapacityFormProps {
  eventId: string;
  initialCapacity: number;
}

export default function EditCapacityForm({ eventId, initialCapacity }: EditCapacityFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [capacity, setCapacity] = useState<number>(initialCapacity);
  const [capacityStr, setCapacityStr] = useState<string>(String(initialCapacity));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    const parsedCapacity = parseInt(capacityStr, 10);
    
    if (isNaN(parsedCapacity) || parsedCapacity < 1) {
      setError("Capacity must be at least 1.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await updateEventCapacityAction(eventId, parsedCapacity);
        if (res.success) {
          setCapacity(parsedCapacity);
          setIsEditing(false);
        }
      } catch (err: any) {
        setError(err.message || "Failed to update capacity");
      }
    });
  };

  const handleCancel = () => {
    setCapacityStr(String(capacity));
    setError(null);
    setIsEditing(false);
  };

  return (
    <div className="border border-border p-6 bg-card space-y-4">
      <div className="flex justify-between items-center border-b border-border pb-1">
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          Event Capacity
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-primary hover:text-primary-container p-1 font-mono text-[10px] uppercase flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
            title="Edit capacity"
          >
            <Pencil size={12} className="shrink-0" />
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
          <Users size={16} className="text-muted-foreground shrink-0" />
          <div className="font-mono text-xs text-foreground font-medium">
            {capacity} {capacity === 1 ? "Attendee" : "Attendees"} max capacity limit
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {/* Capacity Input */}
          <div className="flex flex-col gap-1">
            <Label
              className="font-mono text-[10px] text-muted-foreground uppercase"
              htmlFor="editCapacityInput"
            >
              Capacity Limit
            </Label>
            <Input
              id="editCapacityInput"
              type="number"
              min="1"
              value={capacityStr}
              onChange={(e) => setCapacityStr(e.target.value)}
              disabled={isPending}
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
              <X size={12} className="shrink-0" />
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
                  <Check size={12} className="shrink-0" />
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
