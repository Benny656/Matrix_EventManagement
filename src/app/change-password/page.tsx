"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forceSetNewPasswordAction } from "@/actions/user";
import ThemeToggle from "@/components/theme-toggle";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must include at least one uppercase letter")
      .regex(/[0-9]/, "Must include at least one number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setServerError(null);
    try {
      const result = await forceSetNewPasswordAction(data.newPassword);
      if (result.success) {
        router.push("/login");
      }
    } catch (err: any) {
      setServerError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background to-surface-container relative selection:bg-primary/10 selection:text-primary">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div
        className="w-full max-w-[400px] flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="w-full text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <ShieldCheck size={22} className="text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight mb-1">
            Set a new password
          </h1>
          <p className="font-sans text-sm text-muted-foreground">
            Your account was given a temporary password. Please choose a permanent one before continuing.
          </p>
        </div>

        {/* Card */}
        <div className="w-full border border-border bg-card p-6 flex flex-col gap-5">
          {/* Server error */}
          {serverError && (
            <div className="flex items-start gap-2 border border-destructive bg-destructive/10 text-destructive p-3 font-sans text-xs leading-relaxed">
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* New password */}
            <div className="flex flex-col gap-1.5">
              <Label className="font-sans text-xs font-medium text-foreground" htmlFor="new-password">
                New password
              </Label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <Input
                  {...register("newPassword")}
                  id="new-password"
                  type="password"
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  className="pl-9 bg-background/50 font-sans text-sm text-foreground shadow-none h-10 placeholder:text-muted-foreground/50 border border-border rounded-md focus-visible:ring-1 focus-visible:ring-primary"
                  disabled={loading}
                />
              </div>
              {errors.newPassword && (
                <span className="font-sans text-[11px] text-destructive">{errors.newPassword.message}</span>
              )}
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <Label className="font-sans text-xs font-medium text-foreground" htmlFor="confirm-password">
                Confirm password
              </Label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <Input
                  {...register("confirmPassword")}
                  id="confirm-password"
                  type="password"
                  placeholder="Re-enter your new password"
                  className="pl-9 bg-background/50 font-sans text-sm text-foreground shadow-none h-10 placeholder:text-muted-foreground/50 border border-border rounded-md focus-visible:ring-1 focus-visible:ring-primary"
                  disabled={loading}
                />
              </div>
              {errors.confirmPassword && (
                <span className="font-sans text-[11px] text-destructive">{errors.confirmPassword.message}</span>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="mt-1 w-full bg-primary text-primary-foreground font-sans text-sm font-medium py-2.5 px-4 flex items-center justify-center gap-2 hover:bg-primary-container transition-colors disabled:opacity-50 disabled:pointer-events-none"
              style={{ borderRadius: "6px" }}
            >
              {loading ? "Saving…" : "Save new password"}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
