"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import ThemeToggle from "@/components/theme-toggle";

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="w-4 h-4 shrink-0 mt-0.5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="w-4 h-4 animate-spin text-primary shrink-0" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function LoginContent() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const email = (firebaseUser.email || "").toLowerCase();

      const allowedAdmins = ["matrixkarunya@gmail.com", "bennymanuel2020@gmail.com"];
      const isKarunyaEmail = email.endsWith("@karunya.edu.in") || email.endsWith("@karunya.edu");
      const isAdminEmail = allowedAdmins.includes(email);

      if (!isKarunyaEmail && !isAdminEmail) {
        await signOut(auth);
        setError("Only Karunya Google accounts (@karunya.edu.in) or authorized admins are allowed.");
        setLoading(false);
        return;
      }

      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      let role = isAdminEmail ? "ADMIN" : "STUDENT";

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || email.split("@")[0],
          email: firebaseUser.email,
          rollNumber: null,
          role,
          mustChangePassword: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        const existingData = userSnap.data();
        if (isAdminEmail && existingData.role !== "ADMIN") {
          await updateDoc(userRef, { role: "ADMIN" });
          role = "ADMIN";
        } else {
          role = existingData.role || "STUDENT";
        }
      }

      const token = await firebaseUser.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (role === "ADMIN") router.push("/admin");
      else if (role === "VOLUNTEER") router.push("/volunteer");
      else router.push("/student");
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in was cancelled. Please try again.");
      } else if (err.code !== "auth/cancelled-popup-request") {
        setError(err.message || "Failed to sign in with Google.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-5 bg-background relative selection:bg-primary/20 selection:text-primary">
      {/* Fixed top-right theme toggle */}
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      {/* Main Centered Login Container (Strict Max Width 380px) */}
      <motion.div
        className="w-full max-w-[380px] mx-auto flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-1">
          <Link href="/" className="inline-block group">
            <img
              src="/logo.png"
              alt="Matrix Logo"
              className="h-11 w-11 object-contain mx-auto mb-1 dark:invert group-hover:scale-105 transition-transform"
            />
          </Link>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground uppercase">
            Matrix
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            AIML · Karunya University
          </p>
        </div>

        {/* Solid Compact Card */}
        <div className="w-full bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col">
          {/* Card Top Accent Bar */}
          <div className="h-1 w-full bg-primary" />

          {/* Card Content */}
          <div className="p-6 flex flex-col gap-5 text-center">
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">
                Single Sign-On
              </h2>
              <p className="font-sans text-xs text-muted-foreground mt-1 leading-relaxed">
                Log in directly with your official Karunya Google Workspace account.
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 p-3 rounded-xl text-destructive text-xs font-sans text-left leading-relaxed"
                >
                  <AlertIcon />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google Action Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-background hover:bg-muted/50 text-foreground border border-border font-sans text-sm font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-sm hover:shadow hover:border-primary/40 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  <span className="text-xs text-muted-foreground font-medium">Authenticating...</span>
                </>
              ) : (
                <>
                  <GoogleIcon />
                  <span>Sign in with Google</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Card Security Footer */}
          <div className="bg-muted/40 border-t border-border px-6 py-3 flex items-center justify-center gap-2 font-mono text-[10px] text-muted-foreground text-center">
            <ShieldIcon />
            <span>Restricted to @karunya.edu.in accounts</span>
          </div>
        </div>

        {/* Back Link */}
        <Link
          href="/"
          className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to home
        </Link>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen font-sans text-sm text-muted-foreground bg-background">
          Loading…
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
