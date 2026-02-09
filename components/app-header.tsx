"use client";

export function AppHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">Redmond Chauffeur Drive</h1>
          <p className="text-sm text-muted-foreground">Booking &amp; Dispatch System</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          System Online
        </span>
      </div>
    </header>
  );
}
