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
      <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-400/10">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-foreground">
          Request Submitted Successfully
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">Your request reference is <span className="font-mono font-bold text-accent">{bookingId}</span></p>

        <div className="mx-auto max-w-md rounded-lg bg-secondary/30 p-4 text-left text-sm text-muted-foreground">
          <p>
            Thank you for choosing Redmond Chauffeur Drive.
            We have received your booking request and will review it promptly.
            A member of our team will be in touch shortly via
            {preferredReply === "whatsapp" ? (
              <span className="font-semibold text-green-400"> WhatsApp</span>
            ) : (
              <span className="font-semibold text-accent"> email</span>
            )}
            {" "}to confirm your fare and availability.
          </p>
        </div>

        <button type="button" onClick={handleReset} className="mt-6 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90">
          Return to Booking Request
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-card p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-bold tracking-tight text-foreground">Booking Request</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Fill in your details below and we will get back to you with a fare quote and availability.
      </p>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Customer Details */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <User className="h-4 w-4 text-primary" />
            Your Details
          </h3>
          <div className="space-y-4 rounded-lg border border-primary/25 bg-background/50 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="customerName" className="mb-1 block text-sm font-medium text-foreground">Name <span className="text-destructive">*</span></label>
                <input
                  id="customerName"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-lg border border-muted-foreground/30 bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Phone className="h-3.5 w-3.5 text-accent" /> Phone <span className="text-destructive">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="087 123 4567"
                  className="w-full rounded-lg border border-muted-foreground/30 bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Mail className="h-3.5 w-3.5 text-accent" /> Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full rounded-lg border border-muted-foreground/30 bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        {/* General Query */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText className="h-4 w-4 text-accent" />
            General Query (optional)
          </h3>
          <div className="rounded-lg border border-primary/25 bg-background/50 p-4">
            <p className="mb-2 text-xs text-muted-foreground">Looking for a special booking? Wedding, concert, sporting event, etc.</p>
            <textarea
              id="generalQuery"
              value={generalQuery}
              onChange={(e) => setGeneralQuery(e.target.value)}
              rows={2}
              placeholder="e.g. Wedding pickup for 6 guests, need vehicle decorated..."
              className="w-full rounded-lg border border-muted-foreground/30 bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>
        </div>

        {/* Journey Details */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-accent" />
            Journey Details
          </h3>
          <div className="space-y-4 rounded-lg border border-primary/25 bg-background/50 p-4">
            <AddressAutocomplete id="pickup" value={pickupEircode} onChange={setPickupEircode} label="Pickup Address / Eircode" placeholder="Start typing an address or Eircode" required />
            <AddressAutocomplete id="destination" value={destinationEircode} onChange={setDestinationEircode} label="Destination Address / Eircode" placeholder="Start typing an address or Eircode" required />
          </div>
        </div>

        {/* Vehicle Selection */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Car className="h-4 w-4 text-accent" />
            Choose Your Vehicle
          </h3>
          <div className="rounded-lg border border-primary/25 bg-background/50 p-4">
            {vehiclesLoading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading vehicles...</span>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
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
                        <img src={vehicle.photo || "/placeholder.svg"} alt={vehicle.name} className="h-16 w-16 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary">
                          <Car className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-foreground">{vehicle.name}</p>
                        {vehicle.colour && (
                          <p className="text-xs text-muted-foreground">Colour: {vehicle.colour}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Max {vehicle.maxPassengers} passengers</p>
                      </div>
                      {isSelected && (
                        <div className="ml-auto">
                          <CheckCircle2 className="h-5 w-5 text-accent" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Trip Details */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="h-4 w-4 text-accent" />
            Trip Details
          </h3>
          <div className="space-y-4 rounded-lg border border-primary/25 bg-background/50 p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="passengers" className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Users className="h-3.5 w-3.5 text-accent" /> Passengers
                </label>
                <select
                  id="passengers"
                  value={passengers}
                  onChange={(e) => setPassengers(e.target.value)}
                  className="w-full rounded-lg border border-muted-foreground/30 bg-secondary px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {Array.from({ length: maxPax }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n} passenger{n > 1 ? "s" : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="pickupDate" className="mb-1 block text-sm font-medium text-foreground">Pickup Date</label>
                <input
                  id="pickupDate"
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full rounded-lg border border-muted-foreground/30 bg-secondary px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label htmlFor="pickupTime" className="mb-1 block text-sm font-medium text-foreground">Pickup Time</label>
                <input
                  id="pickupTime"
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full rounded-lg border border-muted-foreground/30 bg-secondary px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preferred Reply Method */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <MessageCircle className="h-4 w-4 text-accent" />
            How would you like us to reply?
          </h3>
          <div className="rounded-lg border border-primary/25 bg-background/50 p-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPreferredReply("whatsapp")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                  preferredReply === "whatsapp"
                    ? "border-green-400 bg-green-400/10 text-green-400"
                    : "border-border bg-background text-muted-foreground hover:border-green-400/40 hover:bg-green-400/5"
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
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-primary/20 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
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
