"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Car, MapPin, Clock, Loader2, CheckCircle2, Shield, Star, Navigation,
} from "lucide-react";

interface TrackingData {
  bookingId: string;
  journeyStatus: string;
  driverName: string;
  vehicleType: string;
  vehicleReg: string;
  pickupAddress: string;
  destAddress: string;
  pickupTimestamp: string | null;
  completionTimestamp: string | null;
  lat: string | null;
  lng: string | null;
  date?: string;
  time?: string;
}

export default function TrackingPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;

  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = useCallback(async () => {
    try {
      const res = await fetch(`/api/track/${bookingId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tracking");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  // Poll for location updates every 15 seconds
  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 15000);
    return () => clearInterval(interval);
  }, [fetchTracking]);

  const formatTime = (isoStr: string) => {
    return new Date(isoStr).toLocaleString("en-IE", { dateStyle: "short", timeStyle: "short" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <span className="ml-2 text-muted-foreground">Loading tracking...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <Car className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold text-foreground">Tracking Unavailable</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error || "This tracking link is no longer active."}</p>
        </div>
      </div>
    );
  }

  const { journeyStatus } = data;

  // COMPLETED - Show trip complete screen
  if (journeyStatus === "completed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-foreground">Trip Completed</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Thank you for traveling with Redmond Chauffeur Drive.
          </p>
          {data.completionTimestamp && (
            <p className="mt-1 text-xs text-muted-foreground">
              Arrived at {formatTime(data.completionTimestamp)}
            </p>
          )}

          {/* Google Review CTA */}
          <div className="mt-6 rounded-xl border border-accent/20 bg-accent/5 p-5">
            <Star className="mx-auto h-8 w-8 text-accent" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">How was your journey?</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              We would love to hear your feedback. Your review helps us provide the best service.
            </p>
            <a
              href="https://g.page/r/YOUR_GOOGLE_REVIEW_LINK/review"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90"
            >
              <Star className="h-4 w-4" />
              Leave a Google Review
            </a>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">This tracking link is now inactive.</p>
        </div>
      </div>
    );
  }

  // IDLE - Driver hasn't started yet
  if (journeyStatus === "idle") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold text-foreground">Your Booking is Confirmed</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your driver has not started the journey yet. This page will update automatically when they are on the way.
          </p>
          {data.date && (
            <p className="mt-3 text-sm text-foreground">
              Scheduled: <span className="font-medium">{data.date}{data.time ? ` at ${data.time}` : ""}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  // EN-ROUTE or ON-BOARD - Active tracking
  const isOnBoard = journeyStatus === "on-board";
  const hasLocation = data.lat && data.lng;

  // Google Maps embed URL for live location
  const mapEmbedUrl = hasLocation
    ? `https://www.google.com/maps?q=${data.lat},${data.lng}&z=15&output=embed`
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg">
        {/* Live Map */}
        {mapEmbedUrl ? (
          <div className="relative h-[50vh] w-full bg-muted">
            <iframe
              src={mapEmbedUrl}
              className="h-full w-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Driver Location"
            />
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              {isOnBoard ? "Journey In Progress" : "Driver En Route"}
            </div>
          </div>
        ) : (
          <div className="flex h-[30vh] items-center justify-center bg-muted">
            <div className="text-center">
              <Navigation className="mx-auto h-8 w-8 animate-pulse text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Acquiring driver location...</p>
            </div>
          </div>
        )}

        {/* Journey Info */}
        <div className="px-4 py-5">
          {/* Status Banner */}
          <div className={`mb-4 rounded-xl p-4 text-center ${isOnBoard ? "border-2 border-blue-400 bg-blue-50" : "border-2 border-green-400 bg-green-50"}`}>
            <div className={`flex items-center justify-center gap-2 ${isOnBoard ? "text-blue-700" : "text-green-700"}`}>
              {isOnBoard ? <Car className="h-5 w-5" /> : <Navigation className="h-5 w-5 animate-pulse" />}
              <span className="text-lg font-semibold">
                {isOnBoard ? "You are on your way!" : "Your driver is on the way"}
              </span>
            </div>
            {!isOnBoard && (
              <p className="mt-1 text-sm text-green-600">
                {data.driverName || "Your chauffeur"} is heading to your pickup in a {data.vehicleType}
              </p>
            )}
            {isOnBoard && data.pickupTimestamp && (
              <p className="mt-1 text-sm text-blue-600">
                Picked up at {formatTime(data.pickupTimestamp)}
              </p>
            )}
          </div>

          {/* Driver Details */}
          <div className="mb-4 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{data.driverName || "Your Chauffeur"}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{data.vehicleType}</span>
                  {data.vehicleReg && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                      <span className="font-mono">{data.vehicleReg}</span>
                    </>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">Licensed SPSV Operator</p>
              </div>
            </div>
          </div>

          {/* Route */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <div className="h-2 w-2 rounded-full bg-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pickup</p>
                  <p className="text-sm font-medium text-foreground">{data.pickupAddress}</p>
                </div>
              </div>
              <div className="ml-2 border-l-2 border-dashed border-border py-0.5 pl-5" />
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10">
                  <div className="h-2 w-2 rounded-full bg-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Destination</p>
                  <p className="text-sm font-medium text-foreground">{data.destAddress}</p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Powered by Redmond Chauffeur Drive
          </p>
        </div>
      </div>
    </div>
  );
}
