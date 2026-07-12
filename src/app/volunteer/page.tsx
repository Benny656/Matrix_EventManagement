"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Megaphone } from "lucide-react";

export default function VolunteerDashboardPage() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground tracking-tighter mb-1">
            Volunteer Terminal
          </h1>
          <p className="font-sans text-sm text-muted-foreground">
            System operations nominal. Active events require monitoring.
          </p>
        </div>
        <div className="flex gap-2 font-mono text-[11px] text-muted-foreground">
          <div className="border border-border px-3 py-1 bg-surface-container">
            SYS.TIME: <span className="text-foreground font-bold">{time || "00:00:00"}</span>
          </div>
          <div className="border border-border px-3 py-1 bg-surface-container">
            STATUS: <span className="text-primary font-bold">ONLINE</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-border bg-card p-4">
          <div className="font-mono text-[10px] text-muted-foreground mb-1">TOTAL HOURS</div>
          <div className="font-heading text-2xl font-bold text-foreground">124.5</div>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="font-mono text-[10px] text-muted-foreground mb-1">EVENTS ORGANIZED</div>
          <div className="font-heading text-2xl font-bold text-foreground">12</div>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="font-mono text-[10px] text-muted-foreground mb-1">ATTENDEES SCANNED</div>
          <div className="font-heading text-2xl font-bold text-foreground">843</div>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="font-mono text-[10px] text-muted-foreground mb-1">RATING AVG</div>
          <div className="font-heading text-2xl font-bold text-primary">4.9/5</div>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active deployments */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-1">
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Active Deployments</h2>
            <Link href="/volunteer/events" className="font-mono text-[11px] text-primary hover:underline uppercase font-semibold">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {/* Card 1 */}
            <div className="border border-border bg-card p-0 hover:bg-surface-container transition-colors">
              <div className="flex items-stretch">
                <div className="w-1 bg-primary"></div>
                <div className="p-4 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] text-muted-foreground">EVT-892</span>
                      <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-[2px] font-mono text-[9px] uppercase font-semibold">
                        Ongoing
                      </span>
                    </div>
                    <h3 className="font-heading text-base font-bold text-foreground">
                      Neural Architecture Search Workshop
                    </h3>
                    <p className="font-mono text-xs text-muted-foreground mt-1">
                      Lab 4B • Oct 24 • 14:00 - 17:00
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href="/volunteer/scan" className="bg-primary text-primary-foreground font-mono text-[11px] uppercase tracking-wider py-2 px-4 hover:bg-primary-container active:scale-95 transition-all text-center">
                      Launch Scanner
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="border border-border bg-card p-0 hover:bg-surface-container transition-colors">
              <div className="flex items-stretch">
                <div className="w-1 bg-secondary"></div>
                <div className="p-4 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] text-muted-foreground">EVT-904</span>
                      <span className="bg-secondary-container text-on-secondary-container border border-border px-2 py-[2px] font-mono text-[9px] uppercase font-semibold">
                        Upcoming
                      </span>
                    </div>
                    <h3 className="font-heading text-base font-bold text-foreground">
                      Ethics in Gen AI Seminars
                    </h3>
                    <p className="font-mono text-xs text-muted-foreground mt-1">
                      Main Auditorium • Nov 02 • 09:00 - 11:30
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href="/volunteer/events/manage" className="border border-border bg-background text-foreground font-mono text-[11px] uppercase tracking-wider py-2 px-4 hover:bg-surface-container active:scale-95 transition-all text-center">
                      Manage Event
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar panels */}
        <div className="lg:col-span-4 space-y-4">
          <div className="border border-border p-4 bg-card space-y-4">
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground border-b border-border pb-1 font-semibold">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 gap-2">
              <Link href="/volunteer/events/new" className="w-full bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider py-3 flex items-center justify-center gap-1 hover:bg-primary-container transition-all active:scale-98">
                <Plus size={14} />
                Create Event
              </Link>
              <Link href="/volunteer/updates/new" className="w-full border border-border bg-background text-foreground font-mono text-xs uppercase tracking-wider py-3 flex items-center justify-center gap-1 hover:bg-surface-container transition-all active:scale-98">
                <Megaphone size={14} />
                Post Update
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
