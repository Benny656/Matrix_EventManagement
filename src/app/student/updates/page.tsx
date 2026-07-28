import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-session";
import { adminDb } from "@/lib/firebase-admin";
import { User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentUpdatesPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "STUDENT") {
    redirect("/login");
  }

  const regsSnapshot = await adminDb
    .collection("registrations")
    .where("studentId", "==", currentUser.id)
    .get();

  const registeredEventIds = regsSnapshot.docs
    .map((d) => d.data())
    .filter((r) => r.status !== "CANCELLED")
    .map((r) => r.eventId);

  const updatesSnapshot = await adminDb.collection("updates").get();
  const allUpdates = updatesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

  const usersSnapshot = await adminDb.collection("users").get();
  const userMap = new Map<string, any>();
  usersSnapshot.docs.forEach((d) => userMap.set(d.id, d.data()));

  const eventsSnapshot = await adminDb.collection("events").get();
  const eventMap = new Map<string, any>();
  eventsSnapshot.docs.forEach((d) => eventMap.set(d.id, d.data()));

  const filteredUpdates = allUpdates
    .filter((u) => u.scope === "DEPARTMENT" || (u.eventId && registeredEventIds.includes(u.eventId)))
    .map((u) => {
      const author = userMap.get(u.authorId) || { name: "Staff", role: "VOLUNTEER" };
      const event = u.eventId ? eventMap.get(u.eventId) : null;
      return {
        ...u,
        createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
        author: {
          name: author.name,
          role: author.role,
        },
        event: event ? { title: event.title } : null,
      };
    });

  filteredUpdates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground tracking-tighter mb-1">
          Announcements Feed
        </h1>
        <p className="font-sans text-sm text-muted-foreground">
          Announcements and updates for your registered active deployments.
        </p>
      </div>

      {filteredUpdates.length === 0 ? (
        <div className="border border-border p-12 text-center text-muted-foreground font-mono text-xs uppercase bg-card">
          No announcements published yet.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredUpdates.map((update) => {
            const dateStr = update.createdAt.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });

            return (
              <article key={update.id} className="border border-border bg-card p-0 flex hover:border-primary transition-all duration-200">
                <div className={`w-1 shrink-0 ${update.scope === "DEPARTMENT" ? "bg-primary" : "bg-tertiary"}`}></div>
                <div className="p-5 flex-grow space-y-4">
                  <div className="flex justify-between items-start gap-4 flex-wrap border-b border-border pb-2">
                    <div>
                      <span className={`px-2 py-0.5 font-mono text-[9px] uppercase font-semibold border mr-2 ${
                        update.scope === "DEPARTMENT"
                          ? "bg-primary/5 text-primary border-primary/20"
                          : "bg-tertiary/5 text-tertiary border-tertiary/20"
                      }`}>
                        {update.scope}
                      </span>
                      {update.scope === "EVENT" && update.event && (
                        <span className="font-sans text-xs text-foreground font-bold uppercase tracking-wide">
                          {update.event.title}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">{dateStr}</span>
                  </div>

                  <p className="font-sans text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {update.content}
                  </p>

                  <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground pt-1 border-t border-dashed border-border/60">
                    <User size={11} />
                    <span>AUTHOR: {update.author.name} ({update.author.role})</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
