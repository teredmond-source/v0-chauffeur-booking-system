import { Calculator } from "lucide-react";

export function NTAInfoPanel() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Calculator className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">NTA 2026 Fare Reference</h3>
      </div>
      <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Initial Charge (incl. 500m)</span>
          <span className="font-semibold text-foreground">{"\u20AC"}4.20</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Pre-Booking Fee</span>
          <span className="font-semibold text-foreground">{"\u20AC"}2.00</span>
        </div>
        <div className="flex items-center justify-between">
          <span>{"\u2264"} 15km (Tariff A)</span>
          <span className="font-semibold text-foreground">{"\u20AC"}1.32/km</span>
        </div>
        <div className="flex items-center justify-between">
          <span>{">"} 15km (Tariff B)</span>
          <span className="font-semibold text-foreground">{"\u20AC"}1.72/km</span>
        </div>
        <div className="mt-2 border-t border-border pt-2">
          <p className="italic">All fares calculated to NTA maximum meter rates.</p>
        </div>
      </div>
    </div>
  );
}
