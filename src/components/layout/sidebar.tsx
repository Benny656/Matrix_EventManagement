"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardList,
  BarChart3,
  FileDown,
  UserCheck,
  QrCode,
  BookOpen,
  Bell,
  User,
  CalendarCheck,
  Award,
  LogOut,
} from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type UserRole = "ADMIN" | "VOLUNTEER" | "STUDENT";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const adminNavItems: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Events", href: "/admin/events", icon: Calendar },
  { title: "Registrations", href: "/admin/registrations", icon: ClipboardList },
  { title: "Attendance", href: "/admin/attendance", icon: UserCheck },
  { title: "Volunteers", href: "/admin/volunteers", icon: Users },
  { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { title: "Reports", href: "/admin/reports", icon: FileDown },
];

const volunteerNavItems: NavItem[] = [
  { title: "Dashboard", href: "/volunteer", icon: LayoutDashboard },
  { title: "My Events", href: "/volunteer/events", icon: Calendar },
  { title: "QR Scanner", href: "/volunteer/scanner", icon: QrCode },
  { title: "Attendance", href: "/volunteer/attendance", icon: UserCheck },
  { title: "Registrations", href: "/volunteer/registrations", icon: ClipboardList },
];

const studentNavItems: NavItem[] = [
  { title: "Dashboard", href: "/student", icon: LayoutDashboard },
  { title: "Browse Events", href: "/student/events", icon: Calendar },
  { title: "My Registrations", href: "/student/my-registrations", icon: BookOpen },
  { title: "My Attendance", href: "/student/my-attendance", icon: CalendarCheck },
  { title: "Certificates", href: "/student/certificates", icon: Award },
  { title: "Notifications", href: "/student/notifications", icon: Bell },
  { title: "Profile", href: "/student/profile", icon: User },
];

const navByRole: Record<UserRole, NavItem[]> = {
  ADMIN: adminNavItems,
  VOLUNTEER: volunteerNavItems,
  STUDENT: studentNavItems,
};

const roleLabel: Record<UserRole, string> = {
  ADMIN: "Admin",
  VOLUNTEER: "Volunteer",
  STUDENT: "Student",
};

interface SidebarProps {
  role: UserRole;
  userName: string;
  userEmail: string;
}

export function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = navByRole[role];

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    router.push("/login");
  };

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Brand */}
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <div>
          <p className="font-bold text-lg leading-none">Matrix</p>
          <p className="text-xs text-sidebar-foreground/60 mt-0.5">
            {roleLabel[role]} Portal
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* User + Sign Out */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3 px-1">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold shrink-0">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{userEmail}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
