"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search, CalendarDays } from "lucide-react";

interface Session {
  id: string;
  startTime: Date;
  endTime?: Date | null;
}

interface EventItem {
  id: string;
  title: string;
  description: string;
  date: Date;
  registrationOpen: boolean;
  maxParticipants?: number | null;
  category: string;
  coordinatorName: string;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "ARCHIVED";
  sessions: Session[];
  _count: {
    registrations: number;
    volunteers: number;
  };
}

export default function StudentEventList({ events }: { events: EventItem[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");

  const filtered = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "ALL" || e.category === category;
    return matchesSearch && matchesCategory;
  });

  const categories = ["ALL", ...Array.from(new Set(events.map((e) => e.category)))];

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-card p-4 border border-border">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background font-mono text-xs border-border"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all border ${
                category === cat
                  ? "bg-primary text-primary-foreground border-primary font-bold"
                  : "bg-surface-container text-muted-foreground border-border hover:bg-surface-container-high hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      {filtered.length === 0 ? (
        <div className="border border-border bg-card p-12 text-center text-muted-foreground font-mono text-xs uppercase">
          No events found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((event) => {
            const isFull = event.maxParticipants ? event._count.registrations >= event.maxParticipants : false;
            const isOpen = event.registrationOpen;
            const dateStr = new Date(event.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <article key={event.id} className="border border-border bg-card flex flex-col hover:border-primary transition-all duration-200">
                <div className="bg-surface-container px-4 py-2 border-b border-border flex justify-between items-center">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{event.category}</span>
                  <span className={`px-2 py-[2px] font-mono text-[9px] uppercase font-semibold border ${
                    event.status === "UPCOMING"
                      ? "bg-secondary-container text-on-secondary-container border-border"
                      : event.status === "ONGOING"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border"
                  }`}>
                    {event.status}
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground line-clamp-1">{event.title}</h3>
                    <p className="font-sans text-xs text-muted-foreground mt-2 line-clamp-2">{event.description}</p>
                  </div>

                  <div className="mt-6 space-y-2 font-mono text-[11px] text-muted-foreground border-t border-border pt-3">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={12} />
                      <span>{dateStr}</span>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-border bg-surface-container-low">
                  <Link
                    href={`/student/events/${event.id}`}
                    className="w-full bg-background border border-border text-foreground hover:bg-surface-container font-mono text-xs uppercase tracking-wider py-2 flex items-center justify-center gap-1 active:scale-98 transition-all"
                  >
                    View & Register
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
