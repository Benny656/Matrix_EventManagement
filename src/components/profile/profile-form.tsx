"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { updatePassword, updateProfile, signOut as firebaseSignOut, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { clearPersistentCache } from "@/lib/swr-cache";
import { clearAllUIState } from "@/lib/use-ui-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  User,
  Hash,
  Smartphone,
  Lock,
  LogOut,
  AlertCircle,
  CheckCircle2,
  CalendarCheck,
  UserCheck,
  Loader2,
  GraduationCap,
} from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  phoneNumber: z.string().refine((val) => {
    if (!val) return true;
    return /^[6-9]\d{9}$/.test(val);
  }, "Enter a valid 10-digit phone number (e.g. 9876543210)"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, "Password must be at least 6 characters"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

interface ProfileFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "VOLUNTEER" | "STUDENT" | "FACULTY" | "FACULTY_ADMIN";
    rollNumber: string | null;
    programType?: string | null;
    degree?: string | null;
    phoneNumber: string;
  };
  stats: { label: string; value: number }[];
}

export default function ProfileForm({ user, stats }: ProfileFormProps) {
  const router = useRouter();

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      phoneNumber: user.phoneNumber ? user.phoneNumber.replace(/\D/g, "").slice(0, 10) : "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const onUpdateProfile = async (data: ProfileFormValues) => {
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: data.name });
      }

      await updateDoc(doc(db, "users", user.id), {
        name: data.name,
        phoneNumber: data.phoneNumber || "",
        updatedAt: new Date().toISOString(),
      });

      setProfileSuccess("Profile updated successfully!");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setProfileError(err?.message || "Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const onChangePassword = async (data: PasswordFormValues) => {
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error("No active user session.");
      }

      const credential = EmailAuthProvider.credential(currentUser.email, data.currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, data.newPassword);

      setPasswordSuccess("Password updated successfully!");
      resetPasswordForm();
    } catch (err: any) {
      console.error(err);
      setPasswordError(err?.message || "Failed to update password. Verify current password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {}
    clearPersistentCache();
    clearAllUIState();
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  };

  const getStatsIcon = (label: string) => {
    if (label.includes("Registered") || label.includes("Organized")) {
      return <CalendarCheck size={18} className="text-primary" />;
    }
    return <UserCheck size={18} className="text-primary" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Column */}
      <div className="md:col-span-1 space-y-6">
        <div className="glass-panel p-5 rounded-xl flex flex-col gap-4">
          <div className="flex flex-col items-center text-center pb-4 border-b border-border">
            <div className="w-16 h-16 border border-border bg-surface-container-high overflow-hidden rounded-full mb-3 flex items-center justify-center">
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=c0573e,8a726c`}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-heading font-bold text-foreground text-sm uppercase">
              {user.name}
            </span>
            <div className="mt-1.5">
              <Badge variant="secondary" className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm">
                {user.role}
              </Badge>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[9px] text-[#747686] uppercase tracking-widest">
                Email Address
              </span>
              <div className="flex items-center gap-2 text-foreground font-sans bg-background/30 px-2.5 py-1.5 rounded-md border border-border/30 select-all">
                <Mail size={13} className="text-muted-foreground shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>

            {user.degree && (
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[9px] text-[#747686] uppercase tracking-widest">
                  Degree & Program
                </span>
                <div className="flex items-center gap-2 text-foreground font-mono bg-background/30 px-2.5 py-1.5 rounded-md border border-border/30 select-all">
                  <GraduationCap size={13} className="text-muted-foreground shrink-0" />
                  <span>
                    {user.degree} {user.programType ? `(${user.programType})` : ""}
                  </span>
                </div>
              </div>
            )}

            {user.rollNumber && (
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[9px] text-[#747686] uppercase tracking-widest">
                  Registration Number
                </span>
                <div className="flex items-center gap-2 text-foreground font-mono bg-background/30 px-2.5 py-1.5 rounded-md border border-border/30 select-all">
                  <Hash size={13} className="text-muted-foreground shrink-0" />
                  <span>{user.rollNumber}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {stats.length > 0 && (
          <div className="glass-panel p-5 rounded-xl space-y-4">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#747686] border-b border-border pb-2">
              Performance Summary
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="bg-surface-container/50 border border-border/40 p-3 rounded-lg flex flex-col gap-2 relative overflow-hidden"
                >
                  <div className="absolute -right-1 -bottom-1 opacity-10">
                    {getStatsIcon(stat.label)}
                  </div>
                  <span className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground leading-none">
                    {stat.label}
                  </span>
                  <span className="font-heading text-lg font-extrabold text-foreground leading-none">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleSignOut}
          variant="destructive"
          className="w-full flex items-center justify-center gap-2 h-9 text-xs font-mono uppercase tracking-widest"
        >
          <LogOut size={14} />
          Sign Out Session
        </Button>
      </div>

      {/* Right Column */}
      <div className="md:col-span-2 space-y-6">
        <div className="glass-panel p-6 rounded-xl flex flex-col gap-5">
          <div className="border-b border-border pb-3">
            <h3 className="font-sans text-sm font-semibold text-foreground">
              Profile Details
            </h3>
            <p className="font-sans text-xs text-muted-foreground mt-0.5">
              Update your display name and contact phone number.
            </p>
          </div>

          <AnimatePresence>
            {profileError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-2 bg-destructive/5 border border-destructive/20 px-3 py-2.5 rounded-md"
              >
                <AlertCircle size={14} className="text-destructive mt-0.5 shrink-0" />
                <span className="font-mono text-[11px] text-destructive">{profileError}</span>
              </motion.div>
            )}

            {profileSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-2 bg-primary/5 border border-primary/20 px-3 py-2.5 rounded-md"
              >
                <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
                <span className="font-mono text-[11px] text-primary">{profileSuccess}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="font-sans text-xs font-medium text-foreground" htmlFor="name">
                  Full Name
                </Label>
                <div className="flex items-center gap-2 px-3 bg-background/50 border border-border rounded-md focus-within:ring-1 focus-within:ring-primary transition-all">
                  <User size={14} className="text-muted-foreground shrink-0" />
                  <Input
                    {...registerProfile("name")}
                    id="name"
                    disabled={profileLoading}
                    className="flex-1 py-2.5 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 font-sans text-sm text-foreground shadow-none placeholder:text-muted-foreground/30 h-auto"
                    placeholder="Enter full name"
                  />
                </div>
                {profileErrors.name && (
                  <span className="font-sans text-[11px] text-destructive">
                    {profileErrors.name.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="font-sans text-xs font-medium text-foreground" htmlFor="phoneNumber">
                  Phone Number
                </Label>
                <div className="flex items-center gap-2 px-3 bg-background/50 border border-border rounded-md focus-within:ring-1 focus-within:ring-primary transition-all">
                  <Smartphone size={14} className="text-muted-foreground shrink-0" />
                  <Input
                    {...registerProfile("phoneNumber", {
                      onChange: (e) => {
                        e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                      },
                    })}
                    id="phoneNumber"
                    disabled={profileLoading}
                    className="flex-1 py-2.5 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 font-sans text-sm text-foreground shadow-none placeholder:text-muted-foreground/30 h-auto"
                    placeholder="9876543210"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                  />
                </div>
                {profileErrors.phoneNumber && (
                  <span className="font-sans text-[11px] text-destructive">
                    {profileErrors.phoneNumber.message}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={profileLoading}
                className="h-8 px-4 text-xs font-mono uppercase tracking-widest"
              >
                {profileLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </div>

        <div className="glass-panel p-6 rounded-xl flex flex-col gap-5">
          <div className="border-b border-border pb-3">
            <h3 className="font-sans text-sm font-semibold text-foreground">
              Security & Credentials
            </h3>
            <p className="font-sans text-xs text-muted-foreground mt-0.5">
              Change your authentication password. This will require verification.
            </p>
          </div>

          <AnimatePresence>
            {passwordError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-2 bg-destructive/5 border border-destructive/20 px-3 py-2.5 rounded-md"
              >
                <AlertCircle size={14} className="text-destructive mt-0.5 shrink-0" />
                <span className="font-mono text-[11px] text-destructive">{passwordError}</span>
              </motion.div>
            )}

            {passwordSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-2 bg-primary/5 border border-primary/20 px-3 py-2.5 rounded-md"
              >
                <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
                <span className="font-mono text-[11px] text-primary">{passwordSuccess}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label className="font-sans text-xs font-medium text-foreground" htmlFor="currentPassword">
                Current Password
              </Label>
              <div className="flex items-center gap-2 px-3 bg-background/50 border border-border rounded-md focus-within:ring-1 focus-within:ring-primary transition-all">
                <Lock size={14} className="text-muted-foreground shrink-0" />
                <Input
                  {...registerPassword("currentPassword")}
                  id="currentPassword"
                  disabled={passwordLoading}
                  type="password"
                  className="flex-1 py-2.5 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 font-sans text-sm text-foreground shadow-none placeholder:text-muted-foreground/30 h-auto"
                  placeholder="••••••••"
                />
              </div>
              {passwordErrors.currentPassword && (
                <span className="font-sans text-[11px] text-destructive">
                  {passwordErrors.currentPassword.message}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="font-sans text-xs font-medium text-foreground" htmlFor="newPassword">
                  New Password
                </Label>
                <div className="flex items-center gap-2 px-3 bg-background/50 border border-border rounded-md focus-within:ring-1 focus-within:ring-primary transition-all">
                  <Lock size={14} className="text-muted-foreground shrink-0" />
                  <Input
                    {...registerPassword("newPassword")}
                    id="newPassword"
                    disabled={passwordLoading}
                    type="password"
                    className="flex-1 py-2.5 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 font-sans text-sm text-foreground shadow-none placeholder:text-muted-foreground/30 h-auto"
                    placeholder="••••••••"
                  />
                </div>
                {passwordErrors.newPassword && (
                  <span className="font-sans text-[11px] text-destructive">
                    {passwordErrors.newPassword.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="font-sans text-xs font-medium text-foreground" htmlFor="confirmPassword">
                  Confirm New Password
                </Label>
                <div className="flex items-center gap-2 px-3 bg-background/50 border border-border rounded-md focus-within:ring-1 focus-within:ring-primary transition-all">
                  <Lock size={14} className="text-muted-foreground shrink-0" />
                  <Input
                    {...registerPassword("confirmPassword")}
                    id="confirmPassword"
                    disabled={passwordLoading}
                    type="password"
                    className="flex-1 py-2.5 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 font-sans text-sm text-foreground shadow-none placeholder:text-muted-foreground/30 h-auto"
                    placeholder="••••••••"
                  />
                </div>
                {passwordErrors.confirmPassword && (
                  <span className="font-sans text-[11px] text-destructive">
                    {passwordErrors.confirmPassword.message}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={passwordLoading}
                className="h-8 px-4 text-xs font-mono uppercase tracking-widest"
              >
                {passwordLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
