"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn, signUp } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AtSign, Lock, LogIn, UserPlus, AlertCircle, ArrowLeft } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(10, "Enter a valid phone number"),
  rollNumber: z.string().min(5, "Enter your registration number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: sessionLoading } = useSession();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const queryMode = searchParams.get("mode");
    if (queryMode === "register") {
      setMode("register");
    } else {
      setMode("login");
    }
  }, [searchParams]);

  useEffect(() => {
    if (session) {
      const role = session.user.role;
      if (role === "ADMIN") {
        router.push("/admin");
      } else if (role === "VOLUNTEER") {
        router.push("/volunteer");
      } else {
        router.push("/student");
      }
    }
  }, [session, router]);

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onLogin = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      await signIn.email(
        { email: data.email, password: data.password },
        {
          onRequest: () => setLoading(true),
          onResponse: () => setLoading(false),
          onError: (ctx) => {
            setError(ctx.error.message || "Failed to sign in. Check your credentials.");
          },
          onSuccess: () => {
            router.refresh();
          },
        }
      );
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  const onRegister = async (data: RegisterFormValues) => {
    setLoading(true);
    setError(null);
    try {
      await signUp.email(
        {
          email: data.email,
          password: data.password,
          name: data.name,
          phone: data.phone,
          rollNumber: data.rollNumber,
        },
        {
          onRequest: () => setLoading(true),
          onResponse: () => setLoading(false),
          onError: (ctx) => {
            setError(ctx.error.message || "Failed to create account.");
          },
          onSuccess: () => {
            router.refresh();
          },
        }
      );
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="theme-clerk min-h-screen flex items-center justify-center bg-background font-mono text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }

  return (
    <div className="theme-clerk min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted selection:bg-primary/10 selection:text-primary">

      <motion.div
        className="w-full max-w-[400px] flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Brand */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="font-heading text-2xl font-bold tracking-tighter text-foreground uppercase hover:opacity-80 transition-opacity">
              Matrix
            </h1>
          </Link>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#747686] mt-1">
            AIML · Karunya University
          </p>
        </div>

        {/* Card — Clerk-style with Glassmorphism */}
        <div
          className="w-full glass-panel p-6 flex flex-col gap-5 rounded-xl shadow-lg"
        >
          {/* Card header */}
          <div className="border-b border-border pb-4">
            <span className="font-sans text-sm font-semibold text-foreground">
              {mode === "login" ? "Sign in to Matrix" : "Create your account"}
            </span>
            <p className="font-sans text-xs text-muted-foreground mt-0.5">
              {mode === "login"
                ? "Use your Karunya college email to continue."
                : "Register with your department details."}
            </p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 bg-destructive/5 border border-destructive/20 px-3 py-2.5 rounded-md"
              >
                <AlertCircle size={14} className="text-destructive mt-0.5 shrink-0" />
                <span className="font-mono text-[11px] text-destructive">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forms */}
          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLoginSubmit(onLogin)}
                className="flex flex-col gap-4"
              >
                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <Label className="font-sans text-xs font-medium text-foreground" htmlFor="email">
                    Email address
                  </Label>
                  <div
                    className="flex items-center gap-2 px-3 bg-background/50 transition-all border border-border rounded-md focus-within:ring-1 focus-within:ring-primary"
                  >
                    <AtSign size={14} className="text-muted-foreground shrink-0" />
                    <Input
                      {...registerLogin("email")}
                      className="flex-1 py-2.5 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 font-sans text-sm text-foreground shadow-none placeholder:text-muted-foreground/50 h-auto"
                      id="email"
                      placeholder="student@karunya.edu.in"
                      type="email"
                      disabled={loading}
                    />
                  </div>
                  {loginErrors.email && (
                    <span className="font-sans text-[11px] text-destructive">{loginErrors.email.message}</span>
                  )}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <Label className="font-sans text-xs font-medium text-foreground" htmlFor="password">
                    Password
                  </Label>
                  <div
                    className="flex items-center gap-2 px-3 bg-background/50 transition-all border border-border rounded-md focus-within:ring-1 focus-within:ring-primary"
                  >
                    <Lock size={14} className="text-muted-foreground shrink-0" />
                    <Input
                      {...registerLogin("password")}
                      className="flex-1 py-2.5 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 font-sans text-sm text-foreground shadow-none placeholder:text-muted-foreground/50 h-auto"
                      id="password"
                      placeholder="••••••••"
                      type="password"
                      disabled={loading}
                    />
                  </div>
                  {loginErrors.password && (
                    <span className="font-sans text-[11px] text-destructive">{loginErrors.password.message}</span>
                  )}
                </div>

                {/* Submit */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="mt-1 w-full bg-primary text-primary-foreground font-sans text-sm font-medium py-2.5 px-4 flex items-center justify-center gap-2 hover:bg-primary-container transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  style={{ borderRadius: "6px" }}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    "Signing in…"
                  ) : (
                    <>
                      <span>Sign in</span>
                      <LogIn size={14} />
                    </>
                  )}
                </motion.button>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSignupSubmit(onRegister)}
                className="flex flex-col gap-4"
              >
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <Label className="font-sans text-xs font-medium text-foreground" htmlFor="name">Full name</Label>
                  <Input
                    {...registerSignup("name")}
                    className="bg-background/50 font-sans text-sm text-foreground shadow-none h-10 placeholder:text-muted-foreground/50 border border-border rounded-md focus-visible:ring-1 focus-visible:ring-primary"
                    id="name"
                    placeholder="e.g. Priya Rajan"
                    type="text"
                    disabled={loading}
                  />
                  {signupErrors.name && (
                    <span className="font-sans text-[11px] text-destructive">{signupErrors.name.message}</span>
                  )}
                </div>

                {/* Registration Number */}
                <div className="flex flex-col gap-1.5">
                  <Label className="font-sans text-xs font-medium text-foreground" htmlFor="rollNumber">
                    University registration number
                  </Label>
                  <Input
                    {...registerSignup("rollNumber")}
                    className="bg-background/50 font-mono text-sm text-foreground shadow-none h-10 placeholder:text-muted-foreground/50 border border-border rounded-md focus-visible:ring-1 focus-visible:ring-primary"
                    id="rollNumber"
                    placeholder="e.g. UR23AI001"
                    type="text"
                    disabled={loading}
                  />
                  {signupErrors.rollNumber && (
                    <span className="font-sans text-[11px] text-destructive">{signupErrors.rollNumber.message}</span>
                  )}
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <Label className="font-sans text-xs font-medium text-foreground" htmlFor="email-reg">
                    College email
                  </Label>
                  <Input
                    {...registerSignup("email")}
                    className="bg-background/50 font-sans text-sm text-foreground shadow-none h-10 placeholder:text-muted-foreground/50 border border-border rounded-md focus-visible:ring-1 focus-visible:ring-primary"
                    id="email-reg"
                    placeholder="student@karunya.edu.in"
                    type="email"
                    disabled={loading}
                  />
                  {signupErrors.email && (
                    <span className="font-sans text-[11px] text-destructive">{signupErrors.email.message}</span>
                  )}
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <Label className="font-sans text-xs font-medium text-foreground" htmlFor="phone">
                    Phone number
                  </Label>
                  <Input
                    {...registerSignup("phone")}
                    className="bg-background/50 font-mono text-sm text-foreground shadow-none h-10 placeholder:text-muted-foreground/50 border border-border rounded-md focus-visible:ring-1 focus-visible:ring-primary"
                    id="phone"
                    placeholder="9876543210"
                    type="tel"
                    disabled={loading}
                  />
                  {signupErrors.phone && (
                    <span className="font-sans text-[11px] text-destructive">{signupErrors.phone.message}</span>
                  )}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <Label className="font-sans text-xs font-medium text-foreground" htmlFor="password-reg">
                    Password
                  </Label>
                  <Input
                    {...registerSignup("password")}
                    className="bg-background/50 font-sans text-sm text-foreground shadow-none h-10 placeholder:text-muted-foreground/50 border border-border rounded-md focus-visible:ring-1 focus-visible:ring-primary"
                    id="password-reg"
                    placeholder="••••••••"
                    type="password"
                    disabled={loading}
                  />
                  {signupErrors.password && (
                    <span className="font-sans text-[11px] text-destructive">{signupErrors.password.message}</span>
                  )}
                </div>

                {/* Submit */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="mt-1 w-full bg-primary text-primary-foreground font-sans text-sm font-medium py-2.5 px-4 flex items-center justify-center gap-2 hover:bg-primary-container transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  style={{ borderRadius: "6px" }}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    "Creating account…"
                  ) : (
                    <>
                      <span>Create account</span>
                      <UserPlus size={14} />
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Toggle mode */}
          <div className="border-t border-border pt-4 text-center">
            {mode === "login" ? (
              <p className="font-sans text-xs text-muted-foreground">
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => { setMode("register"); setError(null); }}
                  className="text-primary font-medium hover:underline"
                  disabled={loading}
                >
                  Register
                </button>
              </p>
            ) : (
              <p className="font-sans text-xs text-muted-foreground">
                Already have an account?{" "}
                <button
                  onClick={() => { setMode("login"); setError(null); }}
                  className="text-primary font-medium hover:underline"
                  disabled={loading}
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Back link */}
        <Link href="/" className="flex items-center gap-1.5 font-sans text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={12} />
          Back to home
        </Link>
      </motion.div>
    </div>
  );
}

import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen font-sans text-sm bg-background text-muted-foreground">
          Loading…
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
