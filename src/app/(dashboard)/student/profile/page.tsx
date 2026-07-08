import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Profile" };

export default async function StudentProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const user = session.user as {
    id: string;
    name: string;
    email: string;
    role: string;
    registerNumber?: string;
    department?: string;
    phone?: string;
  };

  return (
    <div className="max-w-lg">
      <PageHeader title="Profile" description="Your account information" />
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <CardTitle>{user.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge variant="secondary" className="mt-1">{user.role}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Register Number</span>
              <span className="font-medium">{user.registerNumber ?? "—"}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Department</span>
              <span className="font-medium">{user.department ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{user.phone ?? "—"}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Contact an admin to update your profile information.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
