"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Navigation, MapPin, Clock, Car, Users, Phone, Calendar,
  Loader2, XCircle, CheckCircle2, ExternalLink,
} from "lucide-react";

interface BookingData {
  [key: string]: string;
}

export default function DriverDispatchPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooking = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const found = data.bookings?.find((b: BookingData) => b["Request ID"] === bookingId);
      if (!found) throw new Error("Booking not found");
      setBooking(found);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load booking");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <span className="ml-2 text-muted-foreground">Loading dispatch...</span>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-xl font-semibold text-foreground">Dispatch Not Found</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error || "This booking could not be found."}</p>
        </div>
      </div>
    );
  }

  const pickupAddress = booking["Origin Address"] || booking["Pickup Eircode"] || "";
  const destAddress = booking["Destination Address"] || booking["Destination Eircode"] || "";
  const googleMapsPickupUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pickupAddress)}`;
  const googleMapsFullUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickupAddress)}&destination=${encodeURIComponent(destAddress)}`;
  const customerPhone = booking["Phone"] || "";
  const telLink = `tel:${customerPhone.replace(/\s/g, "")}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-6">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="font-serif text-2xl font-bold text-foreground">Driver Dispatch</h1>
          <p className="text-sm text-muted-foreground">Booking <span className="font-mono font-bold text-accent">{bookingId}</span></p>
          <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${booking["Status"] === "Confirmed" ? "bg-green-100 text-green-800" : "bg-accent/10 text-accent"}`}>
            {booking["Status"]}
          </span>
        </div>

        {/* Customer Info */}
        <div className="mb-4 rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Customer</h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">{booking["Customer Name"]}</span>
              {customerPhone && (
                <a
                  href={telLink}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call
                </a>
              )}
            </div>
            {booking["Pax"] && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {booking["Pax"]} passenger{parseInt(booking["Pax"]) !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>

        {/* Journey */}
        <div className="mb-4 rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Journey</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100">
                <MapPin className="h-3.5 w-3.5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="font-medium text-foreground">{pickupAddress}</p>
              </div>
            </div>
            <div className="ml-3 border-l-2 border-dashed border-border py-1 pl-6">
              <p className="text-xs text-muted-foreground">{booking["Distance KM"]} km - {booking["Travel Time"]} mins</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10">
                <MapPin className="h-3.5 w-3.5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Destination</p>
                <p className="font-medium text-foreground">{destAddress}</p>
              </div>
            </div>
          </div>

          {(booking["Date"] || booking["Time"]) && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2 text-sm">
              <Calendar className="h-4 w-4 text-accent" />
              <span className="text-foreground">{booking["Date"]}{booking["Time"] ? ` at ${booking["Time"]}` : ""}</span>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Car className="h-4 w-4" />
            <span>{booking["Vehicle Type"]}</span>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="space-y-3">
          <a
            href={googleMapsPickupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-4 text-base font-semibold text-white hover:bg-green-700"
          >
            <Navigation className="h-5 w-5" />
            Navigate to Pickup
          </a>
          <a
            href={googleMapsFullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-accent bg-transparent px-6 py-4 text-base font-semibold text-accent hover:bg-accent/5"
          >
            <ExternalLink className="h-5 w-5" />
            Full Route (Pickup to Destination)
          </a>
        </div>

        {/* Fare */}
        <div className="mt-4 rounded-xl border border-border bg-card p-5 text-center">
          <p className="text-xs text-muted-foreground">Fare</p>
          <p className="text-2xl font-bold text-accent">
            {"\u20AC"}{booking["Owner Fare"] || booking["Adjusted Fare"] || booking["NTA Max Fare"]}
          </p>
        </div>
      </div>
    </div>
  );
}
