"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updateUserRoleAction, updateUserProfileAdminAction } from "@/actions/user";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  TriangleAlert,
  CheckCircle2,
  Edit3,
  Loader2,
  Eye,
  AlertCircle,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export interface User {
  id: string;
  name: string;
  email: string;
  rollNumber: string | null;
  phoneNumber?: string | null;
  department?: string | null;
  programType?: "UG" | "PG" | string | null;
  degree?: string | null;
  yearOfStudy?: string | null;
  role: "ADMIN" | "VOLUNTEER" | "STUDENT" | "FACULTY" | "FACULTY_ADMIN";
  onboardingCompleted?: boolean;
  mustChangePassword?: boolean;
  createdAt: string | Date;
  updatedAt?: string | null;
}

interface UsersListTableProps {
  initialUsers: User[];
  currentUserId: string;
  canEditRole?: boolean;
}

const UG_DEGREES = ["B.Tech", "B.Sc", "BCA", "B.Com", "BBA", "B.A"];
const PG_DEGREES = ["M.Tech", "M.Sc", "MCA", "MBA", "M.A", "Ph.D"];

export default function UsersListTable({
  initialUsers,
  currentUserId,
  canEditRole = true,
}: UsersListTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "ALL");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");

  // Edit Form State inside Modal
  const [editName, setEditName] = useState("");
  const [editRollNumber, setEditRollNumber] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editProgramType, setEditProgramType] = useState<"UG" | "PG">("UG");
  const [editDegree, setEditDegree] = useState("");
  const [editYearOfStudy, setEditYearOfStudy] = useState("");
  const [editRole, setEditRole] = useState<User["role"]>("STUDENT");

  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  React.useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const openUserModal = (user: User, mode: "view" | "edit" = "view") => {
    setSelectedUser(user);
    setModalMode(mode);
    setModalError(null);
    setModalSuccess(null);

    // Populate edit form states
    setEditName(user.name || "");
    setEditRollNumber(user.rollNumber || "");
    setEditPhoneNumber(user.phoneNumber ? user.phoneNumber.replace(/\D/g, "") : "");
    setEditDepartment(user.department || "");
    setEditProgramType((user.programType === "PG" ? "PG" : "UG") as "UG" | "PG");
    setEditDegree(user.degree || "");
    setEditYearOfStudy(user.yearOfStudy || "");
    setEditRole(user.role);
  };

  const closeUserModal = () => {
    setSelectedUser(null);
    setModalMode("view");
    setModalError(null);
    setModalSuccess(null);
  };

  const handleProgramTypeChangeInEdit = (val: "UG" | "PG") => {
    setEditProgramType(val);
    const available = val === "UG" ? UG_DEGREES : PG_DEGREES;
    if (!available.includes(editDegree)) {
      setEditDegree("");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setModalError(null);
    setModalSuccess(null);

    if (!editName.trim()) {
      setModalError("Full name is required.");
      return;
    }

    if (editPhoneNumber) {
      const cleaned = editPhoneNumber.replace(/\D/g, "");
      if (!/^[6-9]\d{9}$/.test(cleaned)) {
        setModalError("Valid 10-digit Indian phone number required.");
        return;
      }
    }

    setModalLoading(true);

    try {
      const res = await updateUserProfileAdminAction(selectedUser.id, {
        name: editName.trim(),
        rollNumber: editRollNumber.trim() || null,
        phoneNumber: editPhoneNumber.replace(/\D/g, "") || null,
        department: editDepartment.trim() || null,
        programType: editProgramType,
        degree: editDegree || null,
        yearOfStudy: editYearOfStudy || null,
        role: editRole,
      });

      if (res.success) {
        setModalSuccess("Profile updated successfully!");

        const updatedUser: User = {
          ...selectedUser,
          name: editName.trim(),
          rollNumber: editRollNumber.trim() || null,
          phoneNumber: editPhoneNumber.replace(/\D/g, "") || null,
          department: editDepartment.trim() || null,
          programType: editProgramType,
          degree: editDegree || null,
          yearOfStudy: editYearOfStudy || null,
          role: editRole,
          updatedAt: new Date().toISOString(),
        };

        setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
        setSelectedUser(updatedUser);

        setTimeout(() => {
          setModalMode("view");
          setModalSuccess(null);
        }, 1000);

        router.refresh();
      }
    } catch (err: any) {
      setModalError(err.message || "Failed to update profile.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleRoleChange = (userId: string, newRole: User["role"]) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const res = await updateUserRoleAction(userId, newRole);
        if (res.success) {
          setSuccess(`User role updated to ${newRole}.`);
          setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
          router.refresh();
        }
      } catch (err: any) {
        setError(err.message || "Failed to update user role.");
      }
    });
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (roleFilter !== "ALL") params.set("role", roleFilter);
    router.push(canEditRole ? `/admin/users?${params.toString()}` : `/volunteer/users?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setError(null);
    setSuccess(null);
    router.push(canEditRole ? "/admin/users" : "/volunteer/users");
  };

  return (
    <>
      {/* ── User Profile & Edit Dialog Modal ── */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => { if (!open) closeUserModal(); }}>
        {selectedUser && (
          <DialogContent className="rounded-xl border border-border bg-card w-[96vw] max-w-[420px] max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 shadow-2xl flex flex-col gap-0">
            {/* Modal Header */}
            <div className="bg-surface-container/30 border-b border-border p-4 pr-10 relative w-full">
              <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 border border-border bg-background overflow-hidden rounded-full flex items-center justify-center shrink-0 shadow-xs">
                  <img
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedUser.name)}&backgroundColor=c0573e,8a726c`}
                    alt={selectedUser.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="font-heading text-sm font-bold text-foreground truncate">
                      {selectedUser.name}
                    </h2>
                    {selectedUser.id === currentUserId && (
                      <span className="font-mono text-[9px] text-primary uppercase border border-primary/30 px-1 py-0.2 shrink-0 rounded-sm">
                        You
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground truncate w-full" title={selectedUser.email}>
                    {selectedUser.email}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className={cn("px-1.5 py-0.5 font-mono text-[8px] uppercase font-semibold border rounded-sm",
                      ["ADMIN", "FACULTY_ADMIN"].includes(selectedUser.role)
                        ? "bg-primary/10 text-primary border-primary/30"
                        : ["VOLUNTEER", "FACULTY"].includes(selectedUser.role)
                        ? "bg-secondary-container text-on-secondary-container border-border"
                        : "bg-muted text-muted-foreground border-border"
                    )}>
                      {selectedUser.role}
                    </span>
                    <span className={cn("px-1.5 py-0.5 font-mono text-[8px] uppercase font-medium border rounded-sm",
                      selectedUser.onboardingCompleted
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    )}>
                      {selectedUser.onboardingCompleted ? "Active" : "Pending"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4">
              {modalError && (
                <div className="border border-destructive/40 bg-destructive/10 text-destructive p-3 font-mono text-xs uppercase flex items-center gap-2 rounded-md">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalSuccess && (
                <div className="border border-primary/40 bg-primary/10 text-primary p-3 font-mono text-xs uppercase flex items-center gap-2 rounded-md">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{modalSuccess}</span>
                </div>
              )}

              {modalMode === "view" ? (
                /* ─── VIEW MODE (Simple, Elegant, Clean 2-Col Grid) ─── */
                <div className="space-y-4 font-mono text-xs">
                  <div className="grid grid-cols-1 gap-2.5 bg-surface-container-low/40 p-4 border border-border/60 rounded-lg">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <span className="text-[10px] uppercase text-muted-foreground">Roll No</span>
                      <span className="font-bold text-foreground text-right">{selectedUser.rollNumber || "N/A"}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <span className="text-[10px] uppercase text-muted-foreground">Phone</span>
                      <span className="text-foreground text-right">{selectedUser.phoneNumber || "Not provided"}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <span className="text-[10px] uppercase text-muted-foreground">Department</span>
                      <span className="text-foreground text-right">{selectedUser.department || "N/A"}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <span className="text-[10px] uppercase text-muted-foreground">Degree</span>
                      <span className="text-foreground text-right">{selectedUser.degree ? `${selectedUser.degree} ${selectedUser.programType ? `(${selectedUser.programType})` : ""}` : "N/A"}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase text-muted-foreground">Year</span>
                      <span className="text-foreground text-right">{selectedUser.yearOfStudy || "N/A"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* ─── EDIT MODE ─── */
                <form onSubmit={handleSaveProfile} className="space-y-4 font-mono text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground" htmlFor="editName">
                        Full Name *
                      </Label>
                      <Input
                        id="editName"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        disabled={modalLoading}
                        className="font-sans text-xs rounded-md border-border bg-background h-8"
                        placeholder="Full Name"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground" htmlFor="editPhone">
                        Phone Number
                      </Label>
                      <Input
                        id="editPhone"
                        value={editPhoneNumber}
                        onChange={(e) => setEditPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        disabled={modalLoading}
                        className="font-mono text-xs rounded-md border-border bg-background h-8"
                        placeholder="10-digit Mobile Number"
                        maxLength={10}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground" htmlFor="editRollNo">
                        Roll / Register Number
                      </Label>
                      <Input
                        id="editRollNo"
                        value={editRollNumber}
                        onChange={(e) => setEditRollNumber(e.target.value)}
                        disabled={modalLoading}
                        className="font-mono text-xs rounded-md border-border bg-background uppercase h-8"
                        placeholder="e.g. URK25CS7102"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground" htmlFor="editDept">
                        Department
                      </Label>
                      <Input
                        id="editDept"
                        value={editDepartment}
                        onChange={(e) => setEditDepartment(e.target.value)}
                        disabled={modalLoading}
                        className="font-mono text-xs rounded-md border-border bg-background uppercase h-8"
                        placeholder="e.g. AI, AIML, CSE"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground" htmlFor="editProgram">
                        Program Level
                      </Label>
                      <select
                        id="editProgram"
                        value={editProgramType}
                        onChange={(e) => handleProgramTypeChangeInEdit(e.target.value as any)}
                        disabled={modalLoading}
                        className="w-full h-8 px-2.5 font-mono text-xs uppercase bg-background border border-border rounded-md"
                      >
                        <option value="UG">UG (Undergraduate)</option>
                        <option value="PG">PG (Postgraduate)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground" htmlFor="editDegree">
                        Degree
                      </Label>
                      <select
                        id="editDegree"
                        value={editDegree}
                        onChange={(e) => setEditDegree(e.target.value)}
                        disabled={modalLoading}
                        className="w-full h-8 px-2.5 font-mono text-xs uppercase bg-background border border-border rounded-md"
                      >
                        <option value="">Select Degree...</option>
                        {(editProgramType === "UG" ? UG_DEGREES : PG_DEGREES).map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground" htmlFor="editYear">
                        Year of Study
                      </Label>
                      <select
                        id="editYear"
                        value={editYearOfStudy}
                        onChange={(e) => setEditYearOfStudy(e.target.value)}
                        disabled={modalLoading}
                        className="w-full h-8 px-2.5 font-mono text-xs uppercase bg-background border border-border rounded-md"
                      >
                        <option value="">Select Year...</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground" htmlFor="editRole">
                        Role
                      </Label>
                      <select
                        id="editRole"
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as any)}
                        disabled={modalLoading || (selectedUser.id === currentUserId)}
                        className="w-full h-8 px-2.5 font-mono text-xs uppercase bg-background border border-border rounded-md disabled:opacity-50"
                      >
                        <option value="STUDENT">Student</option>
                        <option value="VOLUNTEER">Volunteer</option>
                        <option value="FACULTY">Faculty</option>
                        <option value="FACULTY_ADMIN">Faculty Admin</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setModalMode("view")}
                      disabled={modalLoading}
                      className="font-mono text-xs uppercase tracking-wider rounded-md h-8 px-3 border-border shadow-none"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={modalLoading}
                      className="font-mono text-xs uppercase tracking-wider rounded-md h-8 px-4 bg-primary text-primary-foreground hover:bg-primary/80 shadow-none flex items-center gap-1.5"
                    >
                      {modalLoading ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        "Save Profile"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-surface-container/20 border-t border-border p-3 flex items-center justify-between gap-3 w-full mt-auto">
              {canEditRole && (
                <div>
                  {modalMode === "view" ? (
                    <Button
                      type="button"
                      onClick={() => setModalMode("edit")}
                      size="sm"
                      className="font-mono text-xs uppercase tracking-wider rounded-md h-8 px-4 bg-primary text-primary-foreground hover:bg-primary/80 shadow-none flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 size={13} />
                      Edit Profile
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => {
                        setModalMode("view");
                        setModalError(null);
                        setModalSuccess(null);
                      }}
                      variant="outline"
                      size="sm"
                      className="font-mono text-xs uppercase tracking-wider rounded-md h-8 px-4 border-border shadow-none flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye size={13} />
                      View Details
                    </Button>
                  )}
                </div>
              )}

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={closeUserModal}
                className="font-mono text-xs uppercase tracking-wider rounded-md h-8 px-4 border-border shadow-none ml-auto cursor-pointer"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* ── Main Table ── */}
      <div className="space-y-4">
        {/* Alert Banners */}
        {error && (
          <div className="border border-destructive bg-destructive/10 text-destructive p-3.5 font-mono text-xs uppercase flex items-center gap-2 rounded-md">
            <TriangleAlert size={14} className="shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="border border-primary/30 bg-primary/5 text-primary p-3.5 font-mono text-xs uppercase flex items-center gap-2 rounded-md">
            <CheckCircle2 size={14} className="shrink-0" />
            {success}
          </div>
        )}

        {/* Filter Toolbar */}
        <form onSubmit={handleFilterSubmit} className="border border-border bg-card p-3.5 flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search name, email, roll number, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full font-mono text-xs shadow-none border-border focus-visible:ring-0 rounded-none bg-background uppercase placeholder:normal-case h-8"
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
              <option value="FACULTY_ADMIN">Faculty Admin</option>
              <option value="FACULTY">Faculty</option>
              <option value="VOLUNTEER">Volunteer</option>
              <option value="STUDENT">Student</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isPending}
              className="font-mono text-[10px] uppercase tracking-wider rounded-none h-8 px-4 shadow-none bg-primary text-primary-foreground hover:bg-primary/80 cursor-pointer"
            >
              Apply
            </Button>
            {(search || roleFilter !== "ALL") && (
              <Button
                type="button"
                onClick={handleClearFilters}
                variant="outline"
                className="font-mono text-[10px] uppercase tracking-wider rounded-none h-8 px-4 shadow-none border-border hover:bg-surface-container cursor-pointer"
              >
                Clear
              </Button>
            )}
          </div>
        </form>

        {/* Users Table */}
        <div className="border border-border bg-card">
          {users.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground font-mono text-xs uppercase">
              No users match the search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border font-mono text-[10px] uppercase text-muted-foreground bg-surface-container/30">
                    <th className="py-3 px-4">User Profile</th>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Department / Degree</th>
                    <th className="py-3 px-4">Joined</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => {
                    const isSelf = user.id === currentUserId;
                    const dateStr = new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-surface-container/20 transition-colors cursor-pointer group"
                        onClick={() => openUserModal(user, "view")}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 border border-border bg-surface-container-high rounded-full overflow-hidden shrink-0 flex items-center justify-center">
                              <img
                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=c0573e,8a726c`}
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <span className="font-sans text-xs font-bold text-foreground group-hover:text-primary transition-colors block truncate">
                                {user.name}{" "}
                                {isSelf && (
                                  <span className="font-mono text-[9px] text-primary uppercase ml-1 border border-primary/20 px-1 py-0.5">
                                    You
                                  </span>
                                )}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground block truncate">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                          {user.rollNumber || "N/A"}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                          {user.department || user.degree ? (
                            <span className="truncate block">
                              {user.department || ""}{user.department && user.degree ? " • " : ""}{user.degree || ""}
                            </span>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                          {dateStr}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 font-mono text-[9px] uppercase font-semibold border ${
                              ["ADMIN", "FACULTY_ADMIN"].includes(user.role)
                                ? "bg-primary/10 text-primary border-primary/30"
                                : ["VOLUNTEER", "FACULTY"].includes(user.role)
                                ? "bg-secondary-container text-on-secondary-container border-border"
                                : "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          {isSelf ? (
                            <span className="font-mono text-[10px] text-muted-foreground uppercase mr-2">
                              Locked
                            </span>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                disabled={isPending}
                                className={cn(
                                  buttonVariants({ variant: "outline" }),
                                  "font-mono text-[10px] uppercase h-8 shadow-none rounded-none border-border px-3 cursor-pointer"
                                )}
                              >
                                Actions
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="rounded-none border-border bg-card shadow-lg font-mono text-xs uppercase"
                              >
                                {/* View Full Profile */}
                                <DropdownMenuItem
                                  onClick={() => openUserModal(user, "view")}
                                  className="cursor-pointer hover:bg-surface-container flex items-center gap-2"
                                >
                                  <Eye size={12} />
                                  View Details
                                </DropdownMenuItem>

                                {/* Edit User Profile */}
                                {canEditRole && (
                                  <DropdownMenuItem
                                    onClick={() => openUserModal(user, "edit")}
                                    className="cursor-pointer hover:bg-surface-container flex items-center gap-2"
                                  >
                                    <Edit3 size={12} />
                                    Edit Profile
                                  </DropdownMenuItem>
                                )}

                                {/* Role Editing Options */}
                                {canEditRole && (
                                  <>
                                    <DropdownMenuSeparator className="bg-border" />
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
                                      onClick={() => handleRoleChange(user.id, "FACULTY")}
                                      className="cursor-pointer hover:bg-surface-container"
                                    >
                                      Make Faculty
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleRoleChange(user.id, "FACULTY_ADMIN")}
                                      className="cursor-pointer hover:bg-surface-container"
                                    >
                                      Make Faculty Admin
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleRoleChange(user.id, "ADMIN")}
                                      className="cursor-pointer hover:bg-surface-container"
                                    >
                                      Make Admin
                                    </DropdownMenuItem>
                                  </>
                                )}
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
    </>
  );
}
