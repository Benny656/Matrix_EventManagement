"use client";

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

interface ReportDownloadButtonsProps {
  type: "registrations" | "attendance" | "session-attendance";
  eventId?: string;
  sessionId?: string;
}

export function ReportDownloadButtons({ type, eventId, sessionId }: ReportDownloadButtonsProps) {
  const buildUrl = (format: "csv" | "xlsx") => {
    const url = new URL(`/api/reports/${type}`, window.location.origin);
    if (eventId) url.searchParams.set("eventId", eventId);
    if (sessionId) url.searchParams.set("sessionId", sessionId);
    url.searchParams.set("format", format);
    return url.toString();
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(buildUrl("csv"), "_blank")}
      >
        <FileDown className="mr-1 h-3 w-3" />
        CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(buildUrl("xlsx"), "_blank")}
      >
        <FileDown className="mr-1 h-3 w-3" />
        Excel
      </Button>
    </div>
  );
}
