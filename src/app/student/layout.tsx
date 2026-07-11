import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DashboardLayout from "@/components/dashboard-layout";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "STUDENT" && session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <DashboardLayout
      user={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role as "ADMIN" | "VOLUNTEER" | "STUDENT",
      }}
    >
      {children}
    </DashboardLayout>
  );
}
