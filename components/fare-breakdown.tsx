import type { FareBreakdown } from "@/lib/pricing";
import { MapPin, Clock, Route } from "lucide-react";

interface FareBreakdownDisplayProps {
  fare: FareBreakdown;
  originAddress: string;
  destinationAddress: string;
}

export function FareBreakdownDisplay({
  fare,
  originAddress,
  destinationAddress,
}: FareBreakdownDisplayProps) {
  const hours = Math.floor(fare.durationMinutes / 60);
  const mins = fare.durationMinutes % 60;
  const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;

  return (
    <div className="space-y-5">
      {/* Route summary */}
      <div className="rounded-lg border border-border bg-secondary/50 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex flex-col items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-full border-2 border-accent bg-accent" />
            <div className="h-8 w-px border-l-2 border-dashed border-muted-foreground/30" />
            <div className="h-2.5 w-2.5 rounded-full border-2 border-primary bg-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Pickup
              </p>
              <p className="text-sm font-medium text-foreground">
                {originAddress}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Destination
              </p>
              <p className="text-sm font-medium text-foreground">
                {destinationAddress}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
          <div className="flex items-center gap-1.5">
            <Route className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              {fare.distanceKm} km
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              {durationText}
            </span>
          </div>
        </div>
      </div>

      {/* Fare breakdown */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          NTA 2026 Fare Breakdown
        </h4>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Initial Charge (incl. 500m)
            </span>
            <span className="font-medium text-foreground">
              {"\u20AC"}{fare.initialCharge.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pre-Booking Fee</span>
            <span className="font-medium text-foreground">
              {"\u20AC"}{fare.preBookingFee.toFixed(2)}
            </span>
          </div>
          {fare.tariffA > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {"Tariff A (\u20AC1.32/km \u2264 15km)"}
              </span>
              <span className="font-medium text-foreground">
                {"\u20AC"}{fare.tariffA.toFixed(2)}
              </span>
            </div>
          )}
          {fare.tariffB > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {"Tariff B (\u20AC1.72/km > 15km)"}
              </span>
              <span className="font-medium text-foreground">
                {"\u20AC"}{fare.tariffB.toFixed(2)}
              </span>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-semibold text-foreground">
            NTA Maximum Fare
          </span>
          <span className="text-xl font-bold text-accent">
            {"\u20AC"}{fare.totalFare.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
