"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AtSign, MailCheck, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    setLoading(true);
    setError(null);
    try {
      await authClient.requestPasswordReset(
        {
          email: data.email.toLowerCase().trim(),
          redirectTo: "/reset-password",
        },
        {
          onRequest: () => setLoading(true),
          onResponse: () => setLoading(false),
          onSuccess: () => {
            setSuccess(true);
          },
          onError: (ctx) => {
            setError(ctx.error.message || "Failed to process request. Please try again.");
          },
        }
      );
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
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
              Reset your password
            </span>
            <p className="font-sans text-xs text-muted-foreground mt-0.5">
              Enter your college email address and we will send you a reset link.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center text-center py-4 gap-3"
              >
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <MailCheck size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-sans text-sm font-semibold text-foreground">Check your inbox</h3>
                  <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                    If an account exists with that email, a reset link has been sent. Please check your spam folder if you do not receive it shortly.
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

                <div className="flex flex-col gap-1.5">
                  <Label className="font-sans text-xs font-medium text-foreground" htmlFor="email">
                    College email
                  </Label>
                  <div className="flex items-center gap-2 px-3 bg-background/50 transition-all border border-border rounded-md focus-within:ring-1 focus-within:ring-primary">
                    <AtSign size={14} className="text-muted-foreground shrink-0" />
                    <Input
                      {...register("email")}
                      className="flex-1 py-2.5 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 font-sans text-sm text-foreground shadow-none placeholder:text-muted-foreground/50 h-auto"
                      id="email"
                      placeholder="student@karunya.edu.in"
                      type="email"
                      disabled={loading}
                    />
                  </div>
                  {errors.email && (
                    <span className="font-sans text-[11px] text-destructive">{errors.email.message}</span>
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
                      <span>Sending link…</span>
                    </>
                  ) : (
                    <span>Send reset link</span>
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
