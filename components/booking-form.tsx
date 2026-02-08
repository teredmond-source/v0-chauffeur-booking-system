"use client";

import { useState } from "react";
import { toast } from "sonner";
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
} from "lucide-react";
import { FareBreakdownDisplay } from "./fare-breakdown";
import type { FareBreakdown } from "@/lib/pricing";

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

const VEHICLE_TYPES = [
  "Saloon",
  "Estate",
  "MPV (6-seater)",
  "Executive",
  "Minibus (8-seater)",
  "Wheelchair Accessible",
];

export function BookingForm() {
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
    // Clear results when key fields change
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

      if (!response.ok) {
        throw new Error(data.error || "Failed to get quote");
      }

      setQuoteResult(data);
      toast.success("Quote calculated successfully.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to get quote";
      toast.error(msg);
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
    if (!formData.vehicleType) {
      toast.error("Please select a Vehicle Type.");
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

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit booking");
      }

      setBookingResult(data);
      setQuoteResult(null);
      toast.success(`Booking ${data.bookingId} created and written to Google Sheets.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to submit booking";
      toast.error(msg);
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
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
              <CheckCircle2 className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Booking Confirmed
              </h3>
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

          <p className="mt-4 text-xs text-muted-foreground">
            This booking has been written to the Google Sheets database.
          </p>
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
      {/* Customer Information */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Customer Information
        </legend>
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

      {/* Route */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Route
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
            <input
              type="text"
              placeholder="Pickup Eircode *"
              value={formData.pickupEircode}
              onChange={(e) => updateField("pickupEircode", e.target.value.toUpperCase())}
              className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm font-mono text-foreground uppercase placeholder:font-sans placeholder:normal-case placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <input
              type="text"
              placeholder="Destination Eircode *"
              value={formData.destinationEircode}
              onChange={(e) => updateField("destinationEircode", e.target.value.toUpperCase())}
              className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm font-mono text-foreground uppercase placeholder:font-sans placeholder:normal-case placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Calculating Route...
            </>
          ) : (
            <>
              <Calculator className="h-4 w-4" />
              Get Fare Estimate
            </>
          )}
        </button>
      </fieldset>

      {/* Quote Result */}
      {quoteResult && (
        <div className="rounded-xl border border-accent/20 bg-card p-5">
          <FareBreakdownDisplay
            fare={quoteResult.fare}
            originAddress={quoteResult.distance.originAddress}
            destinationAddress={quoteResult.distance.destinationAddress}
          />
        </div>
      )}

      {/* Trip Details */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Trip Details
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="relative">
            <Car className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={formData.vehicleType}
              onChange={(e) => updateField("vehicleType", e.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-input bg-card pl-10 pr-10 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {VEHICLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
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
                <option key={n} value={n.toString()}>
                  {n} {n === 1 ? "Passenger" : "Passengers"}
                </option>
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

      {/* Notes */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Additional Notes
        </legend>
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

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmitBooking}
        disabled={isBooking || !formData.customerName || !formData.pickupEircode || !formData.destinationEircode}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isBooking ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting Booking...
          </>
        ) : (
          <>
            Submit Booking Request
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Booking will be calculated via Google Maps and written directly to Google Sheets.
      </p>
    </div>
  );
}
