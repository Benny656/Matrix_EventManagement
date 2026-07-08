"use client";

import { useState } from "react";
import { toast } from "sonner";
import { markNotificationRead, markAllNotificationsRead } from "@/actions/notification.actions";
import { Button } from "@/components/ui/button";
import { cn, formatRelative } from "@/lib/utils";
import { Bell, CheckCheck } from "lucide-react";
import type { Notification } from "@prisma/client";

interface NotificationsListProps {
  notifications: Notification[];
}

export function NotificationsList({ notifications: initial }: NotificationsListProps) {
  const [notifications, setNotifications] = useState(initial);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </div>
      )}
      {notifications.map((n) => (
        <div
          key={n.id}
          className={cn(
            "border rounded-lg p-4 cursor-pointer transition-colors",
            n.read ? "bg-background" : "bg-primary/5 border-primary/20"
          )}
          onClick={() => !n.read && handleMarkRead(n.id)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Bell className={cn("h-4 w-4 mt-0.5 shrink-0", n.read ? "text-muted-foreground" : "text-primary")} />
              <div>
                <p className={cn("text-sm font-medium", !n.read && "text-primary")}>{n.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatRelative(n.createdAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
