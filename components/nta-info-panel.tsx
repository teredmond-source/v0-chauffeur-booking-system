import { Info } from "lucide-react";

export function NTAInfoPanel() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Info className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">NTA 2026 Fare Structure</h3>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Initial Charge</span>
          <span className="font-mono font-medium text-foreground">{"\u20AC"}4.40</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Pre-Booking Fee</span>
          <span className="font-mono font-medium text-foreground">{"\u20AC"}3.00</span>
        </div>
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{"Tariff A (\u2264 15km)"}</span>
            <span className="font-mono font-medium text-foreground">{"\u20AC"}1.32/km</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{"Tariff B (> 15km)"}</span>
          <span className="font-mono font-medium text-foreground">{"\u20AC"}1.72/km</span>
        </div>
        <div className="mt-3 rounded-lg border border-accent/20 bg-accent/5 p-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Standard daytime rates. The initial charge includes the first 500m. All fares are NTA maximum rates for pre-booked journeys.
          </p>
        </div>
      </div>
    </div>
  );
}
