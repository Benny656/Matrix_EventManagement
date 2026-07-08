import { prisma } from "@/lib/prisma";
import { EventForm } from "@/components/events/event-form";
import { PageHeader } from "@/components/layout/page-header";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create Event" };

export default async function NewEventPage() {
  const coordinators = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "VOLUNTEER"] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Create Event"
        description="Fill in the details to create a new event"
      />
      <div className="max-w-3xl">
        <EventForm coordinators={coordinators} />
      </div>
    </div>
  );
}
