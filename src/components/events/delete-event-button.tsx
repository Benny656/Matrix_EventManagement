"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteEvent } from "@/actions/event.actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface DeleteEventButtonProps {
  eventId: string;
  eventTitle: string;
}

export function DeleteEventButton({ eventId, eventTitle }: DeleteEventButtonProps) {
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    const result = await deleteEvent(eventId);
    if (result.success) {
      toast.success("Event deleted successfully");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete Event"
        description={`Are you sure you want to delete "${eventTitle}"? This action cannot be undone and will remove all associated sessions and registrations.`}
        onConfirm={handleDelete}
        confirmLabel="Delete Event"
      />
    </>
  );
}
