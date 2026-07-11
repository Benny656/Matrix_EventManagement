import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminUpdatesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // Fetch all updates
  const updates = await prisma.update.findMany({
    include: {
      author: {
        select: { name: true, role: true },
      },
      event: {
        select: { title: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground tracking-tighter mb-1">
            System Announcements
          </h1>
          <p className="font-sans text-sm text-muted-foreground">
            Manage and view announcements posted to the platform.
          </p>
        </div>

        <Link
          href="/admin/updates/new"
          className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest py-3 px-6 hover:bg-primary-container active:scale-95 transition-all rounded-none flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          New Announcement
        </Link>
      </div>

      {updates.length === 0 ? (
        <div className="border border-border p-12 text-center text-muted-foreground font-mono text-xs uppercase bg-card">
          No announcements published yet.
        </div>
      ) : (
        <div className="space-y-6">
          {updates.map((update) => {
            const dateStr = new Date(update.createdAt).toLocaleString("en-US", {
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
                    <span className="material-symbols-outlined text-[12px]">person</span>
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
