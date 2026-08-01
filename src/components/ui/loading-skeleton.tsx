"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  message?: string;
  type?: "auto" | "dashboard" | "table" | "details" | "form";
}

function HeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 rounded-md" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
}

function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-card p-4 space-y-3 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded-sm" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-3 w-32 rounded-sm" />
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Analytics Card */}
        <div className="lg:col-span-8 rounded-xl border border-border/60 bg-card p-5 space-y-4 shadow-xs min-h-[340px]">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <Skeleton className="h-5 w-36 rounded-md" />
            <Skeleton className="h-7 w-20 rounded-md" />
          </div>
          <div className="h-[240px] flex items-end justify-between gap-3 pt-6 px-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton
                key={i}
                className="w-full rounded-t-md"
                style={{ height: `${30 + (i * 12) % 65}%` }}
              />
            ))}
          </div>
        </div>

        {/* System Feed / Recent Items Card */}
        <div className="lg:col-span-4 rounded-xl border border-border/60 bg-card p-5 space-y-4 shadow-xs min-h-[340px]">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <Skeleton className="h-5 w-28 rounded-md" />
            <Skeleton className="h-4 w-12 rounded-sm" />
          </div>
          <div className="space-y-3 pt-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded-lg border border-border/30">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-full rounded-sm" />
                  <Skeleton className="h-3 w-2/3 rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TableSectionSkeleton() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />

      {/* Controls / Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/60 p-3 rounded-xl shadow-xs">
        <Skeleton className="h-10 w-full sm:w-80 rounded-lg" />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Table Skeletons */}
      <div className="rounded-xl border border-border/60 bg-card shadow-xs overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-5 py-3.5 bg-muted/40 border-b border-border/60">
          <Skeleton className="col-span-4 h-4 rounded-sm" />
          <Skeleton className="col-span-3 h-4 rounded-sm" />
          <Skeleton className="col-span-3 h-4 rounded-sm" />
          <Skeleton className="col-span-2 h-4 rounded-sm" />
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-border/40">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 px-5 py-4 items-center">
              <div className="col-span-4 flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-3/4 rounded-sm" />
                  <Skeleton className="h-3 w-1/2 rounded-sm" />
                </div>
              </div>
              <div className="col-span-3">
                <Skeleton className="h-4 w-28 rounded-sm" />
              </div>
              <div className="col-span-3">
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="col-span-2 flex justify-end">
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailViewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-6 w-48 rounded-md" />
      </div>

      {/* Banner */}
      <Skeleton className="h-48 w-full rounded-2xl" />

      {/* Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-xl border border-border/60 bg-card p-6 space-y-4 shadow-xs">
          <Skeleton className="h-7 w-64 rounded-md" />
          <Skeleton className="h-4 w-full rounded-sm" />
          <Skeleton className="h-4 w-5/6 rounded-sm" />
          <Skeleton className="h-4 w-4/5 rounded-sm" />
          <div className="pt-4 grid grid-cols-2 gap-4">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>

        <div className="lg:col-span-4 rounded-xl border border-border/60 bg-card p-6 space-y-4 shadow-xs">
          <Skeleton className="h-6 w-36 rounded-md" />
          <div className="space-y-3 pt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-border/30">
                <Skeleton className="h-4 w-24 rounded-sm" />
                <Skeleton className="h-4 w-28 rounded-sm" />
              </div>
            ))}
          </div>
          <Skeleton className="h-10 w-full rounded-xl mt-4" />
        </div>
      </div>
    </div>
  );
}

function FormSectionSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <HeaderSkeleton />

      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-6 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24 rounded-sm" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-sm" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function LoadingSkeleton({
  message,
  type = "auto",
}: LoadingSkeletonProps) {
  const pathname = usePathname() || "";
  const path = pathname.toLowerCase();

  let resolvedType = type;
  if (resolvedType === "auto") {
    if (
      path.includes("/new") ||
      path.includes("/profile") ||
      path.includes("/onboarding")
    ) {
      resolvedType = "form";
    } else if (
      path.match(/\/events\/[^\/]+/) ||
      path.match(/\/users\/[^\/]+/)
    ) {
      resolvedType = "details";
    } else if (
      path.includes("/events") ||
      path.includes("/users") ||
      path.includes("/registrations") ||
      path.includes("/reports") ||
      path.includes("/attendance")
    ) {
      resolvedType = "table";
    } else {
      resolvedType = "dashboard";
    }
  }

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] p-4 sm:p-6 animate-in fade-in-50 duration-200">
      {/* Subtle Section Loading Indicator Bar */}
      <div className="mb-4 flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-surface-container/60 border border-border/40 w-fit">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        <span className="font-mono text-xs font-medium text-muted-foreground">
          {message || "Loading section data..."}
        </span>
      </div>

      {resolvedType === "table" && <TableSectionSkeleton />}
      {resolvedType === "details" && <DetailViewSkeleton />}
      {resolvedType === "form" && <FormSectionSkeleton />}
      {resolvedType === "dashboard" && <DashboardOverviewSkeleton />}
    </div>
  );
}

