import React, { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  StatsGrid,
  EventHistoryChart,
  SystemFeed,
  SectionSkeleton,
} from "@/components/admin/dashboard-components";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats Row */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="border border-border bg-card flex flex-col min-h-[105px] animate-pulse"
              >
                <div className="bg-surface-container px-4 py-2 border-b border-border h-8"></div>
                <div className="p-4 flex-1 flex flex-col justify-center">
                  <div className="h-6 bg-muted w-1/3 rounded-sm"></div>
                </div>
              </div>
            ))}
          </div>
        }
      >
        <StatsGrid />
      </Suspense>

      {/* Visualizations & Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart Column */}
        <div className="lg:col-span-8">
          <Suspense fallback={<SectionSkeleton />}>
            <EventHistoryChart />
          </Suspense>
        </div>

        {/* Feed Column */}
        <div className="lg:col-span-4">
          <Suspense fallback={<SectionSkeleton />}>
            <SystemFeed />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
