export function BookingForm() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">New Booking Request</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Enter customer and route details. Fares are calculated automatically using Google Maps distance and NTA 2026 rates.
        </p>
      </div>
      <p className="text-xs text-muted-foreground">Full booking form coming in the next step.</p>
    </div>
  );
}
