"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { AlertCircle, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";

function extractKarunyaDetails(displayName: string, email: string): { name: string; rollNumber: string | null } {
  if (!email.toLowerCase().endsWith("@karunya.edu.in")) {
    return { name: displayName, rollNumber: null };
  }

  const regex = /URK[A-Za-z0-9]+/i;
  const match = displayName.match(regex);

  if (match) {
    const rollNumber = match[0].toUpperCase();
    const newName = displayName.replace(regex, "").trim().replace(/\s+/g, " ");
    return { name: newName, rollNumber };
  }

  return { name: displayName, rollNumber: null };
}

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
        const rawName = firebaseUser.displayName || email.split("@")[0];
        const { name: finalName, rollNumber } = extractKarunyaDetails(rawName, email);

        await setDoc(userRef, {
          id: firebaseUser.uid,
          name: finalName,
          email: firebaseUser.email,
          rollNumber,
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
      console.error("Google auth error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup closed before completion. Please try again.");
      } else if (err.code === "auth/internal-error" || err.code === "auth/operation-not-allowed") {
        setError("Google Sign-In is not enabled in Firebase Console. Go to Firebase Console -> Authentication -> Sign-in method and enable Google.");
      } else if (err.code !== "auth/cancelled-popup-request") {
        setError(err.message || "Failed to sign in with Google.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-background relative selection:bg-primary/20 selection:text-primary">
      {/* Fixed top-right theme toggle */}
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      {/* Main Centered Login Container (Guaranteed Strict Max Width 380px) */}
      <motion.div
        className="w-full max-w-sm mx-auto flex flex-col items-center gap-6"
        style={{ maxWidth: "380px", width: "100%" }}
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
        <div
          className="w-full bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col"
          style={{ maxWidth: "380px", width: "100%" }}
        >
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
                  className="flex items-start gap-2.5 bg-destructive/10 border border-destructive/20 p-3 rounded-xl text-destructive text-xs font-sans text-left leading-relaxed"
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
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
                  <Loader2 size={16} className="animate-spin text-primary shrink-0" />
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
            <ShieldCheck size={14} className="text-primary shrink-0" />
            <span>Restricted to @karunya.edu.in accounts</span>
          </div>
        </div>

        {/* Back Link */}
        <Link
          href="/"
          className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={13} />
          <span>Back to home</span>
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
