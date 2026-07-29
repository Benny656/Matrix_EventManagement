"use client";

import React, { useState, useTransition } from "react";
import { updateEventWhatsappLinkAction } from "@/actions/event";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Link as LinkIcon, Pencil, X, Check, ExternalLink } from "lucide-react";

interface EditWhatsappLinkFormProps {
  eventId: string;
  initialWhatsappInviteLink: string | null;
}

export default function EditWhatsappLinkForm({ eventId, initialWhatsappInviteLink }: EditWhatsappLinkFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState<string>(initialWhatsappInviteLink || "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    const trimmed = whatsappLink.trim();

    if (trimmed !== "") {
      if (!trimmed.startsWith("https://chat.whatsapp.com/") && !trimmed.startsWith("https://www.whatsapp.com/channel/")) {
        setError("WhatsApp link must start with https://chat.whatsapp.com/ or https://www.whatsapp.com/channel/");
        return;
      }
    }

    startTransition(async () => {
      try {
        const res = await updateEventWhatsappLinkAction(eventId, trimmed || null);
        if (res.success) {
          setIsEditing(false);
        }
      } catch (err: any) {
        setError(err.message || "Failed to update WhatsApp link");
      }
    });
  };

  const handleCancel = () => {
    setWhatsappLink(initialWhatsappInviteLink || "");
    setError(null);
    setIsEditing(false);
  };

  return (
    <div className="border border-border p-6 bg-card space-y-4">
      <div className="flex justify-between items-center border-b border-border pb-1">
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          WhatsApp Group Invite Link
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-primary hover:text-primary-container p-1 font-mono text-[10px] uppercase flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
            title="Edit WhatsApp Link"
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
          <LinkIcon size={16} className="text-muted-foreground shrink-0" />
          {initialWhatsappInviteLink ? (
            <a
              href={initialWhatsappInviteLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-primary hover:underline truncate flex items-center gap-1.5"
            >
              <span className="truncate">{initialWhatsappInviteLink}</span>
              <ExternalLink size={12} className="shrink-0" />
            </a>
          ) : (
            <div className="font-mono text-xs text-muted-foreground italic">
              No WhatsApp invite link set
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          <div className="flex flex-col gap-1">
            <Label
              className="font-mono text-[10px] text-muted-foreground uppercase"
              htmlFor="editWhatsappInput"
            >
              Group / Channel Invite Link
            </Label>
            <Input
              id="editWhatsappInput"
              type="url"
              placeholder="https://chat.whatsapp.com/..."
              value={whatsappLink}
              onChange={(e) => setWhatsappLink(e.target.value)}
              disabled={isPending}
              className="w-full bg-background border border-border text-foreground px-3 py-2 font-mono text-xs focus-visible:ring-1 focus-visible:ring-primary rounded-none shadow-none disabled:opacity-50 h-9"
            />
          </div>

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
