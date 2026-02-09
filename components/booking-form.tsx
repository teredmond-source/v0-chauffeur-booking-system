"use client";

import React, { useState } from "react";
import {
  MapPin, Clock, Users, Car, Phone, Mail, User,
  FileText, Loader2, CheckCircle2, AlertCircle,
  ArrowRight, Calculator,
} from "lucide-react";

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

interface BookingResult {
  bookingId: string;
  distance: {
    km: number;
    minutes: number;
    originAddress: string;
    destinationAddress: string;
  };
  fare: FareBreakdown;
}

export function BookingForm() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickupEircode, setPickupEircode] = useState("");
  const [destinationEircode, setDestinationEircode] = useState("");
  const [vehicleType, setVehicleType] = useState("Standard Saloon");
  const [passengers, setPassengers] = useState("1");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [notes, setNotes] = useState("");

  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetQuote = async () => {
    if (!pickupEircode || !destinationEircode) {
      setError("Please enter both Pickup and Destination Eircodes.");
      return;
    }
    setQuoteLoading(true);
    setError(null);
    setQuoteResult(null);
    setBookingResult(null);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupEircode, destinationEircode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get quote");
      setQuoteResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get quote");
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!customerName) {
      setError("Please enter the customer name to confirm the booking.");
      return;
    }
    setBookingLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          phone,
          email,
          pickupEircode,
          destinationEircode,
          vehicleType,
          passengers,
          pickupDate,
          pickupTime,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create booking");
      setBookingResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReset = () => {
    setCustomerName("");
    setPhone("");
    setEmail("");
    setPickupEircode("");
    setDestinationEircode("");
    setVehicleType("Standard Saloon");
    setPassengers("1");
    setPickupDate("");
    setPickupTime("");
    setNotes("");
    setQuoteResult(null);
    setBookingResult(null);
    setError(null);
  };

  // Booking confirmed view
  if (bookingResult) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">Booking Confirmed</h3>
          <p className="mt-1 text-sm text-muted-foreground">Reference: <span className="font-mono font-bold text-foreground">{bookingResult.bookingId}</span></p>

          <div className="mt-6 w-full max-w-md rounded-lg border border-border bg-secondary/30 p-4 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">From:</span>
                <span className="font-medium text-foreground">{bookingResult.distance.originAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">To:</span>
                <span className="font-medium text-foreground">{bookingResult.distance.destinationAddress}</span>
              </div>
              <div className="border-t border-border pt-2" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Distance:</span>
                <span className="font-medium text-foreground">{bookingResult.distance.km} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. Duration:</span>
                <span className="font-medium text-foreground">{bookingResult.distance.minutes} mins</span>
              </div>
              <div className="border-t border-border pt-2" />
              <div className="flex justify-between text-base font-bold">
                <span className="text-foreground">Total Fare:</span>
                <span className="text-accent">{"\u20AC"}{bookingResult.fare.totalFare.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            New Booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">New Booking</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">Enter journey details to get a fare estimate based on NTA 2026 maximum rates.</p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Journey Details */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
            <MapPin className="h-4 w-4 text-accent" />
            Journey Details
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pickup" className="mb-1 block text-xs font-medium text-muted-foreground">
                Pickup Eircode / Address
              </label>
              <input
                id="pickup"
                type="text"
                value={pickupEircode}
                onChange={(e) => setPickupEircode(e.target.value)}
                placeholder="e.g. D02 AF30"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="destination" className="mb-1 block text-xs font-medium text-muted-foreground">
                Destination Eircode / Address
              </label>
              <input
                id="destination"
                type="text"
                value={destinationEircode}
                onChange={(e) => setDestinationEircode(e.target.value)}
                placeholder="e.g. T12 AB34"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Get Quote Button */}
          <button
            type="button"
            onClick={handleGetQuote}
            disabled={quoteLoading || !pickupEircode || !destinationEircode}
            className="mt-4 flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
          >
            {quoteLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4" />
                Get Fare Estimate
              </>
            )}
          </button>
        </div>

        {/* Quote Result */}
        {quoteResult && (
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
            <h4 className="mb-3 text-sm font-semibold text-foreground">Fare Estimate</h4>
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">{quoteResult.distance.originAddress}</span>
              <ArrowRight className="h-3 w-3 shrink-0 text-accent" />
              <span className="truncate">{quoteResult.distance.destinationAddress}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-md bg-background p-2.5 text-center">
                <p className="text-xs text-muted-foreground">Distance</p>
                <p className="text-lg font-bold text-foreground">{quoteResult.distance.km} <span className="text-xs font-normal">km</span></p>
              </div>
              <div className="rounded-md bg-background p-2.5 text-center">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-lg font-bold text-foreground">{quoteResult.distance.minutes} <span className="text-xs font-normal">mins</span></p>
              </div>
              <div className="rounded-md bg-background p-2.5 text-center">
                <p className="text-xs text-muted-foreground">Initial + Booking</p>
                <p className="text-lg font-bold text-foreground">{"\u20AC"}{(quoteResult.fare.initialCharge + quoteResult.fare.preBookingFee).toFixed(2)}</p>
              </div>
              <div className="rounded-md bg-accent/10 p-2.5 text-center">
                <p className="text-xs text-accent">Total Fare</p>
                <p className="text-lg font-bold text-accent">{"\u20AC"}{quoteResult.fare.totalFare.toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              <span>Breakdown: Initial {"\u20AC"}{quoteResult.fare.initialCharge.toFixed(2)} + Pre-booking {"\u20AC"}{quoteResult.fare.preBookingFee.toFixed(2)} + Tariff A {"\u20AC"}{quoteResult.fare.tariffA.toFixed(2)}</span>
              {quoteResult.fare.tariffB > 0 && <span> + Tariff B {"\u20AC"}{quoteResult.fare.tariffB.toFixed(2)}</span>}
              <span className="ml-1">(NTA 2026 max rates)</span>
            </div>
          </div>
        )}

        {/* Customer & Trip Details - shown after quote */}
        {quoteResult && (
          <>
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                <User className="h-4 w-4 text-accent" />
                Customer Details
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="customerName" className="mb-1 block text-xs font-medium text-muted-foreground">
                    Customer Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="customerName"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full name"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="mb-1 block text-xs font-medium text-muted-foreground">
                    Phone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="087 123 4567"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-1 block text-xs font-medium text-muted-foreground">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@email.com"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                <Clock className="h-4 w-4 text-accent" />
                Trip Details
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label htmlFor="vehicleType" className="mb-1 block text-xs font-medium text-muted-foreground">
                    Vehicle Type
                  </label>
                  <select
                    id="vehicleType"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option>Standard Saloon</option>
                    <option>Executive Saloon</option>
                    <option>MPV / People Carrier</option>
                    <option>Wheelchair Accessible</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="passengers" className="mb-1 block text-xs font-medium text-muted-foreground">
                    Passengers
                  </label>
                  <select
                    id="passengers"
                    value={passengers}
                    onChange={(e) => setPassengers(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="pickupDate" className="mb-1 block text-xs font-medium text-muted-foreground">
                    Pickup Date
                  </label>
                  <input
                    id="pickupDate"
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label htmlFor="pickupTime" className="mb-1 block text-xs font-medium text-muted-foreground">
                    Pickup Time
                  </label>
                  <input
                    id="pickupTime"
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="mb-1 block text-xs font-medium text-muted-foreground">
                <FileText className="mr-1 inline h-3 w-3" />
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Any special requirements..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
              />
            </div>

            {/* Confirm Booking */}
            <div className="flex items-center gap-3 border-t border-border pt-5">
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={bookingLoading || !customerName}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {bookingLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Confirm Booking
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                Clear
              </button>
              {quoteResult && (
                <span className="ml-auto text-sm font-bold text-accent">
                  Est. Fare: {"\u20AC"}{quoteResult.fare.totalFare.toFixed(2)}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
