import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getNotificationsAction } from "@/actions/notification";
import NotificationsList from "@/components/notifications-list";

export const dynamic = "force-dynamic";

export default async function VolunteerNotificationsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "VOLUNTEER" && session.user.role !== "ADMIN")) {
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
          System alerts and operational updates.
        </p>
      </div>

      <NotificationsList initialNotifications={notifications as any} />
    </div>
  );
}
