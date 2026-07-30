"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

import ThemeToggle from "@/components/theme-toggle";

import {
  BarChart2,
  CalendarDays,
  Users,
  FileText,
  Home,
  CalendarCheck,
  ScanLine,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface DashboardLayoutProps {
  user: {
    name: string;
    email: string;
    role: "ADMIN" | "VOLUNTEER" | "STUDENT" | "FACULTY" | "FACULTY_ADMIN";
  };
  children: React.ReactNode;
}

export default function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthorized = React.useMemo(() => {
    if (pathname.startsWith("/admin") && user.role !== "ADMIN" && user.role !== "FACULTY_ADMIN") return false;
    if (pathname.startsWith("/volunteer") && user.role !== "VOLUNTEER" && user.role !== "ADMIN" && user.role !== "FACULTY_ADMIN") return false;
    if (pathname.startsWith("/student") && user.role !== "STUDENT" && user.role !== "ADMIN" && user.role !== "FACULTY_ADMIN") return false;
    if (pathname.startsWith("/faculty") && !["FACULTY", "FACULTY_ADMIN", "ADMIN"].includes(user.role)) return false;
    return true;
  }, [pathname, user.role]);

  if (!isAuthorized) {
    return null;
  }

  const getNavItems = (): NavItem[] => {
    switch (user.role) {
      case "ADMIN":
      case "FACULTY_ADMIN":
        return [
          { label: "Overview", href: "/admin", icon: BarChart2 },
          { label: "All Events", href: "/admin/events", icon: CalendarDays },
          { label: "Attendance", href: "/volunteer/attendance", icon: ScanLine },
          { label: "Users", href: "/admin/users", icon: Users },
          { label: "Reports", href: "/admin/reports", icon: FileText },
        ];
      case "VOLUNTEER":
        return [
          { label: "Overview", href: "/volunteer", icon: Home },
          { label: "Events", href: "/volunteer/events", icon: CalendarCheck },
          { label: "Attendance", href: "/volunteer/attendance", icon: ScanLine },
        ];
      case "FACULTY":
        return [
          { label: "Home", href: "/faculty", icon: Home },
          { label: "Events", href: "/faculty/events", icon: CalendarDays },
          { label: "Registrations", href: "/faculty/registrations", icon: CalendarCheck },
        ];
      case "STUDENT":
      default:
        return [
          { label: "Home", href: "/student", icon: Home },
          { label: "Events", href: "/student/events", icon: CalendarDays },
          { label: "Registrations", href: "/student/registrations", icon: CalendarCheck },
        ];
    }
  };

  const navItems = getNavItems();

  const roleLabel = ["ADMIN", "FACULTY_ADMIN"].includes(user.role) ? "Admin" : user.role === "VOLUNTEER" ? "Volunteer" : user.role === "FACULTY" ? "Faculty" : "Student";

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error("Sign out error", e);
    }
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="bg-background text-foreground font-sans min-h-screen flex overflow-hidden">
      {/* Sidebar (Desktop) */}
      <nav className="hidden md:flex flex-col h-full py-5 px-3 bg-surface-container border-r border-border w-60 fixed left-0 top-0 z-40">
        {/* Brand */}
        <Link href="/" className="mb-7 px-3 pb-5 border-b border-border flex items-center gap-3 hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="Matrix Logo" className="h-7 w-7 object-contain opacity-90 dark:invert" />
          <div>
            <span className="font-heading text-base font-bold text-foreground tracking-tighter uppercase">
              Matrix
            </span>
            <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">
              {roleLabel}
            </p>
          </div>
        </Link>

        {/* Nav items */}
        <div className="flex-1 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isRoot = ["/admin", "/volunteer", "/student", "/faculty"].includes(item.href);
            const active = isRoot ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
            const isUpdatesTab = item.label === "Updates";

            return (
              <motion.div key={item.href} whileHover={{ x: 2 }} transition={{ duration: 0.12 }}>
                <Link
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-all rounded-md ${
                    active
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:bg-surface-container-high hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={14} />
                    {item.label}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Sign out */}
        <div className="mt-auto pt-4 border-t border-border">
          <button
            onClick={handleSignOut}
            className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-muted-foreground hover:bg-surface-container-high hover:text-foreground font-mono text-[11px] uppercase tracking-widest transition-colors rounded-sm"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 flex flex-col md:ml-60 h-screen overflow-hidden">
        {/* Top bar */}
        <header className="flex justify-between items-center px-5 w-full z-30 glass-panel h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] sticky top-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-container rounded-sm transition-colors"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <h1 className="font-heading text-base font-bold uppercase tracking-tighter text-foreground">
              {user.name.split(" ")[0]}
            </h1>
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />

            <div
              className="w-7 h-7 ml-1 border border-border bg-surface-container-high overflow-hidden rounded-sm flex items-center justify-center select-none"
              aria-label="User initials"
            >
              <span className="font-mono text-[10px] font-bold text-foreground uppercase leading-none">
                {user.name
                  .split(" ")
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-40 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                key="drawer"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed left-0 top-0 w-60 h-full bg-surface-container pt-[calc(1.25rem+env(safe-area-inset-top))] pb-5 px-3 flex flex-col border-r border-border z-50 md:hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-5 px-3 pb-5 border-b border-border flex justify-between items-center">
                  <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                    <img src="/logo.png" alt="Matrix Logo" className="h-7 w-7 object-contain opacity-90 dark:invert" />
                    <div>
                      <span className="font-heading text-base font-bold text-foreground tracking-tighter uppercase">Matrix</span>
                      <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">{roleLabel}</p>
                    </div>
                  </Link>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
                    <X size={16} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-0.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isRoot = ["/admin", "/volunteer", "/student", "/faculty"].includes(item.href);
                    const active = isRoot ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
                    const isUpdatesTab = item.label === "Updates";

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-all rounded-md ${
                          active
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "text-muted-foreground hover:bg-surface-container-high hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={14} />
                          {item.label}
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-auto pt-4 border-t border-border">
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 text-muted-foreground hover:bg-surface-container-high hover:text-foreground font-mono text-[11px] uppercase tracking-widest transition-all rounded-md"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6 bg-background">
          <div className="h-full">
            {children}
          </div>
        </div>

        {/* Bottom Nav (Mobile) */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden flex justify-around items-center h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] border-t border-border/80 bg-background/80 backdrop-blur-md px-2">
          {navItems.slice(0, 3).map((item) => {
            const Icon = item.icon;
            const isRoot = ["/admin", "/volunteer", "/student", "/faculty"].includes(item.href);
            const active = isRoot ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center h-full py-1.5 transition-all gap-1 rounded-md active:scale-95 ${
                  active ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={18} />
                <span className="font-mono text-[8px] uppercase tracking-widest">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex-1 flex flex-col items-center justify-center h-full py-1.5 text-muted-foreground hover:text-foreground transition-all gap-1 rounded-md active:scale-95 cursor-pointer"
          >
            <Menu size={18} />
            <span className="font-mono text-[8px] uppercase tracking-widest">More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
