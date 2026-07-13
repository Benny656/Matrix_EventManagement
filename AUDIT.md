# Matrix Event Management Application Audit Report

This document outlines the systematic audit and cleanup performed on the Matrix Event Management application for the AIML department at Karunya University.

---

## 1. Fully Working Features

### **Authentication & Authorization**
- **Credential Auth**: Uses `better-auth` email/password flow with validation.
- **College Restriction**: Custom DB hooks restrict registrations to `@karunya.edu.in` emails (except pre-approved admin addresses).
- **Role-based Gating**: Next.js Middleware gates routes for `/student`, `/volunteer`, and `/admin`.
- **Session State**: Session client-side caching & page redirection handles access control.

### **Student Portal**
- **Dashboard**: Upcoming Registrations dynamically fetched, categorized by status (Confirmed/Waitlisted). System updates show latest department announcements.
- **Active Events**: Interactive list of events with filtering by categories and real-time search. Handled waitlist indicator once event capacity is filled.
- **Event details**: Display of operational descriptions, session timetables, and capacity limits. Register/Cancel buttons are wired to Server Actions.
- **Registrations**: Clean overview of the logged-in student's complete signup history.
- **Announcements Feed**: System-wide notifications and event-specific relocations.
- **Inbox Notifications**: Optimistic read-marking and mass mark-as-read for system alerts.

### **Volunteer Operations**
- **Dashboard**: Real-time stats showing how many events a volunteer organized and how many attendee QR codes they scanned. Live system clock.
- **Events Manager**: Searchable listing of all active and archived events.
- **Wizard Creator**: Multi-step layout to publish new events with sessions under a single transaction. Automatically sends notifications to all students.
- **Roster & Deadlines**: Roster overview of confirmed and waitlisted students with export options and dead-line adjustments.
- **Attendance Terminal**: Integrated scanner (QR code or manual roll number entry) for real-time check-in validation.

### **Admin Dashboard & Utilities**
- **Stats Metrics**: Calculations for total students, total volunteers, active events, and department-wide attendance rates.
- **Bar Chart History**: Comparison of RSVPs vs. unique check-ins across the last 6 historic events.
- **System Activity Feed**: Consolidated stream of registrations, scans, and announcements.
- **User Management**: Roster search and role escalation/de-escalation between Student, Volunteer, and Admin.
- **CSV Data Exports**: Dynamic generation and download of CSV summaries for all events, registration logs, and volunteer scan counts.

---

## 2. Partially Working Features

- **QR Scanner webcam stream**: The camera integration is fully coded using modern WebRTC standards. However, actual browser webcam activation requires proper SSL/HTTPS environment. Locally, developers must fall back to the fully-functional manual override input (roll number/name query) if camera permissions are unavailable.

---

## 3. Not Yet Built

- **Volunteer Hour Tracking**: The database schema does not store event session durations or track cumulative volunteer shifts. Consequently, the **Total Hours** metric on the volunteer dashboard displays `N/A`.
- **Average Ratings**: Event feedback forms or rating metrics do not exist in the database model. The **Rating Avg** metric on the volunteer dashboard displays `N/A`.

---

## 4. Fixed in This Pass

- **Student Dashboard (`src/app/student/page.tsx`)**:
  - Replaced hardcoded events ("Neural Architecture Search Workshop", "Ethics in Gen AI Seminars") with actual registrations queried from Prisma.
  - Linked detail buttons to correct sub-pages.
  - Bound announcements to the database instead of static cards.
- **Volunteer Dashboard (`src/app/volunteer/page.tsx`)**:
  - Converted the page to a Server Component to pull real metrics directly from Prisma (`eventsCreated`, `attendeesScanned`).
  - Replaced mock active deployments with real events filtered by `status: UPCOMING | ONGOING`.
  - Extracted client-side live clock code to `src/components/volunteer-clock.tsx` and removed all unused states, hooks, and local variables.
- **Cleaned Code & Comment Styling**:
  - Removed unused imports across edited files.
  - Maintained high-value documentation comments explaining complex transactions and session caches.

---

## 5. Known Issues / Worth Testing

- **Waitlist Race Conditions**: If multiple students register at the same millisecond near the capacity threshold, verify if the transaction isolation level correctly handles the cutoff or if double-bookings could occur.
- **Cached Sessions on Mobile**: Session cache duration is configured to 5 minutes (`better-auth` cache option). Test cookie expiration on mobile devices to check for layout refreshes.
