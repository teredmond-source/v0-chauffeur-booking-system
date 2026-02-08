import { AppHeader } from "@/components/app-header";
import { BookingForm } from "@/components/booking-form";
import { StatCard } from "@/components/stat-card";
import { NTAInfoPanel } from "@/components/nta-info-panel";
import {
  CalendarCheck,
  Car,
  Users,
  TrendingUp,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
            Booking Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create bookings, calculate fares, and manage dispatch.
          </p>
        </div>

        {/* Stats row */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Today's Bookings"
            value="--"
            subtext="Connect Sheets to sync"
            icon={CalendarCheck}
          />
          <StatCard
            label="Active Drivers"
            value="--"
            subtext="Connect Sheets to sync"
            icon={Users}
          />
          <StatCard
            label="Fleet Vehicles"
            value="--"
            subtext="Connect Sheets to sync"
            icon={Car}
          />
          <StatCard
            label="Avg Fare"
            value="--"
            subtext="NTA 2026 rates"
            icon={TrendingUp}
            variant="accent"
          />
        </div>

        {/* Main content: Booking form + sidebar */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  New Booking Request
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Enter customer and route details. Fares are calculated
                  automatically using Google Maps distance and NTA 2026 rates.
                </p>
              </div>
              <BookingForm />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <NTAInfoPanel />

            {/* Quick reference */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Eircode Tips
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  Enter the full 7-character Eircode (e.g. D02 AF30)
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  Eircodes are automatically prefixed with "Ireland" for accurate geocoding
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  Use "Get Fare Estimate" to preview the route before submitting
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  All bookings are written directly to Google Sheets
                </li>
              </ul>
            </div>

            {/* System status */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                System Status
              </h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Google Maps API
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs font-medium text-foreground">
                      Connected
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Google Sheets
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs font-medium text-foreground">
                      Connected
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    NTA Pricing
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs font-medium text-foreground">
                      2026 Rates
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-6">
        <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
          <p className="text-xs text-muted-foreground">
            Redmond Chauffeur Drive - Booking & Dispatch System
          </p>
        </div>
      </footer>
    </div>
  );
}
