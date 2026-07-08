import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const role = (session.user as { role: string }).role ?? "STUDENT";

  switch (role) {
    case "ADMIN":
      redirect("/admin");
    case "VOLUNTEER":
      redirect("/volunteer");
    default:
      redirect("/student");
  }
}
