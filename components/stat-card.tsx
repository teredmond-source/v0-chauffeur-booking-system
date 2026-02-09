import React from "react";

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  variant = "default",
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "accent";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={`text-2xl font-bold tracking-tight ${variant === "accent" ? "text-accent" : "text-foreground"}`}>{value}</p>
          {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${variant === "accent" ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
