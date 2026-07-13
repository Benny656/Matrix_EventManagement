import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUsersAction } from "@/actions/user";
import UsersListTable from "@/components/admin/users-list-table";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    role?: string;
  }>;
}

export default async function VolunteerUsersPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "VOLUNTEER" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  const { q, role } = await searchParams;
  const users = await getUsersAction(q, role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground tracking-tighter mb-1">
          Users
        </h1>
        <p className="font-sans text-sm text-muted-foreground">
          Search registered users and reset passwords when needed.
        </p>
      </div>

      {/* canEditRole=false — Volunteers can only reset passwords, not change roles */}
      <UsersListTable
        initialUsers={users as any}
        currentUserId={session.user.id}
        canEditRole={false}
      />
    </div>
  );
}
