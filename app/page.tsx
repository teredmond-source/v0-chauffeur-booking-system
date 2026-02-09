"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Car,
  Users,
  Calendar,
  Clock,
  FileText,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Calculator,
  Menu,
  X,
  CalendarCheck,
  TrendingUp,
  Info,
  Route,
  RefreshCw,
  Shield,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface FareBreakdown {
  initialCharge: number;
  preBookingFee: number;
  tariffA: number;
  tariffB: number;
  totalFare: number;
  distanceKm: number;
  durationMinutes: number;
}

interface QuoteResult {
  distance: {
    km: number;
    minutes: number;
    originAddress: string;
    destinationAddress: string;
  };
  fare: FareBreakdown;
}

interface BookingResult extends QuoteResult {
  bookingId: string;
}

interface DriverRecord {
  [key: string]: string;
}

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */
function AppHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-primary text-primary-foreground">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <Car className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg font-bold leading-tight tracking-tight">
              Redmond
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/70">
              Chauffeur Drive
            </span>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {["Bookings", "Drivers", "Fleet"].map((item, i) => (
            <Link
              key={item}
              href="/"
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground ${i === 0 ? "text-primary-foreground/90" : "text-primary-foreground/60"}`}
            >
              {item}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-md text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {mobileOpen && (
        <nav className="border-t border-primary-foreground/10 px-4 pb-4 pt-2 md:hidden">
          {["Bookings", "Drivers", "Fleet"].map((item) => (
            <Link
              key={item}
              href="/"
              className="block rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10"
              onClick={() => setMobileOpen(false)}
            >
              {item}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */
function StatCard({
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
          <p className={`text-2xl font-bold tracking-tight ${variant === "accent" ? "text-accent" : "text-foreground"}`}>
            {value}
          </p>
          {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${variant === "accent" ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  NTA Info Panel                                                     */
/* ------------------------------------------------------------------ */
function NTAInfoPanel() {
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

/* ------------------------------------------------------------------ */
/*  Fare Breakdown Display                                             */
/* ------------------------------------------------------------------ */
function FareBreakdownDisplay({
  fare,
  originAddress,
  destinationAddress,
}: {
  fare: FareBreakdown;
  originAddress: string;
  destinationAddress: string;
}) {
  const hours = Math.floor(fare.durationMinutes / 60);
  const mins = fare.durationMinutes % 60;
  const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-secondary/50 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex flex-col items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-full border-2 border-accent bg-accent" />
            <div className="h-8 w-px border-l-2 border-dashed border-muted-foreground/30" />
            <div className="h-2.5 w-2.5 rounded-full border-2 border-primary bg-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pickup</p>
              <p className="text-sm font-medium text-foreground">{originAddress}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Destination</p>
              <p className="text-sm font-medium text-foreground">{destinationAddress}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
          <div className="flex items-center gap-1.5">
            <Route className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">{fare.distanceKm} km</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">{durationText}</span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">NTA 2026 Fare Breakdown</h4>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Initial Charge (incl. 500m)</span>
            <span className="font-medium text-foreground">{"\u20AC"}{fare.initialCharge.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pre-Booking Fee</span>
            <span className="font-medium text-foreground">{"\u20AC"}{fare.preBookingFee.toFixed(2)}</span>
          </div>
          {fare.tariffA > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{"Tariff A (\u20AC1.32/km \u2264 15km)"}</span>
              <span className="font-medium text-foreground">{"\u20AC"}{fare.tariffA.toFixed(2)}</span>
            </div>
          )}
          {fare.tariffB > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{"Tariff B (\u20AC1.72/km > 15km)"}</span>
              <span className="font-medium text-foreground">{"\u20AC"}{fare.tariffB.toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-semibold text-foreground">NTA Maximum Fare</span>
          <span className="text-xl font-bold text-accent">{"\u20AC"}{fare.totalFare.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Drivers Panel                                                      */
/* ------------------------------------------------------------------ */
function DriversPanel({ drivers, loading, error, onRefresh }: {
  drivers: DriverRecord[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const [expandedDriver, setExpandedDriver] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Active Drivers</h3>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading drivers from Google Sheets...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Active Drivers</h3>
          </div>
          <button type="button" onClick={onRefresh} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">
            Active Drivers
            <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
              {drivers.length}
            </span>
          </h3>
        </div>
        <button type="button" onClick={onRefresh} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>

      {drivers.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No drivers found in the Drivers sheet.
        </p>
      ) : (
        <div className="space-y-2">
          {drivers.map((driver, idx) => {
            const isExpanded = expandedDriver === idx;
            const firstName = driver["First Name"] || "";
            const name = driver["Name"] || firstName || Object.values(driver)[0] || "Unknown";
            const status = driver["Current Status"] || "";
            const ntaId = driver["NTA Driver ID"] || "";
            const availableFrom = driver["Available From"] || "";
            const profilePhoto = driver["Profile Photo"] || "";
            const isActive = status.toLowerCase() === "active" || status.toLowerCase() === "available" || status.toLowerCase() === "on duty" || status === "";

            const allKeys = Object.keys(driver);

            return (
              <div key={idx} className="rounded-lg border border-border bg-secondary/30 transition-colors hover:bg-secondary/60">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-3 text-left"
                  onClick={() => setExpandedDriver(isExpanded ? null : idx)}
                >
                    <div className="flex items-center gap-3">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt={name} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{name}</p>
                      <div className="flex items-center gap-2">
                        {status && (
                          <span className={`inline-flex items-center gap-1 text-xs ${isActive ? "text-green-600" : "text-muted-foreground"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-muted-foreground/50"}`} />
                            {status}
                          </span>
                        )}
                        {ntaId && <span className="text-xs text-muted-foreground">NTA: {ntaId}</span>}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-3 pb-3 pt-2">
                    <div className="grid grid-cols-1 gap-1.5">
                      {allKeys.map((key) => {
                        const val = driver[key];
                        if (!val) return null;
                        if (key === "Profile Photo") {
                          return (
                            <div key={key} className="flex items-start gap-2 text-xs">
                              <span className="min-w-[120px] shrink-0 font-medium text-muted-foreground">{key}:</span>
                              <img src={val} alt="Profile" className="h-16 w-16 rounded-lg object-cover" />
                            </div>
                          );
                        }
                        return (
                          <div key={key} className="flex items-start gap-2 text-xs">
                            <span className="min-w-[120px] shrink-0 font-medium text-muted-foreground">{key}:</span>
                            <span className="text-foreground">{val}</span>
                          </div>
                        );
                      })}
                    </div>
                    {availableFrom && (
                      <div className="mt-2 flex items-center gap-1.5 rounded-md bg-accent/10 px-2 py-1 text-xs">
                        <Calendar className="h-3 w-3 text-accent" />
                        <span className="text-muted-foreground">Available from:</span>
                        <span className="font-medium text-foreground">{availableFrom}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Vehicle types                                                      */
/* ------------------------------------------------------------------ */
const VEHICLE_TYPES = [
  "Saloon",
  "Estate",
  "MPV (6-seater)",
  "Executive",
  "Minibus (8-seater)",
  "Wheelchair Accessible",
];

/* ------------------------------------------------------------------ */
/*  Booking Form                                                       */
/* ------------------------------------------------------------------ */
function BookingForm() {
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    email: "",
    pickupEircode: "",
    destinationEircode: "",
    vehicleType: "Saloon",
    passengers: "1",
    pickupDate: "",
    pickupTime: "",
    notes: "",
  });
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "pickupEircode" || field === "destinationEircode") {
      setQuoteResult(null);
      setBookingResult(null);
    }
  };

  const handleGetQuote = async () => {
    if (!formData.pickupEircode || !formData.destinationEircode) {
      toast.error("Please enter both Pickup and Destination Eircodes.");
      return;
    }
    setIsQuoting(true);
    setQuoteResult(null);
    setBookingResult(null);
    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupEircode: formData.pickupEircode,
          destinationEircode: formData.destinationEircode,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to get quote");
      setQuoteResult(data);
      toast.success("Quote calculated successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to get quote");
    } finally {
      setIsQuoting(false);
    }
  };

  const handleSubmitBooking = async () => {
    if (!formData.customerName) {
      toast.error("Customer Name is required.");
      return;
    }
    if (!formData.pickupEircode || !formData.destinationEircode) {
      toast.error("Both Eircodes are required.");
      return;
    }
    setIsBooking(true);
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit booking");
      setBookingResult(data);
      setQuoteResult(null);
      toast.success(`Booking ${data.bookingId} created and written to Google Sheets.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit booking");
    } finally {
      setIsBooking(false);
    }
  };

  const handleReset = () => {
    setFormData({
      customerName: "",
      phone: "",
      email: "",
      pickupEircode: "",
      destinationEircode: "",
      vehicleType: "Saloon",
      passengers: "1",
      pickupDate: "",
      pickupTime: "",
      notes: "",
    });
    setQuoteResult(null);
    setBookingResult(null);
  };

  if (bookingResult) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
              <CheckCircle2 className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Booking Confirmed</h3>
              <p className="text-sm text-muted-foreground">
                Reference: <span className="font-mono font-semibold text-accent">{bookingResult.bookingId}</span>
              </p>
            </div>
          </div>
          <FareBreakdownDisplay
            fare={bookingResult.fare}
            originAddress={bookingResult.distance.originAddress}
            destinationAddress={bookingResult.distance.destinationAddress}
          />
          <div className="mt-4 rounded-lg border border-border bg-card p-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Customer:</span>{" "}
                <span className="font-medium text-foreground">{formData.customerName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Vehicle:</span>{" "}
                <span className="font-medium text-foreground">{formData.vehicleType}</span>
              </div>
              {formData.pickupDate && (
                <div>
                  <span className="text-muted-foreground">Date:</span>{" "}
                  <span className="font-medium text-foreground">{formData.pickupDate}</span>
                </div>
              )}
              {formData.pickupTime && (
                <div>
                  <span className="text-muted-foreground">Time:</span>{" "}
                  <span className="font-medium text-foreground">{formData.pickupTime}</span>
                </div>
              )}
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">This booking has been written to the Google Sheets database.</p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Create New Booking
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer Information</legend>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Customer Name *"
            value={formData.customerName}
            onChange={(e) => updateField("customerName", e.target.value)}
            className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="tel"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Route</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
            <input
              type="text"
              placeholder="Pickup Eircode *"
              value={formData.pickupEircode}
              onChange={(e) => updateField("pickupEircode", e.target.value.toUpperCase())}
              className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm font-mono uppercase text-foreground placeholder:font-sans placeholder:normal-case placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <input
              type="text"
              placeholder="Destination Eircode *"
              value={formData.destinationEircode}
              onChange={(e) => updateField("destinationEircode", e.target.value.toUpperCase())}
              className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm font-mono uppercase text-foreground placeholder:font-sans placeholder:normal-case placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleGetQuote}
          disabled={isQuoting || !formData.pickupEircode || !formData.destinationEircode}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isQuoting ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Calculating Route...</>
          ) : (
            <><Calculator className="h-4 w-4" />Get Fare Estimate</>
          )}
        </button>
      </fieldset>

      {quoteResult && (
        <div className="rounded-xl border border-accent/20 bg-card p-5">
          <FareBreakdownDisplay
            fare={quoteResult.fare}
            originAddress={quoteResult.distance.originAddress}
            destinationAddress={quoteResult.distance.destinationAddress}
          />
        </div>
      )}

      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trip Details</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="relative">
            <Car className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={formData.vehicleType}
              onChange={(e) => updateField("vehicleType", e.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-input bg-card pl-10 pr-10 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {VEHICLE_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={formData.passengers}
              onChange={(e) => updateField("passengers", e.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-input bg-card pl-10 pr-10 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n.toString()}>{n} {n === 1 ? "Passenger" : "Passengers"}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="date"
              value={formData.pickupDate}
              onChange={(e) => updateField("pickupDate", e.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="relative">
            <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="time"
              value={formData.pickupTime}
              onChange={(e) => updateField("pickupTime", e.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Additional Notes</legend>
        <div className="relative">
          <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <textarea
            placeholder="Special requests, flight numbers, etc."
            value={formData.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-input bg-card pl-10 pr-4 pt-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </fieldset>

      <button
        type="button"
        onClick={handleSubmitBooking}
        disabled={isBooking || !formData.customerName || !formData.pickupEircode || !formData.destinationEircode}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isBooking ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Submitting Booking...</>
        ) : (
          <>Submit Booking Request<ArrowRight className="h-4 w-4" /></>
        )}
      </button>
      <p className="text-center text-xs text-muted-foreground">
        Booking will be calculated via Google Maps and written directly to Google Sheets.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function Home() {
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const [driversError, setDriversError] = useState<string | null>(null);

  const fetchDrivers = useCallback(async () => {
    setDriversLoading(true);
    setDriversError(null);
    try {
      const res = await fetch("/api/drivers");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch drivers");
      setDrivers(data.drivers);
    } catch (err) {
      setDriversError(err instanceof Error ? err.message : "Failed to load drivers");
    } finally {
      setDriversLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Booking Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create bookings, calculate fares, and manage dispatch.</p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Today's Bookings" value="--" subtext="Connect Sheets to sync" icon={CalendarCheck} />
          <StatCard
            label="Active Drivers"
            value={driversLoading ? "..." : drivers.length.toString()}
            subtext={driversLoading ? "Loading..." : `${drivers.length} driver${drivers.length !== 1 ? "s" : ""} on file`}
            icon={Users}
          />
          <StatCard label="Fleet Vehicles" value="--" subtext="Connect Sheets to sync" icon={Car} />
          <StatCard label="Avg Fare" value="--" subtext="NTA 2026 rates" icon={TrendingUp} variant="accent" />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground">New Booking Request</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Enter customer and route details. Fares are calculated automatically using Google Maps distance and NTA 2026 rates.
                </p>
              </div>
              <BookingForm />
            </div>
          </div>

          <div className="space-y-6">
            <DriversPanel
              drivers={drivers}
              loading={driversLoading}
              error={driversError}
              onRefresh={fetchDrivers}
            />
            <NTAInfoPanel />
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Eircode Tips</h3>
              <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  Enter the full 7-character Eircode (e.g. D02 AF30)
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {"Eircodes are automatically prefixed with \"Ireland\" for accurate geocoding"}
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {"Use \"Get Fare Estimate\" to preview the route before submitting"}
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  All bookings are written directly to Google Sheets
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">System Status</h3>
              <div className="space-y-2.5">
                {[
                  { name: "Google Maps API", status: "Connected" },
                  { name: "Google Sheets", status: "Connected" },
                  { name: "NTA Pricing", status: "2026 Rates" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-xs font-medium text-foreground">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="border-t border-border bg-card py-6">
        <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
          <p className="text-xs text-muted-foreground">Redmond Chauffeur Drive - Booking & Dispatch System v1.0</p>
        </div>
      </footer>
    </div>
  );
}
