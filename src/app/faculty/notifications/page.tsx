import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-session";
import { getNotificationsAction } from "@/actions/notification";
import NotificationsList from "@/components/notifications-list";

export const dynamic = "force-dynamic";

export default async function FacultyNotificationsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "FACULTY") {
    redirect("/login");
  }

  const notifications = await getNotificationsAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground tracking-tighter mb-1">
          Notifications
        </h1>
        <p className="font-sans text-sm text-muted-foreground">
          Inbox alerts for registrations, waitlist updates, and announcements.
        </p>
      </div>

      <NotificationsList initialNotifications={notifications as any} />
    </div>
  );
}
