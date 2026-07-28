"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, AlertCircle, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const oobCode = searchParams.get("oobCode") || searchParams.get("token");
  const errorParam = searchParams.get("error");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (errorParam === "INVALID_TOKEN") {
      setError("The password reset link is invalid or has expired.");
    }
  }, [errorParam]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordValues) => {
    if (!oobCode) {
      setError("Reset token is missing. Please request a new link.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await confirmPasswordReset(auth, oobCode, data.password);
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  const isInvalidTokenState = !oobCode || errorParam === "INVALID_TOKEN";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background to-surface-container relative selection:bg-primary/10 selection:text-primary">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div
        className="w-full max-w-[400px] flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Brand */}
        <div className="text-center flex flex-col items-center gap-2">
          <Link href="/" className="inline-block">
            <img src="/logo.png" alt="Matrix Logo" className="h-12 w-12 object-contain mx-auto mb-2 dark:invert" />
            <h1 className="font-heading text-2xl font-bold tracking-tighter text-foreground uppercase hover:opacity-80 transition-opacity">
              Matrix
            </h1>
          </Link>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#747686] mt-1">
            AIML · Karunya University
          </p>
        </div>

        {/* Card */}
        <div className="w-full glass-panel p-6 flex flex-col gap-5 rounded-xl shadow-lg">
          <div className="border-b border-border pb-4">
            <span className="font-sans text-sm font-semibold text-foreground">
              Choose a new password
            </span>
            <p className="font-sans text-xs text-muted-foreground mt-0.5">
              {isInvalidTokenState 
                ? "There was a problem with your recovery link." 
                : "Create a secure password with at least 6 characters."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {isInvalidTokenState ? (
              <motion.div
                key="invalid-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-4 text-center py-2"
              >
                <div className="flex items-start gap-2 bg-destructive/5 border border-destructive/20 px-3 py-3 rounded-md text-left">
                  <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-sans text-xs font-semibold text-destructive">Link expired or invalid</p>
                    <p className="font-sans text-[11px] text-destructive/80 leading-relaxed">
                      For your security, password reset links expire after 1 hour and can only be used once.
                    </p>
                  </div>
                </div>

                <Link
                  href="/forgot-password"
                  className="w-full bg-primary text-primary-foreground font-sans text-sm font-medium py-2.5 px-4 rounded-md text-center hover:bg-primary-container transition-colors inline-block"
                >
                  Request a new link
                </Link>
              </motion.div>
            ) : success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center text-center py-4 gap-3"
              >
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-sans text-sm font-semibold text-foreground">Password reset complete</h3>
                  <p className="font-sans text-xs text-muted-foreground">
                    Your password has been successfully updated. Redirecting you to sign in...
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
                {error && (
                  <div className="flex items-start gap-2 bg-destructive/5 border border-destructive/20 px-3 py-2.5 rounded-md">
                    <AlertCircle size={14} className="text-destructive mt-0.5 shrink-0" />
                    <span className="font-mono text-[11px] text-destructive">{error}</span>
                  </div>
                )}

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <Label className="font-sans text-xs font-medium text-foreground" htmlFor="password">
                    New password
                  </Label>
                  <div className="flex items-center gap-2 px-3 bg-background/50 transition-all border border-border rounded-md focus-within:ring-1 focus-within:ring-primary">
                    <Lock size={14} className="text-muted-foreground shrink-0" />
                    <Input
                      {...register("password")}
                      className="flex-1 py-2.5 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 font-sans text-sm text-foreground shadow-none placeholder:text-muted-foreground/50 h-auto"
                      id="password"
                      placeholder="••••••••"
                      type="password"
                      disabled={loading}
                    />
                  </div>
                  {errors.password && (
                    <span className="font-sans text-[11px] text-destructive">{errors.password.message}</span>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <Label className="font-sans text-xs font-medium text-foreground" htmlFor="confirmPassword">
                    Confirm new password
                  </Label>
                  <div className="flex items-center gap-2 px-3 bg-background/50 transition-all border border-border rounded-md focus-within:ring-1 focus-within:ring-primary">
                    <Lock size={14} className="text-muted-foreground shrink-0" />
                    <Input
                      {...register("confirmPassword")}
                      className="flex-1 py-2.5 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 font-sans text-sm text-foreground shadow-none placeholder:text-muted-foreground/50 h-auto"
                      id="confirmPassword"
                      placeholder="••••••••"
                      type="password"
                      disabled={loading}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <span className="font-sans text-[11px] text-destructive">{errors.confirmPassword.message}</span>
                  )}
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="mt-1 w-full bg-primary text-primary-foreground font-sans text-sm font-medium py-2.5 px-4 flex items-center justify-center gap-2 hover:bg-primary-container transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  style={{ borderRadius: "6px" }}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving password…</span>
                    </>
                  ) : (
                    <span>Save password</span>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Back to Login link */}
        <Link href="/login" className="flex items-center gap-1.5 font-sans text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={12} />
          Back to sign in
        </Link>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen font-sans text-sm bg-background text-muted-foreground">
          Loading…
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
