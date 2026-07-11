import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    const role = session.user.role;
    if (role === "ADMIN") {
      redirect("/admin");
    } else if (role === "VOLUNTEER") {
      redirect("/volunteer");
    } else {
      redirect("/student");
    }
  }

  return (
    <div className="bg-background text-foreground font-sans min-h-screen flex flex-col relative selection:bg-primary-container/20 selection:text-primary">
      {/* Background Glow Blobs */}
      <div className="fixed rounded-full filter blur-[80px] z-[-1] opacity-[0.08] pointer-events-none w-[500px] h-[500px] bg-primary top-[-100px] right-[-100px] animate-[pulse_10s_ease-in-out_infinite]" />
      <div className="fixed rounded-full filter blur-[80px] z-[-1] opacity-[0.08] pointer-events-none w-[400px] h-[400px] bg-outline bottom-[10%] left-[-50px] animate-[pulse_12s_ease-in-out_infinite_reverse]" />

      {/* Header */}
      <header class="w-full top-0 sticky bg-background/80 backdrop-blur-sm border-b border-border z-50">
        <div className="flex justify-between items-center px-6 py-3 w-full max-w-7xl mx-auto min-h-[64px]">
          <div className="flex flex-col">
            <span className="font-heading text-2xl font-extrabold tracking-tighter text-foreground">MATRIX</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground -mt-1">Division of AIML, KITS</span>
          </div>
          <Link href="/login" className="cursor-pointer active:opacity-80 p-2 hover:bg-surface-container rounded-sm transition-colors text-primary flex items-center">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>grid_view</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col flex-1">
        {/* Hero Section */}
        <section className="px-6 pt-16 pb-16 flex flex-col md:flex-row items-center gap-12 max-w-7xl mx-auto w-full">
          <div className="flex flex-col items-start gap-6 flex-1">
            <div className="w-24 h-[1px] bg-border opacity-30 mb-2"></div>
            <div className="max-w-xl">
              <h1 className="font-heading text-4xl md:text-[56px] md:leading-[1.1] text-foreground tracking-tight mb-4 font-semibold">
                Where <span className="text-primary italic">AIML</span> students build, learn, and ship together.
              </h1>
              <p className="font-sans text-base md:text-lg text-muted-foreground leading-relaxed border-l-2 border-primary pl-4 max-w-md">
                Workshops, bootcamps, and hackathons specifically engineered for the department of artificial intelligence.
              </p>
            </div>
            
            <div className="w-full mt-6">
              <Link href="/login" className="inline-flex max-w-md w-full md:w-auto bg-primary text-primary-foreground font-mono text-sm py-4 px-8 items-center justify-center gap-2 cursor-pointer hover:bg-primary-container transition-all active:scale-[0.98]">
                <span>ENTER EVENT PORTAL</span>
                <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
              </Link>
              <div className="mt-2 flex justify-between font-mono text-[11px] text-muted-foreground max-w-md px-1">
                <span>V2.0.24</span>
                <span>SYSTEM_READY</span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full">
            <div className="w-full aspect-[4/3] md:aspect-square border border-border bg-surface-container relative overflow-hidden">
              <div className="w-full h-full bg-cover bg-center grayscale-[0.5] mix-blend-multiply opacity-60 bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80')]" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border border-border/20 p-8 flex flex-col items-center bg-background/5 backdrop-blur-[2px]">
                  <span className="font-mono text-primary text-xs tracking-[0.2em] uppercase animate-pulse">Status: Operational</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-6 py-16 max-w-7xl mx-auto w-full flex flex-col gap-4">
          <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest mb-1">Core Functions</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Workshops Card */}
            <div className="border border-border p-6 flex flex-col items-start gap-4 bg-surface-container-low/60 backdrop-blur-sm hover:bg-surface-container transition-colors group h-full">
              <div className="bg-background p-2 border border-border text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined">model_training</span>
              </div>
              <div>
                <h3 className="font-mono text-base text-foreground mb-1 uppercase font-semibold">Workshops</h3>
                <p className="font-sans text-sm text-muted-foreground">Hands-on laboratory sessions focusing on transformer architectures and model deployment.</p>
              </div>
            </div>
            
            {/* Hackathons Card */}
            <div className="border border-border p-6 flex flex-col items-start gap-4 bg-surface-container-low/60 backdrop-blur-sm hover:bg-surface-container transition-colors group h-full">
              <div className="bg-background p-2 border border-border text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined">terminal</span>
              </div>
              <div>
                <h3 className="font-mono text-base text-foreground mb-1 uppercase font-semibold">Hackathons</h3>
                <p className="font-sans text-sm text-muted-foreground">High-intensity sprint cycles to solve department-specific challenges and build real-world tools.</p>
              </div>
            </div>

            {/* Department Events Card */}
            <div className="border border-border p-6 flex flex-col items-start gap-4 bg-surface-container-low/60 backdrop-blur-sm hover:bg-surface-container transition-colors group h-full">
              <div className="bg-background p-2 border border-border text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined">diversity_3</span>
              </div>
              <div>
                <h3 className="font-mono text-base text-foreground mb-1 uppercase font-semibold">Department Events</h3>
                <p className="font-sans text-sm text-muted-foreground">Collaborative symposiums and networking for Karunya's AI and Machine Learning cohort.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Details Section */}
        <section className="px-6 py-12 border-t border-border">
          <div className="max-w-7xl mx-auto w-full">
            <div className="bg-foreground p-6 text-background md:max-w-md border border-border">
              <div className="flex justify-between items-center mb-4">
                <span className="font-mono tracking-widest text-[11px] text-muted">DATA_STREAM</span>
                <div className="h-[1px] w-12 bg-primary"></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="font-mono text-[11px] text-muted-foreground">ACTIVE_USERS</span>
                  <span className="font-heading text-lg font-bold text-background">420+</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[11px] text-muted-foreground">PROJECTS_SHIPPED</span>
                  <span className="font-heading text-lg font-bold text-background">12+</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full mt-auto bg-surface-container-lowest/85 backdrop-blur-sm border-t border-border">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 py-6 gap-4 w-full max-w-7xl mx-auto">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">MATRIX AIML</span>
            <p className="font-mono text-[11px] text-muted-foreground">© 2024 Matrix AIML. All rights reserved.</p>
          </div>
          <div className="flex gap-6">
            <a className="font-mono text-xs text-muted-foreground hover:text-primary transition-all duration-200 underline underline-offset-4 decoration-border" href="#">Privacy</a>
            <a className="font-mono text-xs text-muted-foreground hover:text-primary transition-all duration-200 underline underline-offset-4 decoration-border" href="#">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
