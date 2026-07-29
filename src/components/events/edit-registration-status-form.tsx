"use client";

import React, { useState, useTransition } from "react";
import { updateEventRegistrationStatusAction } from "@/actions/event";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Pencil, X, Check } from "lucide-react";

interface EditRegistrationStatusFormProps {
  eventId: string;
  initialRegistrationOpen: boolean;
}

export default function EditRegistrationStatusForm({ eventId, initialRegistrationOpen }: EditRegistrationStatusFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(initialRegistrationOpen);
  
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await updateEventRegistrationStatusAction(eventId, registrationOpen);
        if (res.success) {
          setIsEditing(false);
        }
      } catch (err: any) {
        setError(err.message || "Failed to update registration status");
      }
    });
  };

  const handleCancel = () => {
    setRegistrationOpen(initialRegistrationOpen);
    setError(null);
    setIsEditing(false);
  };

  const formattedStatus = initialRegistrationOpen ? "Open" : "Closed";

  return (
    <div className="border border-border p-6 bg-card space-y-4">
      <div className="flex justify-between items-center border-b border-border pb-1">
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          Registration Status
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-primary hover:text-primary-container p-1 font-mono text-[10px] uppercase flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
            title="Edit status"
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
          <div className="font-mono text-xs text-foreground font-medium">
            {formattedStatus}
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="editRegistrationOpen"
              checked={registrationOpen}
              onChange={(e) => setRegistrationOpen(e.target.checked)}
              disabled={isPending}
              className="h-5 w-5 border-border rounded-sm text-primary bg-background focus:ring-primary cursor-pointer"
            />
            <Label
              className="font-mono text-[13px] text-foreground tracking-wider cursor-pointer"
              htmlFor="editRegistrationOpen"
            >
              Open for Registration
            </Label>
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
