"use client";

import { useState } from "react";
import { toast } from "sonner";
import { promoteToVolunteer, demoteToStudent } from "@/actions/volunteer.actions";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface VolunteerActionsProps {
  userId: string;
  currentRole: "STUDENT" | "VOLUNTEER";
}

export function VolunteerActions({ userId, currentRole }: VolunteerActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async () => {
    setIsLoading(true);
    try {
      const result =
        currentRole === "STUDENT"
          ? await promoteToVolunteer(userId)
          : await demoteToStudent(userId);

      if (result.success) {
        toast.success(
          currentRole === "STUDENT"
            ? "Promoted to volunteer"
            : "Demoted to student"
        );
        window.location.reload();
      } else {
        toast.error(result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={currentRole === "STUDENT" ? "default" : "destructive"}
      size="sm"
      onClick={handleAction}
      disabled={isLoading}
    >
      {isLoading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
      {currentRole === "STUDENT" ? "Promote" : "Demote"}
    </Button>
  );
}
