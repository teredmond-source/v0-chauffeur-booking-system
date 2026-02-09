"use client";

import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  variant?: "default" | "accent";
}

export function StatCard({ label, value, icon: Icon, variant = "default" }: StatCardProps) {
  const isAccent = variant === "accent";
  return (
    <div className={`rounded-xl border p-4 ${isAccent ? "border-accent/30 bg-accent/5" : "border-border bg-card"}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isAccent ? "bg-accent/20" : "bg-accent/10"}`}>
          <Icon className={`h-5 w-5 ${isAccent ? "text-accent" : "text-accent"}`} />
        </div>
        <div>
          <p className={`text-2xl font-bold ${isAccent ? "text-accent" : "text-foreground"}`}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
