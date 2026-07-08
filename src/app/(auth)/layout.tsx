export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Matrix</h1>
          <p className="text-sm text-muted-foreground mt-1">Event Management System</p>
        </div>
        {children}
      </div>
    </div>
  );
}
