import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarChart2, Users, History } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const events = await prisma.event.findMany({
    orderBy: { date: "desc" },
    include: {
      registrations: {
        where: { NOT: { status: "CANCELLED" } },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground tracking-tighter mb-1">
          Reports & Exports
        </h1>
        <p className="font-sans text-sm text-muted-foreground">
          Download CSV reports of events, attendance records, registrations, and volunteer activity.
        </p>
      </div>

      {/* Global Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Events Summary */}
        <div className="border border-border bg-card flex flex-col justify-between">
          <div className="p-6">
            <BarChart2 size={22} className="text-primary mb-3" />
            <h3 className="font-heading font-bold text-base text-foreground mb-1">Events Summary</h3>
            <p className="font-sans text-xs text-muted-foreground leading-relaxed">
              Export overall statistics for all events including capacity, RSVPs, waitlists, check-ins, and attendance rates.
            </p>
          </div>
          <div className="bg-surface-container px-6 py-3 border-t border-border flex justify-end">
            <Link
              href="/api/reports/export?type=events-summary"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "font-mono text-[10px] uppercase tracking-wider rounded-none h-8 px-4 shadow-none hover:bg-surface-container-high border-border inline-flex items-center"
              )}
            >
              Download CSV
            </Link>
          </div>
        </div>

        {/* Volunteer Performance */}
        <div className="border border-border bg-card flex flex-col justify-between">
          <div className="p-6">
            <Users size={22} className="text-primary mb-3" />
            <h3 className="font-heading font-bold text-base text-foreground mb-1">Volunteer Performance</h3>
            <p className="font-sans text-xs text-muted-foreground leading-relaxed">
              Analyze volunteer activity showing the total number of attendance check-ins marked and validated by each operator.
            </p>
          </div>
          <div className="bg-surface-container px-6 py-3 border-t border-border flex justify-end">
            <Link
              href="/api/reports/export?type=volunteers-summary"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "font-mono text-[10px] uppercase tracking-wider rounded-none h-8 px-4 shadow-none hover:bg-surface-container-high border-border inline-flex items-center"
              )}
            >
              Download CSV
            </Link>
          </div>
        </div>

        {/* Global Registration Logs */}
        <div className="border border-border bg-card flex flex-col justify-between">
          <div className="p-6">
            <History size={22} className="text-primary mb-3" />
            <h3 className="font-heading font-bold text-base text-foreground mb-1">Registration History Log</h3>
            <p className="font-sans text-xs text-muted-foreground leading-relaxed">
              Extract raw chronological logs of all event registrations, cancellations, and waitlist allocations with student profiles.
            </p>
          </div>
          <div className="bg-surface-container px-6 py-3 border-t border-border flex justify-end">
            <Link
              href="/api/reports/export?type=students-registration-log"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "font-mono text-[10px] uppercase tracking-wider rounded-none h-8 px-4 shadow-none hover:bg-surface-container-high border-border inline-flex items-center"
              )}
            >
              Download CSV
            </Link>
          </div>
        </div>
      </div>

      {/* Event List for Individual Reports */}
      <div className="border border-border bg-card">
        <div className="bg-surface-container px-6 py-3 border-b border-border flex justify-between items-center">
          <h3 className="font-mono text-xs uppercase tracking-widest text-foreground font-semibold">
            Export Individual Event Attendance
          </h3>
        </div>

        {events.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground font-mono text-xs uppercase">
            No events available for export.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border font-mono text-[10px] uppercase text-muted-foreground bg-surface-container/30">
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Registrations</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map((evt) => {
                  const dateStr = new Date(evt.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const activeRegs = evt.registrations.filter((r) => r.status === "REGISTERED").length;

                  return (
                    <tr key={evt.id} className="hover:bg-surface-container/20 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-sans text-xs font-bold text-foreground block">
                          {evt.title}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground block">
                          Venue: {evt.venue}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs uppercase text-muted-foreground">
                        {evt.category}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                        {activeRegs} / {evt.maxParticipants}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 font-mono text-[9px] uppercase font-semibold border ${
                          evt.status === "UPCOMING"
                            ? "bg-secondary-container text-on-secondary-container border-border"
                            : evt.status === "ONGOING"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted text-muted-foreground border-border"
                        }`}>
                          {evt.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/api/reports/export?type=event&eventId=${evt.id}`}
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "font-mono text-[10px] uppercase h-8 shadow-none rounded-none border-border inline-flex items-center px-3"
                          )}
                        >
                          Export CSV
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
