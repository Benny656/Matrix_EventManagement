/**
 * Skeleton Loaders - powered by the shimmer engine in globals.css
 *
 * Design rules:
 *  - Every leaf block uses the skeleton-box class for the shimmer effect
 *  - Responsive & fluid layout across all mobile devices (320px+) to desktops
 *  - Zero overflow or text/card overlap on mobile screens
 *  - Fade-in animation via Tailwind animate-in utility
 */

import React from "react";

export function SkeletonBox({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={`skeleton-box ${className ?? ""}`} style={style} />;
}

const S = SkeletonBox;

/* ─────────────────────────────────────────────
   1. Dashboard Skeleton
   (Admin, Student, Faculty, Volunteer)
───────────────────────────────────────────── */
export function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden animate-in fade-in-0 duration-300">
      {/* Stats row — 4 KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="border border-border bg-card p-3.5 sm:p-4 rounded-lg min-h-[95px] sm:min-h-[105px] flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <S className="h-3.5 w-24 max-w-[70%] rounded-md" />
              <S className="h-5 w-5 rounded-full shrink-0" />
            </div>
            <div className="space-y-1.5">
              <S className="h-6 sm:h-7 w-20 max-w-[50%] rounded-md" />
              <S className="h-3 w-32 max-w-[80%] rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Main grid: Chart (8 cols) + Feed (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Chart panel */}
        <div className="lg:col-span-8 border border-border bg-card p-3.5 sm:p-5 rounded-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border gap-2">
            <S className="h-5 w-40 max-w-[60%] rounded-md" />
            <S className="h-7 w-24 sm:w-28 rounded-md shrink-0" />
          </div>
          <div className="space-y-2">
            <div className="flex items-end gap-1 sm:gap-2 h-44 sm:h-52 overflow-hidden">
              {[65, 40, 80, 55, 70, 45, 90, 60, 75, 50, 85, 42].map(
                (pct, i) => (
                  <S
                    key={i}
                    className="flex-1 rounded-t-md min-w-[6px]"
                    style={{ height: `${pct}%` }}
                  />
                )
              )}
            </div>
            <div className="flex gap-1 sm:gap-2">
              {[...Array(12)].map((_, i) => (
                <S key={i} className="flex-1 h-2.5 sm:h-3 rounded-sm min-w-[6px]" />
              ))}
            </div>
          </div>
        </div>

        {/* Activity feed panel */}
        <div className="lg:col-span-4 border border-border bg-card p-3.5 sm:p-5 rounded-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border gap-2">
            <S className="h-5 w-32 max-w-[60%] rounded-md" />
            <S className="h-4 w-12 rounded-md shrink-0" />
          </div>
          <div className="space-y-2.5 sm:space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 sm:gap-3 p-2.5 border border-border/50 rounded-md min-w-0"
              >
                <S className="h-7 sm:h-8 w-7 sm:w-8 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <S className="h-3.5 w-3/4 rounded-md" />
                  <S className="h-3 w-1/2 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   2. Events List Skeleton
───────────────────────────────────────────── */
export function EventsListSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden animate-in fade-in-0 duration-300">
      {/* Search & Filter bar */}
      <div className="border border-border bg-card p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row gap-2.5 sm:gap-3">
        <S className="h-9 flex-1 rounded-md w-full" />
        <S className="h-9 w-full sm:w-44 rounded-md" />
        <S className="h-9 w-full sm:w-28 rounded-md" />
      </div>

      {/* Event cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="border border-border bg-card rounded-lg overflow-hidden flex flex-col"
          >
            <S className="h-36 sm:h-40 w-full rounded-none" />
            <div className="p-3.5 sm:p-4 space-y-3 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <S className="h-4 w-20 max-w-[45%] rounded-md" />
                <S className="h-4 w-16 max-w-[35%] rounded-md" />
              </div>
              <S className="h-5 w-4/5 rounded-md" />
              <S className="h-3.5 w-full rounded-md" />
              <S className="h-3.5 w-2/3 rounded-md" />
            </div>
            <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-2 border-t border-border/50 flex items-center justify-between gap-2">
              <S className="h-4 w-24 max-w-[50%] rounded-md" />
              <S className="h-8 w-24 rounded-md shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   3. Event Details Skeleton
───────────────────────────────────────────── */
export function EventDetailsSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-5xl mx-auto overflow-hidden animate-in fade-in-0 duration-300">
      {/* Hero banner */}
      <S className="h-48 sm:h-64 lg:h-80 w-full rounded-lg sm:rounded-xl" />

      {/* Title block */}
      <div className="space-y-2.5 sm:space-y-3 min-w-0">
        <div className="flex items-center gap-2">
          <S className="h-5 w-24 rounded-md" />
          <S className="h-5 w-20 rounded-md" />
        </div>
        <S className="h-7 sm:h-8 w-3/4 rounded-md" />
        <S className="h-4 w-full rounded-md" />
        <S className="h-4 w-2/3 rounded-md" />
      </div>

      {/* 2-col content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 pt-1 sm:pt-2">
        <div className="lg:col-span-8 space-y-4 sm:space-y-5">
          <div className="border border-border bg-card p-4 sm:p-5 rounded-lg space-y-3">
            <S className="h-5 w-32 max-w-[60%] rounded-md" />
            <S className="h-4 w-full rounded-md" />
            <S className="h-4 w-5/6 rounded-md" />
            <S className="h-4 w-4/6 rounded-md" />
          </div>
          <div className="border border-border bg-card p-4 sm:p-5 rounded-lg space-y-3">
            <S className="h-5 w-36 max-w-[60%] rounded-md" />
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 sm:p-3 border border-border/50 rounded-md gap-2"
              >
                <S className="h-4 w-32 max-w-[55%] rounded-md" />
                <S className="h-4 w-24 max-w-[40%] rounded-md shrink-0" />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 space-y-4">
          <div className="border border-border bg-card p-4 sm:p-5 rounded-lg space-y-4">
            <S className="h-6 w-28 rounded-md" />
            <S className="h-4 w-full rounded-md" />
            <S className="h-4 w-4/5 rounded-md" />
            <S className="h-10 w-full rounded-md" />
          </div>
          <div className="border border-border bg-card p-4 sm:p-5 rounded-lg space-y-3">
            <S className="h-5 w-24 rounded-md" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <S className="h-4 w-4 rounded-sm shrink-0" />
                <S className="h-4 flex-1 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   4. Users List Skeleton
───────────────────────────────────────────── */
export function UsersListSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4 w-full max-w-full overflow-hidden animate-in fade-in-0 duration-300">
      {/* Toolbar */}
      <div className="border border-border bg-card p-3 sm:p-3.5 flex flex-col md:flex-row gap-2.5 sm:gap-3 rounded-lg">
        <S className="h-9 flex-1 rounded-md w-full" />
        <S className="h-9 w-full md:w-48 rounded-md" />
        <S className="h-9 w-full md:w-24 rounded-md" />
      </div>

      {/* Table */}
      <div className="border border-border bg-card rounded-lg overflow-x-auto">
        <div className="p-3 sm:p-3.5 border-b border-border flex items-center gap-3 sm:gap-4 min-w-[500px]">
          <S className="h-4 flex-1 rounded-md" />
          <S className="h-4 w-28 rounded-md hidden md:block" />
          <S className="h-4 w-20 rounded-md" />
          <S className="h-4 w-20 rounded-md" />
        </div>
        <div className="divide-y divide-border min-w-[500px]">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-3 sm:p-3.5 flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <S className="h-8 sm:h-9 w-8 sm:w-9 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <S className="h-4 w-36 max-w-[80%] rounded-md" />
                  <S className="h-3 w-48 max-w-[90%] rounded-md" />
                </div>
              </div>
              <S className="h-4 w-24 rounded-md hidden md:block shrink-0" />
              <S className="h-5 w-16 rounded-md shrink-0" />
              <S className="h-8 w-20 rounded-md shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   5. Reports Skeleton
───────────────────────────────────────────── */
export function ReportsSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden animate-in fade-in-0 duration-300">
      {/* Filter bar */}
      <div className="border border-border bg-card p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row gap-2.5 sm:gap-3">
        <S className="h-9 flex-1 rounded-md w-full" />
        <S className="h-9 w-full sm:w-36 rounded-md" />
        <S className="h-9 w-full sm:w-32 rounded-md" />
      </div>

      {/* KPI stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="border border-border bg-card p-3.5 sm:p-4 rounded-lg space-y-2"
          >
            <S className="h-4 w-24 max-w-[60%] rounded-md" />
            <S className="h-7 sm:h-8 w-16 rounded-md" />
            <S className="h-3 w-32 max-w-[80%] rounded-md" />
          </div>
        ))}
      </div>

      {/* Chart panel */}
      <div className="border border-border bg-card p-3.5 sm:p-5 rounded-lg space-y-4">
        <div className="flex items-center justify-between gap-2">
          <S className="h-5 w-40 max-w-[60%] rounded-md" />
          <S className="h-7 w-24 rounded-md shrink-0" />
        </div>
        <div className="flex items-end gap-1.5 sm:gap-3 h-44 sm:h-56 pt-2 overflow-hidden">
          {[55, 80, 45, 70, 90, 60, 75, 50, 85, 65].map((pct, i) => (
            <S
              key={i}
              className="flex-1 rounded-t-md min-w-[8px]"
              style={{ height: `${pct}%` }}
            />
          ))}
        </div>
      </div>

      {/* Data table preview */}
      <div className="border border-border bg-card rounded-lg overflow-x-auto">
        <div className="p-3 sm:p-3.5 border-b border-border flex gap-3 sm:gap-4 min-w-[450px]">
          {[...Array(4)].map((_, i) => (
            <S key={i} className="h-4 flex-1 rounded-md" />
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="p-3 sm:p-3.5 flex gap-3 sm:gap-4 border-b border-border/50 last:border-0 min-w-[450px]"
          >
            {[...Array(4)].map((_, j) => (
              <S key={j} className="h-4 flex-1 rounded-md" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   6. Attendance / QR Scanner Skeleton
───────────────────────────────────────────── */
export function AttendanceSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-4xl mx-auto overflow-hidden animate-in fade-in-0 duration-300">
      {/* QR scanner card */}
      <div className="border border-border bg-card p-4 sm:p-6 rounded-xl space-y-4 flex flex-col items-center text-center">
        <S className="h-6 w-48 max-w-[80%] rounded-md" />
        <S className="h-52 sm:h-72 w-full max-w-xs sm:max-w-sm rounded-xl" />
        <S className="h-10 w-44 sm:w-48 rounded-md" />
      </div>

      {/* Recent scans list */}
      <div className="border border-border bg-card p-4 sm:p-5 rounded-xl space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-border gap-2">
          <S className="h-5 w-40 max-w-[60%] rounded-md" />
          <S className="h-4 w-16 rounded-md shrink-0" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-2.5 sm:p-3 border border-border/50 rounded-md gap-2"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <S className="h-8 w-8 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <S className="h-4 w-36 max-w-[80%] rounded-md" />
                <S className="h-3 w-24 max-w-[60%] rounded-md" />
              </div>
            </div>
            <S className="h-5 w-20 rounded-md shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   7. Profile Skeleton
───────────────────────────────────────────── */
export function ProfileSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-3xl mx-auto overflow-hidden animate-in fade-in-0 duration-300">
      <div className="border border-border bg-card p-4 sm:p-6 rounded-xl space-y-5 sm:space-y-6">
        {/* Avatar + name */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-4">
          <S className="h-16 sm:h-20 w-16 sm:w-20 rounded-full shrink-0" />
          <div className="space-y-2 flex-1 min-w-0 w-full flex flex-col items-center sm:items-start">
            <S className="h-6 w-44 max-w-[80%] rounded-md" />
            <S className="h-4 w-56 max-w-[90%] rounded-md" />
            <S className="h-3 w-32 max-w-[60%] rounded-md" />
          </div>
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-border">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <S className="h-3 w-20 rounded-sm" />
              <S className="h-9 w-full rounded-md" />
            </div>
          ))}
        </div>

        {/* Save button */}
        <div className="flex justify-center sm:justify-end pt-2 border-t border-border">
          <S className="h-9 w-full sm:w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   8. Registrations Skeleton
───────────────────────────────────────────── */
export function RegistrationsSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden animate-in fade-in-0 duration-300">
      {/* Page header */}
      <div className="border border-border bg-card p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <S className="h-6 w-48 max-w-[80%] rounded-md" />
        <S className="h-8 w-24 rounded-md" />
      </div>

      {/* Registration cards */}
      <div className="space-y-3 sm:space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="border border-border bg-card p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 items-start sm:items-center"
          >
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full">
              <S className="h-9 sm:h-10 w-9 sm:w-10 rounded-lg shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <S className="h-5 w-2/3 rounded-md" />
                <S className="h-4 w-1/2 rounded-md" />
                <S className="h-3 w-1/3 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-border/50">
              <S className="h-5 w-16 rounded-md" />
              <S className="h-8 w-28 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}