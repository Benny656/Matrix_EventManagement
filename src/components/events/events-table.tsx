"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { archiveEventAction, updateEventRegistrationStatusAction } from "@/actions/event";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, AlertCircle, Pencil, Archive, Lock, Unlock } from "lucide-react";

interface Session {
  id: string;
  title: string;
  startTime: Date;
  endTime?: Date | null;
}

interface EventWithSessions {
  id: string;
  title: string;
  description: string;
  date: Date;
  registrationOpen: boolean;
  maxParticipants?: number | null;
  category: string;
  coordinatorName: string;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "ARCHIVED";
  archivedAt: Date | null;
  sessions: Session[];
  _count: {
    registrations: number;
    volunteers?: number;
  };
}

interface EventsTableProps {
  initialEvents: EventWithSessions[];
  role: "ADMIN" | "VOLUNTEER";
}

import { usePersistentUIState } from "@/lib/use-ui-state";

export default function EventsTable({ initialEvents, role }: EventsTableProps) {
  const [events, setEvents] = useState<EventWithSessions[]>(initialEvents);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = usePersistentUIState<"ACTIVE" | "ARCHIVED">("events_table_active_tab", "ACTIVE");
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

  const handleToggleRegistration = async (id: string, currentOpen: boolean) => {
    setError(null);
    startTransition(async () => {
      try {
        const nextState = !currentOpen;
        const res = await updateEventRegistrationStatusAction(id, nextState);
        if (res.success) {
          setEvents((prev) =>
            prev.map((e) => (e.id === id ? { ...e, registrationOpen: nextState } : e))
          );
        }
      } catch (err: any) {
        setError(err.message || "Failed to toggle registration status");
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
        <div className="hidden md:grid grid-cols-12 border-b border-border bg-surface-container px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
          <div className="col-span-4">Event Title</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Registrations</div>
          <div className="col-span-2 text-right">Actions</div>
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
                <div key={event.id} className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-2 px-4 py-4 font-mono text-xs items-stretch md:items-center hover:bg-surface-container-low/50 border-b border-border last:border-b-0 md:border-b-0">
                  {/* Title & Category */}
                  <div className="md:col-span-4 pr-4 flex flex-col">
                    <span className="text-[10px] text-primary uppercase font-bold tracking-widest">{event.category}</span>
                    <h4 className="font-sans text-sm font-bold text-foreground mt-0.5 line-clamp-2">{event.title}</h4>
                  </div>

                  {/* Mobile Meta Grid */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/45 md:border-t-0 md:pt-0 md:col-span-6 md:grid md:grid-cols-6">
                    {/* Date */}
                    <div className="text-muted-foreground uppercase md:col-span-2">{dateStr}</div>

                    {/* Status Badge */}
                    <div className="md:col-span-2">
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

                    {/* Registrations & Volunteers */}
                    <div className="text-left md:text-right text-foreground font-semibold md:col-span-2 md:pr-2 flex flex-col md:items-end">
                      <div>
                        <span className="inline md:hidden text-muted-foreground text-[10px] uppercase font-normal mr-1">RSVPs:</span>
                        {event.maxParticipants ? `${event._count.registrations} / ${event.maxParticipants}` : `${event._count.registrations} (∞)`}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-normal block mt-0.5">
                        Volunteers: {event._count.volunteers ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-2 text-right flex items-center justify-end gap-2.5 pt-2 border-t border-border/45 md:border-t-0 md:pt-0">
                    {role === "ADMIN" && event.status !== "ARCHIVED" && (
                      <button
                        onClick={() => handleToggleRegistration(event.id, event.registrationOpen)}
                        disabled={isPending}
                        className={`px-2 py-1 font-mono text-[9px] uppercase font-bold border transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1 ${
                          event.registrationOpen
                            ? "bg-primary/10 text-primary border-primary/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                            : "bg-destructive/10 text-destructive border-destructive/30 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                        }`}
                        title={event.registrationOpen ? "Click to Close Registration" : "Click to Open Registration"}
                      >
                        {event.registrationOpen ? (
                          <>
                            <Unlock size={10} />
                            <span>REG: OPEN</span>
                          </>
                        ) : (
                          <>
                            <Lock size={10} />
                            <span>REG: CLOSED</span>
                          </>
                        )}
                      </button>
                    )}

                    <Link
                      href={role === "ADMIN" ? `/admin/events/${event.id}` : `/volunteer/events/${event.id}`}
                      className="flex-1 md:flex-none py-2.5 md:p-1 border border-border md:border-none hover:text-primary hover:bg-surface-container md:hover:bg-transparent transition-colors flex items-center justify-center gap-1.5 md:gap-0 font-mono text-[10px] md:text-xs uppercase h-10 md:h-auto min-h-[40px] md:min-h-0"
                      title={role === "ADMIN" ? "Manage Details" : "View Details"}
                    >
                      <Pencil size={14} />
                      <span className="inline md:hidden">{role === "ADMIN" ? "Manage" : "View"}</span>
                    </Link>

                    {event.status !== "ARCHIVED" && role === "ADMIN" && (
                      <button
                        onClick={() => handleArchive(event.id)}
                        disabled={isPending}
                        className="flex-1 md:flex-none py-2.5 md:p-1 border border-destructive/20 md:border-none text-destructive hover:text-red-700 hover:bg-destructive/5 md:hover:bg-transparent transition-colors flex items-center justify-center gap-1.5 md:gap-0 font-mono text-[10px] md:text-xs uppercase disabled:opacity-50 h-10 md:h-auto min-h-[40px] md:min-h-0 cursor-pointer"
                        title="Archive Event"
                      >
                        <Archive size={14} />
                        <span className="inline md:hidden">Archive</span>
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
