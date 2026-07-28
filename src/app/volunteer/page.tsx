import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyStaff } from "@/lib/auth-session";
import { adminDb } from "@/lib/firebase-admin";
import { Plus, Megaphone } from "lucide-react";
import VolunteerClock from "@/components/volunteer-clock";

export const dynamic = "force-dynamic";

export default async function VolunteerDashboardPage() {
  let user;
  try {
    user = await verifyStaff();
  } catch {
    redirect("/login");
  }

  const userId = user.id;

  const eventsSnapshot = await adminDb.collection("events").get();
  const allEvents = eventsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

  const eventsCreated = allEvents.filter((e) => e.createdById === userId).length;

  const attsSnapshot = await adminDb.collection("attendances").get();
  const attendeesScanned = attsSnapshot.docs.filter((d) => d.data().markedById === userId).length;

  const activeEvents = allEvents
    .filter((e) => e.status === "ONGOING" || e.status === "UPCOMING")
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
    .slice(0, 4);

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
          <VolunteerClock />
          <div className="border border-border px-3 py-1 bg-surface-container">
            STATUS: <span className="text-primary font-bold">ONLINE</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-border bg-card p-4">
          <div className="font-mono text-[10px] text-muted-foreground mb-1">TOTAL HOURS</div>
          <div className="font-heading text-2xl font-bold text-foreground">N/A</div>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="font-mono text-[10px] text-muted-foreground mb-1">EVENTS ORGANIZED</div>
          <div className="font-heading text-2xl font-bold text-foreground">{eventsCreated}</div>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="font-mono text-[10px] text-muted-foreground mb-1">ATTENDEES SCANNED</div>
          <div className="font-heading text-2xl font-bold text-foreground">{attendeesScanned}</div>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="font-mono text-[10px] text-muted-foreground mb-1">RATING AVG</div>
          <div className="font-heading text-2xl font-bold text-primary">N/A</div>
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
            {activeEvents.length === 0 ? (
              <div className="border border-border p-12 text-center text-muted-foreground font-mono text-xs uppercase bg-card">
                No active deployments at this time.
              </div>
            ) : (
              activeEvents.map((event) => {
                const eventCode = `EVT-${event.id.slice(0, 4).toUpperCase()}`;
                const dateObj = event.date ? new Date(event.date) : new Date();
                const eventDateStr = dateObj.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                const eventTimeStr = dateObj.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });

                return (
                  <div key={event.id} className="border border-border bg-card p-0 hover:bg-surface-container transition-colors">
                    <div className="flex items-stretch">
                      <div className={`w-1 ${event.status === "ONGOING" ? "bg-primary" : "bg-secondary"}`}></div>
                      <div className="p-4 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-[11px] text-muted-foreground">{eventCode}</span>
                            <span className={`border px-2 py-[2px] font-mono text-[9px] uppercase font-semibold ${
                              event.status === "ONGOING"
                                ? "bg-primary/10 text-primary border-primary/20 animate-pulse"
                                : "bg-secondary-container text-on-secondary-container border-border"
                            }`}>
                              {event.status}
                            </span>
                          </div>
                          <h3 className="font-heading text-base font-bold text-foreground">
                            {event.title}
                          </h3>
                          <p className="font-mono text-xs text-muted-foreground mt-1">
                            {event.venue} • {eventDateStr} • {eventTimeStr}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {event.status === "ONGOING" ? (
                            <Link href="/volunteer/attendance" className="bg-primary text-primary-foreground font-mono text-[11px] uppercase tracking-wider py-2 px-4 hover:bg-primary-container active:scale-95 transition-all text-center">
                              Launch Scanner
                            </Link>
                          ) : (
                            <Link href={`/volunteer/events/${event.id}`} className="border border-border bg-background text-foreground font-mono text-[11px] uppercase tracking-wider py-2 px-4 hover:bg-surface-container active:scale-95 transition-all text-center">
                              Manage Event
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
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
