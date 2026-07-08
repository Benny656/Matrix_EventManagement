# Matrix Event Management

A full-stack college department event management system built with Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Prisma ORM, PostgreSQL (Supabase), and Better Auth.

## Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Fill in:
- `DATABASE_URL` — Supabase Transaction pooler URL (port 6543)
- `DIRECT_URL` — Supabase Direct connection URL (port 5432)
- `BETTER_AUTH_SECRET` — Generate with: `openssl rand -base64 32`
- `BETTER_AUTH_URL` — Your app URL (default: `http://localhost:3000`)

### 2. Database Migration

```bash
npm run db:migrate
```

> If you prefer to push the schema without migrations: `npm run db:push`

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## User Roles

| Role | Access | Registration |
|------|--------|--------------|
| **Admin** | Full system access | Created manually via DB or promotion |
| **Volunteer** | Assigned events/sessions, QR scanner | Promoted by Admin |
| **Student** | Browse events, register, view attendance | Self-register via /register |

### Creating the first Admin

After running migrations, directly update a user's role in the database:

```sql
UPDATE "user" SET role = 'ADMIN' WHERE email = 'your@email.com';
```

Or via Prisma Studio:
```bash
npm run db:studio
```

---

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── (auth)/       # Login, Register, Forgot Password
│   ├── (dashboard)/  # Admin, Volunteer, Student dashboards
│   └── api/          # API routes (auth, reports)
├── actions/          # Server Actions
├── components/       # UI components
│   ├── ui/           # shadcn/ui base components
│   ├── layout/       # Sidebar, PageHeader
│   ├── events/       # Event components
│   ├── sessions/     # Session manager
│   ├── attendance/   # QR scanner, attendance table
│   ├── registrations/# Registration components
│   ├── analytics/    # Recharts analytics
│   └── reports/      # Download buttons
├── lib/              # Utilities (auth, prisma, utils, qr, validations)
├── types/            # TypeScript type definitions
└── middleware.ts     # Route protection
```

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Components)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma v6
- **Auth**: Better Auth (email + password, RBAC)
- **QR**: `qrcode` (generate) + `html5-qrcode` (scan)
- **Charts**: Recharts
- **Reports**: PapaParse (CSV) + xlsx (Excel)
- **Forms**: react-hook-form + Zod

---

## Database Scripts

```bash
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Create and run migrations
npm run db:push      # Push schema (no migrations)
npm run db:studio    # Open Prisma Studio GUI
```
