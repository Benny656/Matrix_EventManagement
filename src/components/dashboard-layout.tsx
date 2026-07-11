"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface DashboardLayoutProps {
  user: {
    name: string;
    email: string;
    role: "ADMIN" | "VOLUNTEER" | "STUDENT";
  };
  children: React.ReactNode;
}

export default function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getNavItems = (): NavItem[] => {
    switch (user.role) {
      case "ADMIN":
        return [
          { label: "Overview", href: "/admin", icon: "monitoring" },
          { label: "All Events", href: "/admin/events", icon: "calendar_month" },
          { label: "Manage Users", href: "/admin/users", icon: "group" },
          { label: "Updates", href: "/admin/updates", icon: "notifications_active" },
          { label: "Reports", href: "/admin/reports", icon: "summarize" },
        ];
      case "VOLUNTEER":
        return [
          { label: "Overview", href: "/volunteer", icon: "home" },
          { label: "Manage Events", href: "/volunteer/events", icon: "event_note" },
          { label: "Scanner", href: "/volunteer/scan", icon: "qr_code_scanner" },
          { label: "Manual Entry", href: "/volunteer/manual", icon: "edit_calendar" },
          { label: "Updates Feed", href: "/volunteer/updates", icon: "notifications_active" },
        ];
      case "STUDENT":
      default:
        return [
          { label: "Home", href: "/student", icon: "home" },
          { label: "Browse Events", href: "/student/events", icon: "calendar_month" },
          { label: "Registrations", href: "/student/registrations", icon: "event_available" },
          { label: "Attendance", href: "/student/attendance", icon: "fact_check" },
          { label: "Updates", href: "/student/updates", icon: "notifications_active" },
        ];
    }
  };

  const navItems = getNavItems();

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
          router.refresh();
        },
      },
    });
  };

  return (
    <div className="bg-background text-foreground font-sans min-h-screen flex overflow-hidden">
      {/* Sidebar Nav (Desktop) */}
      <nav className="hidden md:flex flex-col h-full py-6 px-4 bg-surface-container-low border-r border-border w-64 fixed left-0 top-0 z-40">
        <div className="mb-8 px-2">
          <span className="font-heading text-lg font-bold text-foreground tracking-tighter uppercase">
            Matrix System
          </span>
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
            {user.role} Panel
          </p>
        </div>

        <div className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all duration-150 rounded-none border-r-2 ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "text-muted-foreground hover:bg-surface-container-high border-transparent"
                }`}
              >
                <span className="material-symbols-outlined mr-3 text-[18px]">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-auto pt-6 border-t border-border space-y-1">
          <button
            onClick={handleSignOut}
            className="w-full text-left flex items-center px-4 py-2 text-muted-foreground hover:bg-surface-container-high font-mono text-xs uppercase tracking-widest transition-all duration-150 rounded-none"
          >
            <span className="material-symbols-outlined mr-3 text-[18px]">logout</span>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64 h-screen overflow-hidden">
        {/* Top App Bar */}
        <header className="flex justify-between items-center px-6 w-full z-30 bg-background border-b border-border h-16 sticky top-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1 text-primary hover:bg-surface-container"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="font-heading text-xl font-bold uppercase tracking-tighter text-primary">
              Hi, {user.name.split(" ")[0]}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={user.role === "ADMIN" ? "/admin/notifications" : user.role === "VOLUNTEER" ? "/volunteer/notifications" : "/student/notifications"}
              className="p-2 text-muted-foreground hover:bg-surface-container transition-colors flex items-center"
            >
              <span className="material-symbols-outlined">notifications</span>
            </Link>
            
            <div className="w-8 h-8 ml-2 border border-border bg-surface-container-high overflow-hidden rounded-none">
              <Avatar className="w-full h-full rounded-none">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=c0573e,8a726c`}
                  className="w-full h-full object-cover grayscale opacity-80"
                />
                <AvatarFallback className="rounded-none">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-64 h-full bg-surface-container-low py-6 px-4 flex flex-col border-r border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-8 px-2 flex justify-between items-center">
                <div>
                  <span className="font-heading text-lg font-bold text-foreground tracking-tighter uppercase">
                    Matrix System
                  </span>
                  <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                    {user.role} Panel
                  </p>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-primary">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex-1 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all duration-150 rounded-none border-r-2 ${
                        isActive
                          ? "bg-primary text-on-primary border-primary"
                          : "text-muted-foreground hover:bg-surface-container-high border-transparent"
                      }`}
                    >
                      <span className="material-symbols-outlined mr-3 text-[18px]">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-auto pt-6 border-t border-border space-y-1">
                <button
                  onClick={handleSignOut}
                  className="w-full text-left flex items-center px-4 py-2 text-muted-foreground hover:bg-surface-container-high font-mono text-xs uppercase tracking-widest transition-all duration-150 rounded-none"
                >
                  <span className="material-symbols-outlined mr-3 text-[18px]">logout</span>
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Canvas */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 bg-background">
          {children}
        </div>

        {/* Bottom Navigation (Mobile) */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden flex justify-around items-center h-16 bg-background border-t border-border px-4 pb-safe">
          {navItems.slice(0, 3).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center px-3 py-1 transition-all duration-100 rounded-none ${
                  isActive
                    ? "text-primary scale-105 font-bold"
                    : "text-muted-foreground"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="font-mono text-[9px] uppercase tracking-widest">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center px-3 py-1 text-muted-foreground"
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
            <span className="font-mono text-[9px] uppercase tracking-widest">More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
