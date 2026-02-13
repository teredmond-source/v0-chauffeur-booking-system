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
    <div className={`flex items-center gap-4 rounded-xl border p-4 shadow-sm ${isAccent ? "border-accent/30 bg-accent/5" : "border-border bg-card"}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isAccent ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
