import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-session";
import DashboardLayout from "@/components/layout/dashboard-layout";

export default async function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "FACULTY" && user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <DashboardLayout
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
      }}
    >
      {children}
    </DashboardLayout>
  );
}
