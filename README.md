# ⚡ Matrix — Event Management System

A full-stack event management and real-time attendance tracking platform built specifically for the **Department of Artificial Intelligence & Machine Learning (AIML) at Karunya University**. 

Designed to streamline department operations, Matrix enables student registrations, event lifecycle management, and instant barcode/QR-based attendance verification via a real-time terminal.

---

## 🚀 Key Features

### 👤 Three-Tier Role Architecture
Matrix gates features and routes based on user authorization:
*   **Admin Dashboard:**
    *   Department-wide metrics (RSVPs vs. unique check-ins).
    *   Interactive bar charts mapping historic event engagement.
    *   User administration (search roster, elevate/demote roles).
    *   Exportable CSV summaries for events, scans, and system logs.
*   **Volunteer Console:**
    *   Multi-step **Event Creation Wizard** to publish events and schedules under a single transaction.
    *   Scans and organizer stats tracking.
    *   Deadline management and roster exports.
    *   **Live Attendance Terminal** with webcam stream or manual overrides.
*   **Student Portal:**
    *   Dynamic event catalog with category filtering and keyword search.
    *   Instant registration, cancellation, and waitlist tracking.
    *   Announcements feed and optimistic read-marking inbox notifications.

### 📷 WebAssembly QR/Barcode Scanner
The attendance check-in terminal uses a dual-path confirmation protocol:
1.  **Real-Time Webcam stream:** Uses `zxing-wasm` to fetch and run a WebAssembly decoder in a `requestAnimationFrame` loop, reading QR codes, Code 128, and Code 39 barcodes.
2.  **Manual Override:** Allows typing roll numbers directly to query the DB and validate entries when camera permissions are unavailable.

### 🔒 Security & Verification
*   **Karunya Domain Restriction:** Database hooks restrict sign-ups to `@karunya.edu.in` email addresses (except pre-approved admin overrides).
*   **Password Gating:** Enforces mandatory password changes for temporary/reset credentials before accessing dashboard pages.

### 📱 Progressive Web App (PWA)
*   Equipped with a custom Service Worker ([sw.js](file:///c:/Users/benny/Documents/Matrix_EventManagement/public/sw.js)) providing offline fallback pages, cache-first static assets, and network-first navigation handling.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router, Turbopack, Server Actions) |
| **Language** | TypeScript |
| **Database & ORM** | PostgreSQL (Neon serverless database) & Prisma ORM |
| **Authentication** | Better-Auth (Credential-based flow, session cache, DB hooks) |
| **Styling & UI** | Tailwind CSS v4, Framer Motion, GSAP, Radix UI primitives |
| **Scanner Engine** | `zxing-wasm` (WebAssembly-based reader) |
| **Icons** | Lucide React |

---

## 📦 Project Structure

```bash
src/
├── actions/             # Server Actions (DB mutations, check-ins, event creation)
├── app/                 # Next.js Pages & Route Handlers
│   ├── admin/           # Admin portal routes
│   ├── api/             # REST endpoints (auth routes, CSV export api)
│   ├── student/         # Student portal routes
│   ├── volunteer/       # Volunteer console routes
│   └── proxy.ts         # Edge request proxy and authorization middleware
├── components/          # Reusable UI components
│   ├── events/          # QR Scanner and event forms
│   └── ui/              # Base UI design components (shadcn)
├── generated/           # Auto-generated Prisma client
└── lib/                 # Prisma clients, Auth wrappers, and constant helpers
```

---

## 🔒 License & Intellectual Property

**Proprietary and Confidential**

Copyright © 2026 Karunya Institute of Technology and Sciences. All rights reserved.

This software and all associated documentation are proprietary to the **Department of Artificial Intelligence & Machine Learning (AIML) at Karunya University**. 

*   **Usage Restriction:** Exclusive authorization is granted solely for internal academic and operational use by Karunya University. 
*   **Copying & Distribution:** Unauthorized copying, modification, distribution, or execution of this software, via any medium, is strictly prohibited.
*   **Licensing Queries:** For permissions, licensing, or commercial inquiries, please contact the AIML Department Administration.