import React from "react";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, TriangleAlert, RefreshCw } from "lucide-react";

export default function StudentDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Upcoming Events Section */}
      <section className="space-y-4">
        <header className="flex justify-between items-end border-b border-border pb-1">
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Upcoming Registrations</h2>
          <span className="font-mono text-[11px] text-muted-foreground">SEQ-01</span>
        </header>
        
        <div className="flex overflow-x-auto gap-4 pb-2 hide-scrollbar">
          {/* Card 1 */}
          <article className="min-w-[300px] md:min-w-[380px] border border-border bg-card flex flex-col shrink-0">
            <div className="bg-surface-container px-4 py-2 border-b border-border flex justify-between items-center">
              <span className="font-mono text-xs text-muted-foreground">EVT-892</span>
              <span className="px-2 py-[2px] bg-tertiary text-on-tertiary font-mono text-[10px] uppercase font-semibold">Confirmed</span>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-heading text-lg font-bold text-foreground mb-4">Neural Architecture Search Workshop</h3>
              <div className="mt-auto space-y-2 font-mono text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarDays size={13} className="text-muted-foreground" />
                  <span>OCT 24 / 14:00 – 17:00</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-muted-foreground" />
                  <span>Lab 4B – Sector 7</span>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-border">
              <Button variant="outline" className="w-full border-muted-foreground text-muted-foreground font-mono text-xs uppercase hover:bg-surface-container rounded-none shadow-none h-9">
                View Details
              </Button>
            </div>
          </article>

          {/* Card 2 */}
          <article className="min-w-[300px] md:min-w-[380px] border border-border bg-card flex flex-col shrink-0">
            <div className="bg-surface-container px-4 py-2 border-b border-border flex justify-between items-center">
              <span className="font-mono text-xs text-muted-foreground">EVT-904</span>
              <span className="px-2 py-[2px] bg-secondary-container text-on-secondary-container border border-border font-mono text-[10px] uppercase font-semibold">Waitlisted</span>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-heading text-lg font-bold text-foreground mb-4">Ethics in Gen AI Seminars</h3>
              <div className="mt-auto space-y-2 font-mono text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarDays size={13} className="text-muted-foreground" />
                  <span>NOV 02 / 09:00 – 11:30</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-muted-foreground" />
                  <span>Main Auditorium</span>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-border">
              <Button variant="outline" className="w-full border-muted-foreground text-muted-foreground font-mono text-xs uppercase hover:bg-surface-container rounded-none shadow-none h-9">
                Check Status
              </Button>
            </div>
          </article>
        </div>
      </section>

      {/* Latest Updates Bento */}
      <section className="space-y-4">
        <header className="flex justify-between items-end border-b border-border pb-1">
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">System Updates</h2>
          <span className="font-mono text-[11px] text-muted-foreground">LOG-REQ</span>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Update 1: High Priority */}
          <div className="col-span-1 md:col-span-8 border border-border bg-card flex flex-col">
            <div className="bg-primary-container text-on-primary-container px-4 py-2 border-b border-border flex items-center gap-2">
              <TriangleAlert size={14} className="shrink-0" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">Department-wide Notice</span>
            </div>
            <div className="p-4 flex-grow">
              <h3 className="font-heading text-base font-bold text-foreground mb-2">New Lab Equipment Commissioning</h3>
              <p className="font-sans text-sm text-muted-foreground">
                The new quantum computing rigs in Lab 4B are now online. All registered users must complete the updated safety protocol certification before requesting access timeslots.
              </p>
            </div>
            <div className="px-4 py-2 border-t border-border bg-surface-container flex justify-between items-center">
              <span className="font-mono text-[11px] text-muted-foreground">T-MINUS 24H</span>
              <button className="text-primary font-mono text-xs uppercase hover:underline font-semibold">Read Protocol</button>
            </div>
          </div>

          {/* Update 2: Event Specific */}
          <div className="col-span-1 md:col-span-4 border border-border bg-card flex flex-col">
            <div className="bg-surface-container px-4 py-2 border-b border-border flex items-center gap-2">
              <RefreshCw size={14} className="shrink-0" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">Event Specific</span>
            </div>
            <div className="p-4 flex-grow">
              <h3 className="font-heading text-base font-bold text-foreground mb-2">Session Relocation</h3>
              <p className="font-sans text-sm text-muted-foreground font-medium">
                &ldquo;Transformers: Deep Dive&rdquo; has been moved from Room 204 to Lecture Hall B due to capacity limits.
              </p>
            </div>
            <div className="px-4 py-2 border-t border-border bg-surface-container-low">
              <span className="font-mono text-[11px] text-muted-foreground">REF: EVT-881</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
