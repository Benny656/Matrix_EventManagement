"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "@/lib/auth-client";
import { getUnreadNotificationCountAction } from "@/actions/notification";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart2,
  CalendarDays,
  Users,
  BellRing,
  FileText,
  Home,
  CalendarCheck,
  ScanLine,
  PenLine,
  LogOut,
  Menu,
  X,
  Bell,
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
    role: "ADMIN" | "VOLUNTEER" | "STUDENT";
  };
  children: React.ReactNode;
}

export default function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  React.useEffect(() => {
    const fetchUnread = async () => {
      try {
        const count = await getUnreadNotificationCountAction();
        setUnreadCount(count);
      } catch (e) {
        console.error("Failed to fetch unread count", e);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [pathname]);

  const getNavItems = (): NavItem[] => {
    switch (user.role) {
      case "ADMIN":
        return [
          { label: "Overview", href: "/admin", icon: BarChart2 },
          { label: "All Events", href: "/admin/events", icon: CalendarDays },
          { label: "Users", href: "/admin/users", icon: Users },
          { label: "Updates", href: "/admin/updates", icon: BellRing },
          { label: "Reports", href: "/admin/reports", icon: FileText },
        ];
      case "VOLUNTEER":
        return [
          { label: "Overview", href: "/volunteer", icon: Home },
          { label: "Events", href: "/volunteer/events", icon: CalendarCheck },
          { label: "QR Scanner", href: "/volunteer/scan", icon: ScanLine },
          { label: "Manual Entry", href: "/volunteer/manual", icon: PenLine },
          { label: "Updates", href: "/volunteer/updates", icon: BellRing },
        ];
      case "STUDENT":
      default:
        return [
          { label: "Home", href: "/student", icon: Home },
          { label: "Events", href: "/student/events", icon: CalendarDays },
          { label: "Registrations", href: "/student/registrations", icon: CalendarCheck },
          { label: "Updates", href: "/student/updates", icon: BellRing },
        ];
    }
  };

  const navItems = getNavItems();

  const roleLabel = user.role === "ADMIN" ? "Admin" : user.role === "VOLUNTEER" ? "Volunteer" : "Student";

  const notificationsHref =
    user.role === "ADMIN"
      ? "/admin/notifications"
      : user.role === "VOLUNTEER"
      ? "/volunteer/notifications"
      : "/student/notifications";

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
    <div className="theme-raycast bg-background text-foreground font-sans min-h-screen flex overflow-hidden">
      {/* Sidebar (Desktop) */}
      <nav className="hidden md:flex flex-col h-full py-5 px-3 bg-surface-container-low border-r border-border w-60 fixed left-0 top-0 z-40">
        {/* Brand */}
        <div className="mb-7 px-3 pb-5 border-b border-border flex items-center gap-3">
          <img src="/logo.png" alt="Matrix Logo" className="h-7 w-7 object-contain" />
          <div>
            <span className="font-heading text-base font-bold text-foreground tracking-tighter uppercase">
              Matrix
            </span>
            <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">
              {roleLabel}
            </p>
          </div>
        </div>

        {/* Nav items */}
        <div className="flex-1 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin" && item.href !== "/volunteer" && item.href !== "/student" && pathname.startsWith(item.href + "/"));
            const isRoot = ["/admin", "/volunteer", "/student"].includes(item.href);
            const isActiveRoot = isRoot && pathname === item.href;
            const active = isActiveRoot || (!isRoot && isActive);
            const isUpdatesTab = item.label === "Updates";

            return (
              <motion.div key={item.href} whileHover={{ x: 2 }} transition={{ duration: 0.12 }}>
                <Link
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors rounded-sm ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-surface-container-high hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={14} />
                    {item.label}
                  </div>
                  {isUpdatesTab && unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded-sm min-w-[18px] text-center"
                      style={active ? { backgroundColor: "rgba(255,255,255,0.25)" } : {}}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </motion.span>
                  )}
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
        <header className="flex justify-between items-center px-5 w-full z-30 glass-panel h-14 sticky top-0">
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

          <div className="flex items-center gap-1">
            <Link
              href={notificationsHref}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-surface-container transition-colors flex items-center relative rounded-sm"
              aria-label="Notifications"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full"
                />
              )}
            </Link>

            <div className="w-7 h-7 ml-1 border border-border bg-surface-container-high overflow-hidden rounded-sm">
              <Avatar className="w-full h-full rounded-sm">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=c0573e,8a726c`}
                  className="w-full h-full object-cover"
                />
                <AvatarFallback className="rounded-sm text-[10px]">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
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
                className="fixed left-0 top-0 w-60 h-full bg-surface-container-low py-5 px-3 flex flex-col border-r border-border z-50 md:hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-5 px-3 pb-5 border-b border-border flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Matrix Logo" className="h-7 w-7 object-contain" />
                    <div>
                      <span className="font-heading text-base font-bold text-foreground tracking-tighter uppercase">Matrix</span>
                      <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">{roleLabel}</p>
                    </div>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
                    <X size={16} />
                  </button>
                </div>

                <div className="flex-1 space-y-0.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isRoot = ["/admin", "/volunteer", "/student"].includes(item.href);
                    const active = isRoot ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
                    const isUpdatesTab = item.label === "Updates";

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors rounded-sm ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-surface-container-high hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={14} />
                          {item.label}
                        </div>
                        {isUpdatesTab && unreadCount > 0 && (
                          <span className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded-sm">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-auto pt-4 border-t border-border">
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-muted-foreground hover:bg-surface-container-high hover:text-foreground font-mono text-[11px] uppercase tracking-widest transition-colors rounded-sm"
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
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 bg-background">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Nav (Mobile) */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden flex justify-around items-center h-14 glass-panel px-4">
          {navItems.slice(0, 3).map((item) => {
            const Icon = item.icon;
            const isRoot = ["/admin", "/volunteer", "/student"].includes(item.href);
            const active = isRoot ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center px-3 py-1 transition-colors gap-1 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon size={18} />
                <span className="font-mono text-[8px] uppercase tracking-widest">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center px-3 py-1 text-muted-foreground gap-1"
          >
            <Menu size={18} />
            <span className="font-mono text-[8px] uppercase tracking-widest">More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
