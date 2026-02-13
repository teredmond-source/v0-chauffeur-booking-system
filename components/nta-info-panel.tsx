export function NTAInfoPanel() {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4 text-xs text-muted-foreground">
      <p className="mb-1 font-semibold text-foreground">NTA 2026 Fare Reference</p>
      <ul className="list-inside list-disc space-y-0.5">
        <li>Initial charge (500m): EUR 4.20</li>
        <li>Pre-booking fee: EUR 2.00</li>
        <li>{"Tariff A (up to 15km):"} EUR 1.18/km</li>
        <li>{"Tariff B (over 15km):"} EUR 1.54/km</li>
      </ul>
    </div>
  );
}
