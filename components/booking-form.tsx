"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin, Clock, Users, Phone, Mail, User,
  FileText, Loader2, CheckCircle2, AlertCircle,
  ArrowRight, Calculator, Car,
} from "lucide-react";

interface VehicleOption {
  name: string;
  colour: string;
  maxPassengers: number;
  minFare: number;
  photo: string;
}

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
  const [generalQuery, setGeneralQuery] = useState("");
  const [pickupEircode, setPickupEircode] = useState("");
  const [destinationEircode, setDestinationEircode] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");

  const [vehicleOptions, setVehicleOptions] = useState<VehicleOption[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);

  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [adjustedFare, setAdjustedFare] = useState<number | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch vehicles from the sheet for the dropdown
  useEffect(() => {
    async function loadVehicles() {
      try {
        const res = await fetch("/api/vehicles");
        const data = await res.json();
        if (data.vehicles && Array.isArray(data.vehicles)) {
          const options: VehicleOption[] = data.vehicles.map((v: Record<string, string>) => {
            const name = v["Vehicle Name"] || v["Name"] || v["Make"] || Object.values(v)[0] || "Unknown";
            const colour = v["Colour"] || v["Color"] || "";
            const maxPax = parseInt(v["Max Passengers"] || v["Max Pax"] || v["Passengers"] || "4", 10);
            const minFare = parseFloat(v["Min Fare"] || v["Minimum Fare"] || "15");
            // Find photo URL
            let photo = "";
            for (const [key, val] of Object.entries(v)) {
              if (val && typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://")) &&
                (key.toLowerCase().includes("photo") || key.toLowerCase().includes("image") || key.toLowerCase().includes("pic") ||
                  /drive\.google\.com/i.test(val))) {
                // Convert Google Drive URL
                const match = val.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
                if (match) {
                  photo = `https://lh3.googleusercontent.com/d/${match[1]}`;
                } else {
                  photo = val;
                }
                break;
              }
            }
            return { name, colour, maxPassengers: maxPax, minFare, photo };
          });
          setVehicleOptions(options);
          if (options.length > 0) setSelectedVehicle(options[0].name);
        }
      } catch {
        // Fallback vehicle options
        setVehicleOptions([
          { name: "Mercedes E-Class", colour: "Black", maxPassengers: 3, minFare: 15, photo: "" },
          { name: "Mercedes Vito", colour: "Black", maxPassengers: 7, minFare: 20, photo: "" },
        ]);
        setSelectedVehicle("Mercedes E-Class");
      } finally {
        setVehiclesLoading(false);
      }
    }
    loadVehicles();
  }, []);

  const currentVehicle = vehicleOptions.find((v) => v.name === selectedVehicle);
  const maxPax = currentVehicle?.maxPassengers || 4;
  const minFare = currentVehicle?.minFare || 15;

  // Recalculate adjusted fare when vehicle or quote changes
  useEffect(() => {
    if (quoteResult) {
      const ntaFare = quoteResult.fare.totalFare;
      const rounded = Math.round(Math.max(ntaFare, minFare));
      setAdjustedFare(rounded);
    }
  }, [quoteResult, minFare]);

  // Clamp passengers when vehicle changes
  useEffect(() => {
    if (parseInt(passengers) > maxPax) {
      setPassengers(String(maxPax));
    }
  }, [maxPax, passengers]);

  const handleGetQuote = async () => {
    if (!pickupEircode || !destinationEircode) {
      setError("Please enter both Pickup and Destination Eircodes.");
      return;
    }
    setQuoteLoading(true);
    setError(null);
    setQuoteResult(null);
    setBookingResult(null);
    setAdjustedFare(null);
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

  const handleSubmitBooking = async () => {
    if (!customerName) {
      setError("Please enter your name.");
      return;
    }
    if (!phone && !email) {
      setError("Please enter a phone number or email so we can contact you.");
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
          generalQuery,
          pickupEircode,
          destinationEircode,
          vehicleType: selectedVehicle,
          passengers,
          pickupDate,
          pickupTime,
          minFare,
          adjustedFare,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit booking request");
      setBookingResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit booking request");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReset = () => {
    setCustomerName("");
    setPhone("");
    setEmail("");
    setGeneralQuery("");
    setPickupEircode("");
    setDestinationEircode("");
    setSelectedVehicle(vehicleOptions[0]?.name || "");
    setPassengers("1");
    setPickupDate("");
    setPickupTime("");
    setQuoteResult(null);
    setAdjustedFare(null);
    setBookingResult(null);
    setError(null);
  };

  // Booking submitted view
  if (bookingResult) {
    return (
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-foreground">Booking Request Submitted</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Your request reference is <span className="font-mono font-bold text-foreground">{bookingResult.bookingId}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            We will review your request and get back to you shortly with the confirmed fare.
          </p>

          <div className="mt-6 w-full max-w-lg rounded-lg border border-border bg-secondary/30 p-5 text-left">
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">From:</span>
                <span className="text-right font-medium text-foreground">{bookingResult.distance.originAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">To:</span>
                <span className="text-right font-medium text-foreground">{bookingResult.distance.destinationAddress}</span>
              </div>
              <div className="border-t border-border pt-2" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Distance:</span>
                <span className="font-medium text-foreground">{bookingResult.distance.km} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. Travel Time:</span>
                <span className="font-medium text-foreground">{bookingResult.distance.minutes} mins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicle:</span>
                <span className="font-medium text-foreground">{selectedVehicle}</span>
              </div>
              <div className="border-t border-border pt-2" />
              <div className="flex justify-between text-base font-bold">
                <span className="text-foreground">Estimated Fare:</span>
                <span className="text-accent">{"\u20AC"}{adjustedFare || Math.round(bookingResult.fare.totalFare)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Final fare will be confirmed by Redmond Chauffeur Drive.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="mt-6 rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            New Booking Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground">Booking Request</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in your details below to get a fare estimate and submit your booking request.
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Customer Details */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
            <User className="h-4 w-4 text-accent" />
            Your Details
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="customerName" className="mb-1 block text-xs font-medium text-muted-foreground">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                id="customerName"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1 block text-xs font-medium text-muted-foreground">
                <Phone className="mr-1 inline h-3 w-3" />
                Phone <span className="text-destructive">*</span>
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
                <Mail className="mr-1 inline h-3 w-3" />
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        {/* General Query */}
        <div>
          <label htmlFor="generalQuery" className="mb-1 block text-xs font-medium text-muted-foreground">
            <FileText className="mr-1 inline h-3 w-3" />
            General Query (optional)
          </label>
          <p className="mb-2 text-xs text-muted-foreground">Looking for a special booking? Wedding, concert, sporting event, etc.</p>
          <textarea
            id="generalQuery"
            value={generalQuery}
            onChange={(e) => setGeneralQuery(e.target.value)}
            rows={2}
            placeholder="e.g. Wedding pickup for 6 guests, need vehicle decorated..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />
        </div>

        {/* Journey Details */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
            <MapPin className="h-4 w-4 text-accent" />
            Journey Details
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pickup" className="mb-1 block text-xs font-medium text-muted-foreground">
                Pickup Eircode / Address <span className="text-destructive">*</span>
              </label>
              <input
                id="pickup"
                type="text"
                value={pickupEircode}
                onChange={(e) => setPickupEircode(e.target.value)}
                placeholder="e.g. D02 X285"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="destination" className="mb-1 block text-xs font-medium text-muted-foreground">
                Destination Eircode / Address <span className="text-destructive">*</span>
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
        </div>

        {/* Vehicle Selection */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
            <Car className="h-4 w-4 text-accent" />
            Choose Your Vehicle
          </h4>
          {vehiclesLoading ? (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading vehicles...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {vehicleOptions.map((vehicle) => {
                const isSelected = selectedVehicle === vehicle.name;
                return (
                  <button
                    key={vehicle.name}
                    type="button"
                    onClick={() => setSelectedVehicle(vehicle.name)}
                    className={`flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-colors ${
                      isSelected
                        ? "border-accent bg-accent/5"
                        : "border-border bg-background hover:border-accent/40 hover:bg-secondary/30"
                    }`}
                  >
                    {vehicle.photo ? (
                      <img
                        src={vehicle.photo || "/placeholder.svg"}
                        alt={vehicle.name}
                        className="h-16 w-16 shrink-0 rounded-lg object-cover border border-border"
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Car className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{vehicle.name}</p>
                      {vehicle.colour && (
                        <p className="text-xs text-muted-foreground">Colour: {vehicle.colour}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Max {vehicle.maxPassengers} passengers</p>
                      <p className="mt-1 text-xs font-medium text-accent">Min fare: {"\u20AC"}{vehicle.minFare}</p>
                    </div>
                    {isSelected && (
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent">
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Trip Details */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock className="h-4 w-4 text-accent" />
            Trip Details
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="passengers" className="mb-1 block text-xs font-medium text-muted-foreground">
                <Users className="mr-1 inline h-3 w-3" />
                Passengers
              </label>
              <select
                id="passengers"
                value={passengers}
                onChange={(e) => setPassengers(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {Array.from({ length: maxPax }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n} passenger{n > 1 ? "s" : ""}</option>
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

        {/* Get Fare Estimate Button */}
        <button
          type="button"
          onClick={handleGetQuote}
          disabled={quoteLoading || !pickupEircode || !destinationEircode}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50 sm:w-auto"
        >
          {quoteLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Calculating Fare...
            </>
          ) : (
            <>
              <Calculator className="h-4 w-4" />
              Get Fare Estimate
            </>
          )}
        </button>

        {/* Quote Result */}
        {quoteResult && adjustedFare !== null && (
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-5">
            <h4 className="mb-3 text-sm font-semibold text-foreground">Fare Estimate</h4>
            <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0 text-accent" />
              <span className="truncate">{quoteResult.distance.originAddress}</span>
              <ArrowRight className="h-3 w-3 shrink-0 text-accent" />
              <span className="truncate">{quoteResult.distance.destinationAddress}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-md bg-background p-3 text-center">
                <p className="text-xs text-muted-foreground">Distance</p>
                <p className="text-lg font-bold text-foreground">{quoteResult.distance.km} <span className="text-xs font-normal">km</span></p>
              </div>
              <div className="rounded-md bg-background p-3 text-center">
                <p className="text-xs text-muted-foreground">Travel Time</p>
                <p className="text-lg font-bold text-foreground">{quoteResult.distance.minutes} <span className="text-xs font-normal">mins</span></p>
              </div>
              <div className="rounded-md bg-background p-3 text-center">
                <p className="text-xs text-muted-foreground">NTA Max Fare</p>
                <p className="text-lg font-bold text-foreground">{"\u20AC"}{quoteResult.fare.totalFare.toFixed(2)}</p>
              </div>
              <div className="rounded-md bg-accent/10 p-3 text-center">
                <p className="text-xs font-medium text-accent">Estimated Fare</p>
                <p className="text-2xl font-bold text-accent">{"\u20AC"}{adjustedFare}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p>NTA 2026 breakdown: Initial {"\u20AC"}{quoteResult.fare.initialCharge.toFixed(2)} + Pre-booking {"\u20AC"}{quoteResult.fare.preBookingFee.toFixed(2)} + Distance charge {"\u20AC"}{(quoteResult.fare.tariffA + quoteResult.fare.tariffB).toFixed(2)}</p>
              {adjustedFare > quoteResult.fare.totalFare && (
                <p className="text-accent">Minimum fare of {"\u20AC"}{minFare} applied for {selectedVehicle}.</p>
              )}
            </div>

            {/* Submit Booking */}
            <div className="mt-5 flex items-center gap-3 border-t border-accent/20 pt-5">
              <button
                type="button"
                onClick={handleSubmitBooking}
                disabled={bookingLoading || !customerName || (!phone && !email)}
                className="flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {bookingLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Book Request
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-border bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
