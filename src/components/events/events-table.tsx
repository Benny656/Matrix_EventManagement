"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { archiveEventAction } from "@/actions/event";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, AlertCircle, Pencil, Archive } from "lucide-react";

interface Session {
  id: string;
  title: string;
  venue: string;
  startTime: Date;
  endTime: Date;
}

interface EventWithSessions {
  id: string;
  title: string;
  description: string;
  venue: string;
  date: Date;
  registrationDeadline: Date;
  maxParticipants: number;
  category: string;
  coordinatorName: string;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "ARCHIVED";
  archivedAt: Date | null;
  sessions: Session[];
  _count: {
    registrations: number;
  };
}

interface EventsTableProps {
  initialEvents: EventWithSessions[];
  role: "ADMIN" | "VOLUNTEER";
}

export default function EventsTable({ initialEvents, role }: EventsTableProps) {
  const [events, setEvents] = useState<EventWithSessions[]>(initialEvents);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleArchive = async (id: string) => {
    setError(null);
    if (!confirm("Are you sure you want to archive this event?")) return;

    startTransition(async () => {
      try {
        const res = await archiveEventAction(id);
        if (res.success) {
          // Update local state
          setEvents((prev) =>
            prev.map((e) =>
              e.id === id ? { ...e, status: "ARCHIVED" as const, archivedAt: new Date() } : e
            )
          );
        }
      } catch (err: any) {
        setError(err.message || "Failed to archive event");
      }
    });
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase()) || 
                          event.category.toLowerCase().includes(search.toLowerCase());
    
    const matchesTab = activeTab === "ACTIVE" 
      ? event.status !== "ARCHIVED" 
      : event.status === "ARCHIVED";

    return matchesSearch && matchesTab;
  });

  const activeCount = events.filter((e) => e.status !== "ARCHIVED").length;
  const archivedCount = events.filter((e) => e.status === "ARCHIVED").length;

  return (
    <div className="space-y-6">
      {/* Controls / Filter Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-4 bg-background">
        <div className="relative w-full max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search size={14} />
          </span>
          <Input
            className="w-full bg-surface-container-low border border-border pl-10 pr-4 py-2 font-mono text-xs rounded-none shadow-none h-9"
            placeholder="Search events by title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tab Selection */}
        <div className="flex border border-border">
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`px-6 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
              activeTab === "ACTIVE"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:bg-surface-container-low"
            }`}
          >
            Active
            <span className="font-mono text-[10px] ml-2 opacity-70">({activeCount})</span>
          </button>
          <button
            onClick={() => setActiveTab("ARCHIVED")}
            className={`px-6 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
              activeTab === "ARCHIVED"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:bg-surface-container-low"
            }`}
          >
            Archived
            <span className="font-mono text-[10px] ml-2 opacity-70">({archivedCount})</span>
          </button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-none border-destructive bg-destructive/5 text-destructive font-mono text-xs uppercase">
          <AlertCircle size={14} className="mr-2 shrink-0" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Grid Canvas */}
      <div className="border border-border bg-card">
        {/* Table Header */}
        <div className="grid grid-cols-12 border-b border-border bg-surface-container px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
          <div className="col-span-5">Event Title</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Registrations</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Table Rows */}
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground font-mono text-xs uppercase">
            No events found matching current filters.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredEvents.map((event) => {
              const dateStr = new Date(event.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div key={event.id} className="grid grid-cols-12 gap-2 px-4 py-4 font-mono text-xs items-center hover:bg-surface-container-low/50">
                  {/* Title & Category */}
                  <div className="col-span-5 pr-4">
                    <span className="text-[10px] text-primary uppercase font-bold tracking-widest">{event.category}</span>
                    <h4 className="font-sans text-sm font-bold text-foreground mt-0.5 line-clamp-1">{event.title}</h4>
                    <span className="text-muted-foreground text-[10px] block mt-0.5">Location: {event.venue}</span>
                  </div>

                  {/* Date */}
                  <div className="col-span-2 text-muted-foreground uppercase">{dateStr}</div>

                  {/* Status Badge */}
                  <div className="col-span-2">
                    <span className={`px-2 py-0.5 text-[9px] uppercase font-semibold border ${
                      event.status === "UPCOMING"
                        ? "bg-secondary-container text-on-secondary-container border-border"
                        : event.status === "ONGOING"
                        ? "bg-primary text-primary-foreground border-primary"
                        : event.status === "COMPLETED"
                        ? "bg-muted text-muted-foreground border-border"
                        : "bg-surface-container text-muted-foreground border-border"
                    }`}>
                      {event.status}
                    </span>
                  </div>

                  {/* Registrations */}
                  <div className="col-span-2 text-right text-foreground pr-2 font-semibold">
                    {event._count.registrations} / {event.maxParticipants}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 text-right flex items-center justify-end gap-1">
                    <Link
                      href={role === "ADMIN" ? `/admin/events/${event.id}` : `/volunteer/events/${event.id}`}
                      className="p-1 hover:text-primary transition-colors flex items-center"
                      title="Manage Details"
                    >
                      <Pencil size={14} />
                    </Link>

                    {event.status !== "ARCHIVED" && (
                      <button
                        onClick={() => handleArchive(event.id)}
                        disabled={isPending}
                        className="p-1 text-destructive hover:text-red-700 transition-colors flex items-center disabled:opacity-50"
                        title="Archive Event"
                      >
                        <Archive size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
