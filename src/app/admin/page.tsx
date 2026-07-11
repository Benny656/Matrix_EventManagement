import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="border border-border bg-card flex flex-col">
          <div className="bg-surface-container px-4 py-2 flex justify-between items-center border-b border-border">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Total Students</span>
            <span className="material-symbols-outlined text-primary text-[18px]">school</span>
          </div>
          <div className="p-4">
            <h2 className="font-mono text-2xl font-bold text-foreground">1,248</h2>
            <p className="font-mono text-[10px] text-tertiary mt-1">+4.2% from last term</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="border border-border bg-card flex flex-col">
          <div className="bg-surface-container px-4 py-2 flex justify-between items-center border-b border-border">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Active Events</span>
            <span className="material-symbols-outlined text-primary text-[18px]">bolt</span>
          </div>
          <div className="p-4">
            <h2 className="font-mono text-2xl font-bold text-foreground">24</h2>
            <p className="font-mono text-[10px] text-muted-foreground mt-1">Across 8 categories</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="border border-border bg-card flex flex-col">
          <div className="bg-surface-container px-4 py-2 flex justify-between items-center border-b border-border">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Attendance Rate</span>
            <span className="material-symbols-outlined text-primary text-[18px]">fact_check</span>
          </div>
          <div className="p-4">
            <h2 className="font-mono text-2xl font-bold text-foreground">88.4%</h2>
            <p className="font-mono text-[10px] text-destructive mt-1">-1.2% this week</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="border border-border bg-card flex flex-col">
          <div className="bg-surface-container px-4 py-2 flex justify-between items-center border-b border-border">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Total Volunteers</span>
            <span className="material-symbols-outlined text-primary text-[18px]">volunteer_activism</span>
          </div>
          <div className="p-4">
            <h2 className="font-mono text-2xl font-bold text-foreground">42</h2>
            <p className="font-mono text-[10px] text-tertiary mt-1">+2 pending review</p>
          </div>
        </div>
      </div>

      {/* Visualizations & Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart Column */}
        <div className="lg:col-span-8 border border-border bg-card flex flex-col">
          <div className="bg-surface-container px-4 py-3 flex justify-between items-center border-b border-border">
            <h3 className="font-mono text-xs uppercase tracking-widest text-foreground font-semibold">Event Attendance History</h3>
            <div className="flex gap-2">
              <Button variant="outline" className="bg-surface-container-high px-3 py-1 text-[10px] font-mono rounded-none h-7 shadow-none border-border uppercase">Export</Button>
              <Button variant="outline" className="bg-surface-container-high px-3 py-1 text-[10px] font-mono rounded-none h-7 shadow-none border-border uppercase">Details</Button>
            </div>
          </div>
          
          <div className="p-6 flex-1 flex flex-col justify-end min-h-[350px]">
            {/* Geometric Bar Chart */}
            <div className="flex items-end justify-between h-56 gap-4 px-2">
              {/* Bar 1 */}
              <div className="flex flex-col items-center flex-1 group">
                <div className="w-full bg-secondary-container border border-border group-hover:bg-primary transition-colors h-[65%] relative">
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">720</span>
                </div>
                <span className="font-mono text-[10px] mt-2 text-muted-foreground">EVT_01</span>
              </div>
              {/* Bar 2 */}
              <div className="flex flex-col items-center flex-1 group">
                <div className="w-full bg-secondary-container border border-border group-hover:bg-primary transition-colors h-[82%] relative">
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">890</span>
                </div>
                <span className="font-mono text-[10px] mt-2 text-muted-foreground">EVT_02</span>
              </div>
              {/* Bar 3 */}
              <div className="flex flex-col items-center flex-1 group">
                <div className="w-full bg-secondary-container border border-border group-hover:bg-primary transition-colors h-[45%] relative">
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">410</span>
                </div>
                <span className="font-mono text-[10px] mt-2 text-muted-foreground">EVT_03</span>
              </div>
              {/* Bar 4 */}
              <div className="flex flex-col items-center flex-1 group">
                <div className="w-full bg-secondary-container border border-border group-hover:bg-primary transition-colors h-[92%] relative">
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">1024</span>
                </div>
                <span className="font-mono text-[10px] mt-2 text-muted-foreground">EVT_04</span>
              </div>
              {/* Bar 5 */}
              <div className="flex flex-col items-center flex-1 group">
                <div className="w-full bg-secondary-container border border-border group-hover:bg-primary transition-colors h-[78%] relative">
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">820</span>
                </div>
                <span className="font-mono text-[10px] mt-2 text-muted-foreground">EVT_05</span>
              </div>
              {/* Bar 6 */}
              <div className="flex flex-col items-center flex-1 group">
                <div className="w-full bg-primary-container border border-border group-hover:bg-primary transition-colors h-[88%] relative">
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[10px] font-bold">945</span>
                </div>
                <span className="font-mono text-[10px] mt-2 text-foreground font-bold underline">CURRENT</span>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-[1px] bg-border mt-4"></div>
            <div className="mt-4 flex flex-wrap justify-between gap-2 font-mono text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-secondary-container border border-border block"></span> Historic
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-primary-container border border-border block"></span> Current Period
              </div>
              <div>Interval: 12 Days</div>
            </div>
          </div>
        </div>

        {/* Feed Column */}
        <div className="lg:col-span-4 border border-border bg-card flex flex-col">
          <div className="bg-surface-container px-4 py-3 flex justify-between items-center border-b border-border">
            <h3 className="font-mono text-xs uppercase tracking-widest text-foreground font-semibold">System Feed</h3>
            <span className="material-symbols-outlined text-muted-foreground cursor-pointer text-sm">refresh</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[350px] divide-y divide-border">
            <div className="p-4 hover:bg-surface-container transition-colors">
              <span className="font-mono text-[9px] uppercase tracking-widest text-primary">Announcement</span>
              <p className="font-sans text-xs text-foreground mt-1 font-medium">Department-wide updates regarding commission of new lab equipment.</p>
              <span className="font-mono text-[9px] text-muted-foreground mt-2 block">10m ago • Admin</span>
            </div>
            <div className="p-4 hover:bg-surface-container transition-colors">
              <span className="font-mono text-[9px] uppercase tracking-widest text-secondary">Attendance</span>
              <p className="font-sans text-xs text-foreground mt-1">Manual attendance verified for EVT-892 session.</p>
              <span className="font-mono text-[9px] text-muted-foreground mt-2 block">1h ago • Volunteer</span>
            </div>
            <div className="p-4 hover:bg-surface-container transition-colors">
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">System</span>
              <p className="font-sans text-xs text-foreground mt-1">Matrix platform v2.0.24-stable compiled successfully.</p>
              <span className="font-mono text-[9px] text-muted-foreground mt-2 block">3h ago • System</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
