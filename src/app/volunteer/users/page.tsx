import React from "react";
import { redirect } from "next/navigation";
import { verifyStaff } from "@/lib/auth-session";
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
  let user;
  try {
    user = await verifyStaff();
  } catch {
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

      <UsersListTable
        initialUsers={users as any}
        currentUserId={user.id}
        canEditRole={false}
      />
    </div>
  );
}
