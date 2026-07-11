"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { postUpdateAction } from "@/app/actions/update";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EventOption {
  id: string;
  title: string;
}

interface PostUpdateFormProps {
  events: EventOption[];
  backUrl: string;
}

export default function PostUpdateForm({ events, backUrl }: PostUpdateFormProps) {
  const router = useRouter();
  const [scope, setScope] = useState<"EVENT" | "DEPARTMENT">("EVENT");
  const [eventId, setEventId] = useState(events[0]?.id || "");
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError("Please write some content for the announcement.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await postUpdateAction({
          scope,
          eventId: scope === "EVENT" ? eventId : undefined,
          content: content.trim(),
        });

        if (res.success) {
          router.push(backUrl);
        }
      } catch (err: any) {
        setError(err.message || "Failed to post announcement.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-card p-6 space-y-6 max-w-2xl">
      {error && (
        <Alert variant="destructive" className="rounded-none border-destructive bg-destructive/5 text-destructive font-mono text-xs uppercase">
          <span className="material-symbols-outlined text-[16px] mr-2">error</span>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Scope Selector */}
      <div className="flex flex-col gap-1.5">
        <Label className="font-mono text-[10px] text-muted-foreground uppercase" htmlFor="scope-select">Announcement Scope</Label>
        <select
          id="scope-select"
          value={scope}
          onChange={(e) => setScope(e.target.value as any)}
          disabled={isPending}
          className="bg-background border border-border text-foreground px-3 py-3 font-mono text-xs focus:border-primary focus:outline-none transition-all rounded-none h-11"
        >
          <option value="EVENT">Scoped to Specific Event</option>
          <option value="DEPARTMENT">Department-Wide (Broadcast to all students)</option>
        </select>
      </div>

      {/* Conditional Event Select */}
      {scope === "EVENT" && (
        <div className="flex flex-col gap-1.5">
          <Label className="font-mono text-[10px] text-muted-foreground uppercase" htmlFor="event-select">Target Event</Label>
          <select
            id="event-select"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            disabled={isPending}
            className="bg-background border border-border text-foreground px-3 py-3 font-mono text-xs focus:border-primary focus:outline-none transition-all rounded-none h-11"
          >
            {events.length === 0 ? (
              <option value="">No Active Events Found</option>
            ) : (
              events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))
            )}
          </select>
        </div>
      )}

      {/* Content Textarea */}
      <div className="flex flex-col gap-1.5">
        <Label className="font-mono text-[10px] text-muted-foreground uppercase" htmlFor="content-input">Announcement Content</Label>
        <textarea
          id="content-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isPending}
          rows={6}
          className="w-full bg-background border border-border text-foreground p-3 font-sans text-sm focus:border-primary focus:outline-none transition-all rounded-none resize-y min-h-[120px]"
          placeholder="Write updates, instructions, rooms allocation, or scheduling announcements..."
        />
      </div>

      {/* Submit Button */}
      <div className="flex gap-4 pt-4 border-t border-border">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest py-6 px-8 hover:bg-primary-container active:scale-95 transition-all h-11 rounded-none shadow-none"
        >
          {isPending ? "PUBLISHING..." : "Publish Announcement"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(backUrl)}
          disabled={isPending}
          className="border-border text-foreground font-mono text-xs uppercase tracking-wider py-6 px-8 hover:bg-surface-container active:scale-95 transition-all h-11 rounded-none shadow-none"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
