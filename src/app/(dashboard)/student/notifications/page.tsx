import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getNotifications } from "@/actions/notification.actions";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { Bell } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const notifications = await getNotifications(session.user.id);

  return (
    <div>
      <PageHeader title="Notifications" description={`${notifications.filter((n) => !n.read).length} unread`} />
      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You'll receive notifications about your registrations and events here" />
      ) : (
        <NotificationsList notifications={notifications} />
      )}
    </div>
  );
}
