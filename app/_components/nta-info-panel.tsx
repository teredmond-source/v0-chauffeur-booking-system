export function NTAInfoPanel() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground">NTA 2026 Fare Reference</h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
        <span>Initial charge (500m):</span><span className="font-medium text-foreground">EUR 4.20</span>
        <span>Pre-booking fee:</span><span className="font-medium text-foreground">EUR 2.00</span>
        <span>{"Tariff A (up to 15km):"}</span><span className="font-medium text-foreground">EUR 1.18/km</span>
        <span>{"Tariff B (over 15km):"}</span><span className="font-medium text-foreground">EUR 1.54/km</span>
      </div>
    </div>
  );
}
