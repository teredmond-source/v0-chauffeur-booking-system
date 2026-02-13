export function AppHeader() {
  return (
    <header className="relative overflow-hidden rounded-xl border border-primary/30 bg-card shadow-lg shadow-primary/5">
      {/* Gold accent bar at top */}
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary to-primary/60" />
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-4">
          {/* RCD Logo */}
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-primary/40 bg-primary/15">
            <span className="text-xl font-bold text-primary">RCD</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Redmond Chauffeur Drive</h1>
            <p className="text-xs text-muted-foreground">Admin Dashboard &mdash; Booking &amp; Dispatch</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.4)]" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}
