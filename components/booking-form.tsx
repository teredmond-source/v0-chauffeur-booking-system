"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin, Clock, Users, Phone, Mail, User,
  FileText, Loader2, CheckCircle2, AlertCircle,
  Car, MessageCircle,
} from "lucide-react";
import { AddressAutocomplete } from "@/components/address-autocomplete";

interface VehicleOption {
  name: string;
  colour: string;
  maxPassengers: number;
  minFare: number;
  photo: string;
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
  const [preferredReply, setPreferredReply] = useState<"whatsapp" | "email">("whatsapp");

  const [vehicleOptions, setVehicleOptions] = useState<VehicleOption[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
            let photo = "";
            for (const [key, val] of Object.entries(v)) {
              if (val && typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://")) &&
                (key.toLowerCase().includes("photo") || key.toLowerCase().includes("image") || key.toLowerCase().includes("pic") ||
                  /drive\.google\.com/i.test(val))) {
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

  // Clamp passengers when vehicle changes
  useEffect(() => {
    if (parseInt(passengers) > maxPax) {
      setPassengers(String(maxPax));
    }
  }, [maxPax, passengers]);

  const handleSubmit = async () => {
    if (!customerName) {
      setError("Please enter your name.");
      return;
    }
    if (!phone && !email) {
      setError("Please enter a phone number or email so we can contact you.");
      return;
    }
    if (preferredReply === "whatsapp" && !phone) {
      setError("Please enter a phone number for WhatsApp replies.");
      return;
    }
    if (preferredReply === "email" && !email) {
      setError("Please enter an email address for email replies.");
      return;
    }
    if (!pickupEircode || !destinationEircode) {
      setError("Please enter both Pickup and Destination Eircodes.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
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
        preferredReply,
      };
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request");
      setBookingId(data.bookingId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
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
    setPreferredReply("whatsapp");
    setBookingId(null);
    setError(null);
  };

  // Success view
  if (bookingId) {
    return (
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-foreground">Request Submitted Successfully</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Your request reference is <span className="font-mono font-bold text-foreground">{bookingId}</span>
          </p>
          <div className="mx-auto mt-5 max-w-md rounded-lg border border-border bg-secondary/30 p-5">
            <p className="text-sm leading-relaxed text-foreground">
              Thank you for choosing <span className="font-semibold">Redmond Chauffeur Drive</span>.
              We have received your booking request and will review it promptly.
              A member of our team will be in touch shortly via
              {preferredReply === "whatsapp" ? (
                <span className="font-medium text-green-600"> WhatsApp </span>
              ) : (
                <span className="font-medium text-accent"> email </span>
              )}
              to confirm your fare and availability.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="mt-6 rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Return to Booking Request
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
          Fill in your details below and we will get back to you with a fare quote and availability.
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
            <AddressAutocomplete
              id="pickup"
              value={pickupEircode}
              onChange={setPickupEircode}
              label="Pickup Eircode / Address"
              placeholder="e.g. D02 X285 or 12 O'Connell St, Dublin"
              required
            />
            <AddressAutocomplete
              id="destination"
              value={destinationEircode}
              onChange={setDestinationEircode}
              label="Destination Eircode / Address"
              placeholder="e.g. T12 AB34 or Dublin Airport, Co. Dublin"
              required
            />
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

        {/* Preferred Reply Method */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
            <MessageCircle className="h-4 w-4 text-accent" />
            How would you like us to reply?
          </h4>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPreferredReply("whatsapp")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                preferredReply === "whatsapp"
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-border bg-background text-muted-foreground hover:border-green-300 hover:bg-green-50/50"
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setPreferredReply("email")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                preferredReply === "email"
                  ? "border-accent bg-accent/5 text-accent"
                  : "border-border bg-background text-muted-foreground hover:border-accent/40 hover:bg-accent/5"
              }`}
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
          </div>
        </div>

        {/* Submit Button - Centered with 3D effect */}
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !pickupEircode || !destinationEircode || !customerName}
            className="flex items-center gap-2 rounded-xl bg-accent px-10 py-4 text-sm font-bold text-accent-foreground shadow-[0_6px_0_0_rgba(0,0,0,0.25)] transition-all hover:shadow-[0_4px_0_0_rgba(0,0,0,0.25)] hover:translate-y-[2px] active:shadow-[0_1px_0_0_rgba(0,0,0,0.25)] active:translate-y-[5px] disabled:opacity-50 disabled:shadow-[0_6px_0_0_rgba(0,0,0,0.1)] disabled:translate-y-0"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting Request...
              </>
            ) : (
              "Request Fare Estimate & Availability"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
