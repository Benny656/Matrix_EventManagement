import React from "react";
import { getActiveEventOptionsAction } from "@/actions/update";
import PostUpdateForm from "@/components/events/post-update-form";

export const dynamic = "force-dynamic";

export default async function AdminNewUpdatePage() {
  const events = await getActiveEventOptionsAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground tracking-tighter mb-1">
          Publish Update
        </h1>
        <p className="font-sans text-sm text-muted-foreground">
          Post scoped announcements or broad department directives.
        </p>
      </div>

      <PostUpdateForm events={events} backUrl="/admin/updates" />
    </div>
  );
}
