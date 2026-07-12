"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updateUserRoleAction } from "@/actions/user";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TriangleAlert, CheckCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  name: string;
  email: string;
  rollNumber: string | null;
  phone: string | null;
  role: "ADMIN" | "VOLUNTEER" | "STUDENT";
  createdAt: Date;
}

interface UsersListTableProps {
  initialUsers: User[];
  currentUserId: string;
}

export default function UsersListTable({ initialUsers, currentUserId }: UsersListTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "ALL");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (roleFilter !== "ALL") params.set("role", roleFilter);
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setError(null);
    setSuccess(null);
    router.push("/admin/users");
  };

  const handleRoleChange = (userId: string, newRole: "ADMIN" | "VOLUNTEER" | "STUDENT") => {
    setError(null);
    setSuccess(null);
    
    startTransition(async () => {
      try {
        const res = await updateUserRoleAction(userId, newRole);
        if (res.success) {
          setSuccess(`User role updated to ${newRole} successfully.`);
          router.refresh();
        }
      } catch (err: any) {
        setError(err.message || "Failed to update user role.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Alert Banners */}
      {error && (
        <div className="border border-destructive bg-destructive/10 text-destructive p-4 font-mono text-xs uppercase flex items-center gap-2">
          <TriangleAlert size={14} className="shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="border border-primary/30 bg-primary/5 text-primary p-4 font-mono text-xs uppercase flex items-center gap-2">
          <CheckCircle2 size={14} className="shrink-0" />
          {success}
        </div>
      )}

      {/* Filter Toolbar */}
      <form onSubmit={handleFilterSubmit} className="border border-border bg-card p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search name, email, or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full font-mono text-xs shadow-none border-border focus-visible:ring-0 rounded-none bg-background uppercase placeholder:normal-case"
          />
        </div>

        <div className="w-full md:w-48">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full h-8 px-3 font-mono text-xs uppercase tracking-wider bg-background border border-border outline-none focus-visible:ring-0 rounded-none cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="VOLUNTEER">Volunteer</option>
            <option value="STUDENT">Student</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isPending}
            className="font-mono text-[10px] uppercase tracking-wider rounded-none h-8 px-4 shadow-none bg-primary text-primary-foreground hover:bg-primary/80"
          >
            Apply
          </Button>
          {(search || roleFilter !== "ALL") && (
            <Button
              type="button"
              onClick={handleClearFilters}
              variant="outline"
              className="font-mono text-[10px] uppercase tracking-wider rounded-none h-8 px-4 shadow-none border-border hover:bg-surface-container"
            >
              Clear
            </Button>
          )}
        </div>
      </form>

      {/* Users Table */}
      <div className="border border-border bg-card">
        {initialUsers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground font-mono text-xs uppercase">
            No users match the search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border font-mono text-[10px] uppercase text-muted-foreground bg-surface-container/30">
                  <th className="py-3 px-4">User Info</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {initialUsers.map((user) => {
                  const isSelf = user.id === currentUserId;
                  const dateStr = new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr key={user.id} className="hover:bg-surface-container/20 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-sans text-xs font-bold text-foreground block">
                          {user.name} {isSelf && <span className="font-mono text-[9px] text-primary uppercase ml-1.5 border border-primary/20 px-1 py-0.5">(You)</span>}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground block">
                          {user.email}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                        {user.rollNumber || "N/A"}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                        {user.phone || "N/A"}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 font-mono text-[9px] uppercase font-semibold border ${
                          user.role === "ADMIN"
                            ? "bg-primary/10 text-primary border-primary/30"
                            : user.role === "VOLUNTEER"
                            ? "bg-secondary-container text-on-secondary-container border-border"
                            : "bg-muted text-muted-foreground border-border"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isSelf ? (
                          <span className="font-mono text-[10px] text-muted-foreground uppercase mr-2">Locked</span>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              disabled={isPending}
                              className={cn(
                                buttonVariants({ variant: "outline" }),
                                "font-mono text-[10px] uppercase h-8 shadow-none rounded-none border-border px-3 cursor-pointer"
                              )}
                            >
                              Edit Role
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-none border-border bg-card shadow-lg font-mono text-xs uppercase">
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(user.id, "STUDENT")}
                                className="cursor-pointer hover:bg-surface-container"
                              >
                                Make Student
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(user.id, "VOLUNTEER")}
                                className="cursor-pointer hover:bg-surface-container"
                              >
                                Make Volunteer
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(user.id, "ADMIN")}
                                className="cursor-pointer hover:bg-surface-container"
                              >
                                Make Admin
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
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
