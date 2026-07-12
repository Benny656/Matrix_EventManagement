"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/actions/notification";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  linkUrl: string | null;
  createdAt: Date;
}

interface NotificationsListProps {
  initialNotifications: Notification[];
}

export default function NotificationsList({ initialNotifications }: NotificationsListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      await markNotificationReadAction(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    });
  };

  const iconForType = (type: string) => {
    switch (type) {
      case "NEW_EVENT": return "event";
      case "UPDATE_POSTED": return "campaign";
      case "REGISTRATION_CONFIRMED": return "check_circle";
      case "WAITLIST_PROMOTED": return "arrow_upward";
      default: return "notifications";
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header bar */}
      <div className="flex justify-between items-center border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-muted-foreground uppercase">
            {unreadCount} unread
          </span>
          {unreadCount > 0 && (
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="font-mono text-[10px] uppercase tracking-wider h-8 px-3 py-0 hover:bg-surface-container border-border rounded-none shadow-none"
          >
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="border border-border p-12 text-center text-muted-foreground font-mono text-xs uppercase bg-card">
          No notifications in your inbox.
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const dateStr = new Date(notif.createdAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });

            return (
              <div
                key={notif.id}
                onClick={() => !notif.read && handleMarkRead(notif.id)}
                className={`border flex items-start gap-4 p-4 transition-all cursor-pointer group ${
                  notif.read
                    ? "border-border bg-card opacity-60"
                    : "border-primary/30 bg-primary/5 hover:bg-card hover:border-border"
                }`}
              >
                {/* Icon */}
                <span
                  className={`material-symbols-outlined text-xl shrink-0 mt-0.5 ${
                    notif.read ? "text-muted-foreground" : "text-primary"
                  }`}
                >
                  {iconForType(notif.type)}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`font-sans text-sm leading-snug ${notif.read ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">{dateStr}</span>
                    {notif.linkUrl && (
                      <Link
                        href={notif.linkUrl}
                        onClick={(e) => e.stopPropagation()}
                        className="font-mono text-[10px] text-primary uppercase hover:underline"
                      >
                        View →
                      </Link>
                    )}
                  </div>
                </div>

                {/* Unread indicator dot */}
                {!notif.read && (
                  <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5"></span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
