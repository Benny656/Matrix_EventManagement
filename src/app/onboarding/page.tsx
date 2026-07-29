import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-session";
import OnboardingForm from "./onboarding-form";

export const metadata = {
  title: "Complete Your Profile | Matrix",
};

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.onboardingCompleted) {
    // If they already have a complete profile, redirect them back to their dashboard.
    if (user.role === "ADMIN") redirect("/admin");
    if (user.role === "VOLUNTEER") redirect("/volunteer");
    redirect("/student");
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative selection:bg-primary/20 selection:text-primary">
      <div
        className="w-full max-w-sm mx-auto flex flex-col items-center gap-6"
        style={{ maxWidth: "380px" }}
      >
        <div className="flex flex-col items-center text-center gap-1">
          <div className="h-11 w-11 flex items-center justify-center mb-1">
            <img src="/logo.png" alt="Matrix Logo" className="h-full w-full object-contain dark:invert" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground uppercase">
            Matrix
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Complete Your Profile
          </p>
        </div>

        <div className="w-full bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="h-1 w-full bg-primary" />
          <div className="p-6 flex flex-col gap-5 text-center">
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">
                Welcome to Matrix
              </h2>
              <p className="font-sans text-xs text-muted-foreground mt-1 leading-relaxed">
                Before accessing the dashboard, please complete your academic profile.
              </p>
            </div>
            
            <OnboardingForm initialName={user.name} initialRollNumber={user.rollNumber || ""} />
          </div>
        </div>
      </div>
    </div>
  );
}
