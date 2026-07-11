"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSession, signIn, signUp } from "@/lib/auth-client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(10, "Invalid phone number"),
  rollNumber: z.string().min(5, "Invalid registration number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: sessionLoading } = useSession();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Set mode based on query param if present
  useEffect(() => {
    const queryMode = searchParams.get("mode");
    if (queryMode === "register") {
      setMode("register");
    } else {
      setMode("login");
    }
  }, [searchParams]);

  // Redirect if already authenticated
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
        {
          email: data.email,
          password: data.password,
        },
        {
          onRequest: () => setLoading(true),
          onResponse: () => setLoading(false),
          onError: (ctx) => {
            setError(ctx.error.message || "Failed to sign in");
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
          role: "STUDENT",
          phone: data.phone,
          rollNumber: data.rollNumber,
        },
        {
          onRequest: () => setLoading(true),
          onResponse: () => setLoading(false),
          onError: (ctx) => {
            setError(ctx.error.message || "Failed to sign up");
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
      <div className="min-h-screen flex items-center justify-center bg-background font-mono text-sm text-primary uppercase">
        Verifying Security Protocol...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background font-sans selection:bg-primary-container/20 selection:text-primary">
      {/* Background Grid Accent */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden opacity-[0.03]">
        <div className="h-full w-full max-w-[1440px] mx-auto grid grid-cols-12 gap-4 px-6 border-x border-outline">
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="border-r border-outline h-full" />
          ))}
        </div>
      </div>

      <div className="w-full max-w-[400px] flex flex-col items-center">
        {/* Header / Brand */}
        <header className="mb-8 text-center">
          <Link href="/">
            <h1 className="font-heading text-3xl font-extrabold tracking-tighter text-primary uppercase hover:opacity-85 transition-opacity">
              Matrix
            </h1>
          </Link>
          <div className="h-1 w-12 bg-primary mx-auto mt-1"></div>
        </header>

        {/* Card */}
        <Card className="w-full bg-surface-container-low border border-border p-6 flex flex-col gap-6 rounded-none shadow-none">
          <div className="border-b border-outline-variant pb-3 -mx-6 px-6 bg-surface-container-high -mt-6">
            <span className="font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              {mode === "login" ? "Authentication Required" : "Registration Protocol"}
            </span>
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-none border-destructive bg-destructive/5 text-destructive">
              <span className="material-symbols-outlined text-[16px] mr-1">error</span>
              <AlertDescription className="font-mono text-xs uppercase">{error}</AlertDescription>
            </Alert>
          )}

          {mode === "login" ? (
            <form onSubmit={handleLoginSubmit(onLogin)} className="flex flex-col gap-4">
              {/* Email */}
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="email">
                  Email Address
                </Label>
                <div className="border border-border bg-white flex items-center px-2 focus-within:border-2 focus-within:border-primary">
                  <span className="material-symbols-outlined text-muted-foreground mr-2">alternate_email</span>
                  <Input
                    {...registerLogin("email")}
                    className="w-full py-3 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm text-foreground shadow-none"
                    id="email"
                    placeholder="user@matrix-platform.systems"
                    type="email"
                    disabled={loading}
                  />
                </div>
                {loginErrors.email && (
                  <span className="font-mono text-[10px] text-destructive uppercase mt-1">
                    {loginErrors.email.message}
                  </span>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="password">
                  Password
                </Label>
                <div className="border border-border bg-white flex items-center px-2 focus-within:border-2 focus-within:border-primary">
                  <span className="material-symbols-outlined text-muted-foreground mr-2">lock</span>
                  <Input
                    {...registerLogin("password")}
                    className="w-full py-3 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm text-foreground shadow-none"
                    id="password"
                    placeholder="••••••••"
                    type="password"
                    disabled={loading}
                  />
                </div>
                {loginErrors.password && (
                  <span className="font-mono text-[10px] text-destructive uppercase mt-1">
                    {loginErrors.password.message}
                  </span>
                )}
              </div>

              {/* Submit */}
              <button
                className="mt-4 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest py-3 flex items-center justify-center gap-1 hover:bg-primary-container active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                type="submit"
                disabled={loading}
              >
                {loading ? "LOGGING IN..." : "Log in"}
                <span className="material-symbols-outlined !text-[14px]">login</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit(onRegister)} className="flex flex-col gap-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="name">
                  Full Name
                </Label>
                <Input
                  {...registerSignup("name")}
                  className="w-full hairline-border bg-white p-3 font-mono text-sm focus:border-2 focus:border-primary focus:outline-none transition-all placeholder:text-outline-variant rounded-none border border-border shadow-none"
                  id="name"
                  placeholder="e.g. ALAN TURING"
                  type="text"
                  disabled={loading}
                />
                {signupErrors.name && (
                  <span className="font-mono text-[10px] text-destructive uppercase mt-1">
                    {signupErrors.name.message}
                  </span>
                )}
              </div>

              {/* Registration Number */}
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="rollNumber">
                  Registration Number
                </Label>
                <Input
                  {...registerSignup("rollNumber")}
                  className="w-full hairline-border bg-white p-3 font-mono text-sm focus:border-2 focus:border-primary focus:outline-none transition-all placeholder:text-outline-variant rounded-none border border-border shadow-none"
                  id="rollNumber"
                  placeholder="e.g. UR23AI001"
                  type="text"
                  disabled={loading}
                />
                {signupErrors.rollNumber && (
                  <span className="font-mono text-[10px] text-destructive uppercase mt-1">
                    {signupErrors.rollNumber.message}
                  </span>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="email-reg">
                  College Email
                </Label>
                <Input
                  {...registerSignup("email")}
                  className="w-full hairline-border bg-white p-3 font-mono text-sm focus:border-2 focus:border-primary focus:outline-none transition-all placeholder:text-outline-variant rounded-none border border-border shadow-none"
                  id="email-reg"
                  placeholder="student@karunya.edu.in"
                  type="email"
                  disabled={loading}
                />
                {signupErrors.email && (
                  <span className="font-mono text-[10px] text-destructive uppercase mt-1">
                    {signupErrors.email.message}
                  </span>
                )}
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="phone">
                  Phone Number
                </Label>
                <Input
                  {...registerSignup("phone")}
                  className="w-full hairline-border bg-white p-3 font-mono text-sm focus:border-2 focus:border-primary focus:outline-none transition-all placeholder:text-outline-variant rounded-none border border-border shadow-none"
                  id="phone"
                  placeholder="9876543210"
                  type="tel"
                  disabled={loading}
                />
                {signupErrors.phone && (
                  <span className="font-mono text-[10px] text-destructive uppercase mt-1">
                    {signupErrors.phone.message}
                  </span>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="password-reg">
                  Secure Password
                </Label>
                <Input
                  {...registerSignup("password")}
                  className="w-full hairline-border bg-white p-3 font-mono text-sm focus:border-2 focus:border-primary focus:outline-none transition-all placeholder:text-outline-variant rounded-none border border-border shadow-none"
                  id="password-reg"
                  placeholder="••••••••"
                  type="password"
                  disabled={loading}
                />
                {signupErrors.password && (
                  <span className="font-mono text-[10px] text-destructive uppercase mt-1">
                    {signupErrors.password.message}
                  </span>
                )}
              </div>

              {/* Submit */}
              <button
                className="mt-4 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest py-3 flex items-center justify-center gap-1 hover:bg-primary-container active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                type="submit"
                disabled={loading}
              >
                {loading ? "CREATING..." : "Create Account"}
                <span className="material-symbols-outlined !text-[14px]">person_add</span>
              </button>
            </form>
          )}

          {/* Toggle mode */}
          <div className="text-center font-mono text-xs mt-2 border-t border-outline-variant pt-4 flex flex-col items-center gap-2">
            {mode === "login" ? (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Don't have an account?</span>
                <button
                  onClick={() => setMode("register")}
                  className="text-primary font-bold hover:underline uppercase tracking-wider"
                  disabled={loading}
                >
                  Register
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Already have an account?</span>
                <button
                  onClick={() => setMode("login")}
                  className="text-primary font-bold hover:underline uppercase tracking-wider"
                  disabled={loading}
                >
                  Log in
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Footer */}
        <footer className="mt-8 text-center w-full">
          <div className="flex justify-between items-center opacity-40 border-t border-outline-variant pt-4 px-1">
            <span className="font-mono text-[10px] uppercase">v2.0.24-stable</span>
            <span className="font-mono text-[10px] uppercase">Secure Protocol</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
