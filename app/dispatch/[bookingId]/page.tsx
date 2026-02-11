"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Navigation, MapPin, Clock, Car, Users, Phone, Calendar,
  Loader2, XCircle, CheckCircle2, ExternalLink, MessageCircle,
  Play, UserCheck, Flag, Shield,
} from "lucide-react";

interface BookingData {
  [key: string]: string;
}

type JourneyStage = "idle" | "en-route" | "on-board" | "completed";

export default function DriverDispatchPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [journeyStage, setJourneyStage] = useState<JourneyStage>("idle");
  const [updating, setUpdating] = useState(false);
  const [pickupTime, setPickupTime] = useState<string | null>(null);
  const [completionTime, setCompletionTime] = useState<string | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const locationWatchRef = useRef<number | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBooking = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const found = data.bookings?.find((b: BookingData) => b["Request ID"] === bookingId);
      if (!found) throw new Error("Booking not found");
      setBooking(found);

      // Restore journey state from sheet data
      const savedStage = found["Journey Status"] as JourneyStage;
      if (savedStage && ["idle", "en-route", "on-board", "completed"].includes(savedStage)) {
        setJourneyStage(savedStage);
      }
      if (found["Pickup Timestamp"]) setPickupTime(found["Pickup Timestamp"]);
      if (found["Completion Timestamp"]) setCompletionTime(found["Completion Timestamp"]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load booking");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // Start GPS tracking when en-route or on-board
  useEffect(() => {
    if ((journeyStage === "en-route" || journeyStage === "on-board") && navigator.geolocation) {
      locationWatchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setDriverLocation(loc);
          // Send location to server (throttled by the watch itself)
          if (booking) {
            fetch("/api/dispatch/update", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                requestId: bookingId,
                rowIndex: booking["_rowIndex"],
                updates: { "Driver Lat": String(loc.lat), "Driver Lng": String(loc.lng) },
              }),
            }).catch(() => {});
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
    }
    return () => {
      if (locationWatchRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchRef.current);
        locationWatchRef.current = null;
      }
    };
  }, [journeyStage, booking, bookingId]);

  // Elapsed time counter when on-board
  useEffect(() => {
    if (journeyStage === "on-board" && pickupTime) {
      elapsedRef.current = setInterval(() => {
        const start = new Date(pickupTime).getTime();
        const now = Date.now();
        setElapsedMinutes(Math.floor((now - start) / 60000));
      }, 10000);
    }
    return () => {
      if (elapsedRef.current) {
        clearInterval(elapsedRef.current);
        elapsedRef.current = null;
      }
    };
  }, [journeyStage, pickupTime]);

  const updateDispatch = async (updates: Record<string, string>) => {
    if (!booking) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/dispatch/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: bookingId,
          rowIndex: booking["_rowIndex"],
          updates,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setUpdating(false);
    }
  };

  // Stage 1: Start Journey - driver heads to client
  const handleStartJourney = async () => {
    if (!booking) return;
    const driverName = booking["Driver Name"] || "Your chauffeur";
    const vehicleReg = booking["Vehicle Reg"] || "";
    const vehicleType = booking["Vehicle Type"] || "";

    setJourneyStage("en-route");
    await updateDispatch({
      "Journey Status": "en-route",
      "Driver Name": driverName,
      "Vehicle Reg": vehicleReg,
    });

    // Generate WhatsApp message to client
    const phone = booking["Phone"]?.replace(/\s/g, "").replace(/^0/, "353") || "";
    const clientName = booking["Customer Name"] || "there";
    const trackingUrl = `${window.location.origin}/track/${bookingId}`;
    const message = `Hi ${clientName},\n\nYour chauffeur ${driverName} is on the way in a ${vehicleType}${vehicleReg ? ` (${vehicleReg})` : ""}.\n\nTrack your driver live here:\n${trackingUrl}\n\nRedmond Chauffeur Drive`;
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  // Stage 2: Client On Board - starts the "meter"
  const handleClientOnBoard = async () => {
    const now = new Date().toISOString();
    setPickupTime(now);
    setJourneyStage("on-board");
    await updateDispatch({
      "Journey Status": "on-board",
      "Pickup Timestamp": now,
    });
  };

  // Stage 3: Complete Job
  const handleCompleteJob = async () => {
    if (!window.confirm("Mark this job as completed?")) return;
    const now = new Date().toISOString();
    setCompletionTime(now);
    setJourneyStage("completed");

    // Calculate actual duration
    let actualDuration = "";
    if (pickupTime) {
      const mins = Math.round((Date.now() - new Date(pickupTime).getTime()) / 60000);
      actualDuration = String(mins);
    }

    // Calculate actual distance from original estimate (GPS distance tracking is complex,
    // so we use the original estimate -- can be enhanced later with waypoint tracking)
    const actualKm = booking?.["Distance KM"] || "";

    await updateDispatch({
      "Journey Status": "completed",
      "Status": "Completed",
      "Completion Timestamp": now,
      "Actual KM Driven": actualKm,
      "Actual Duration": actualDuration,
      "Driver Lat": "",
      "Driver Lng": "",
    });

    // Send thank-you WhatsApp with Google Review link
    if (booking) {
      const phone = booking["Phone"]?.replace(/\s/g, "").replace(/^0/, "353") || "";
      const clientName = booking["Customer Name"] || "there";
      const reviewUrl = "https://g.page/r/CdsSZeCTlq7_EBM/review";
      const message = `Hi ${clientName},\n\nThank you for traveling with Redmond Chauffeur Drive. We hope you had an excellent journey.\n\nIf you have a moment, we would really appreciate a Google review. It helps us continue to provide the best service:\n${reviewUrl}\n\nWe look forward to welcoming you again.\n\nRedmond Chauffeur Drive`;
      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank");
    }
  };

  const formatTime = (isoStr: string) => {
    return new Date(isoStr).toLocaleString("en-IE", { dateStyle: "short", timeStyle: "short" });
  };

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
  const googleMapsDestUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destAddress)}`;
  const customerPhone = booking["Phone"] || "";
  const telLink = `tel:${customerPhone.replace(/\s/g, "")}`;
  const displayFare = booking["Owner Fare"] || booking["Adjusted Fare"] || booking["NTA Max Fare"] || "0";

  // Stage progress indicator
  const stages = [
    { key: "idle", label: "Ready" },
    { key: "en-route", label: "En Route" },
    { key: "on-board", label: "On Board" },
    { key: "completed", label: "Completed" },
  ];
  const currentStageIdx = stages.findIndex((s) => s.key === journeyStage);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-6">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="font-serif text-2xl font-bold text-foreground">Driver Dispatch</h1>
          <p className="text-sm text-muted-foreground">
            Booking <span className="font-mono font-bold text-accent">{bookingId}</span>
          </p>
        </div>

        {/* Stage Progress Bar */}
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            {stages.map((stage, idx) => (
              <React.Fragment key={stage.key}>
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      idx <= currentStageIdx
                        ? idx === currentStageIdx
                          ? "bg-accent text-accent-foreground"
                          : "bg-green-600 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {idx < currentStageIdx ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className={`mt-1 text-[10px] ${idx <= currentStageIdx ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                    {stage.label}
                  </span>
                </div>
                {idx < stages.length - 1 && (
                  <div className={`mx-1 h-0.5 flex-1 rounded ${idx < currentStageIdx ? "bg-green-600" : "bg-muted"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-4 rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Customer</h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{booking["Customer Name"]}</span>
              {customerPhone && (
                <a
                  href={telLink}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call Client
                </a>
              )}
            </div>
            {booking["Pax"] && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {booking["Pax"]} passenger{Number.parseInt(booking["Pax"]) !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>

        {/* Journey Details */}
        <div className="mb-4 rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Journey</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100">
                <MapPin className="h-3.5 w-3.5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="text-sm font-medium text-foreground">{pickupAddress}</p>
              </div>
            </div>
            <div className="ml-3 border-l-2 border-dashed border-border py-1 pl-6">
              <p className="text-xs text-muted-foreground">{booking["Distance KM"]} km &middot; {booking["Travel Time"]} mins est.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10">
                <MapPin className="h-3.5 w-3.5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Destination</p>
                <p className="text-sm font-medium text-foreground">{destAddress}</p>
              </div>
            </div>
          </div>

          {(booking["Date"] || booking["Time"]) && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2 text-sm">
              <Calendar className="h-4 w-4 text-accent" />
              <span className="text-foreground">{booking["Date"]}{booking["Time"] ? ` at ${booking["Time"]}` : ""}</span>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Car className="h-4 w-4" />
              <span>{booking["Vehicle Type"]}</span>
            </div>
            <span className="text-lg font-bold text-accent">{"\u20AC"}{displayFare}</span>
          </div>
        </div>

        {/* Journey Timestamps (when active) */}
        {(pickupTime || completionTime) && (
          <div className="mb-4 rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Journey Log</h3>
            <div className="space-y-2 text-sm">
              {pickupTime && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Client On Board</span>
                  <span className="font-medium text-foreground">{formatTime(pickupTime)}</span>
                </div>
              )}
              {journeyStage === "on-board" && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Elapsed</span>
                  <span className="font-mono font-medium text-accent">{elapsedMinutes} min</span>
                </div>
              )}
              {completionTime && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Job Completed</span>
                  <span className="font-medium text-foreground">{formatTime(completionTime)}</span>
                </div>
              )}
              {completionTime && pickupTime && (
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span className="text-muted-foreground">Total Duration</span>
                  <span className="font-bold text-foreground">
                    {Math.round((new Date(completionTime).getTime() - new Date(pickupTime).getTime()) / 60000)} mins
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons - Stage Based */}
        <div className="space-y-3">
          {/* STAGE: IDLE - Ready to start */}
          {journeyStage === "idle" && (
            <>
              <button
                type="button"
                onClick={handleStartJourney}
                disabled={updating}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-green-600 px-6 py-4 text-base font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {updating ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />}
                Message Client / Start Journey
              </button>
              <a
                href={googleMapsPickupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-accent bg-transparent px-6 py-3 text-sm font-semibold text-accent hover:bg-accent/5"
              >
                <Navigation className="h-4 w-4" />
                Navigate to Pickup
              </a>
            </>
          )}

          {/* STAGE: EN-ROUTE - Heading to client */}
          {journeyStage === "en-route" && (
            <>
              <div className="rounded-xl border-2 border-green-500 bg-green-50 p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <Navigation className="h-5 w-5 animate-pulse" />
                  <span className="font-semibold">En Route to Client</span>
                </div>
                <p className="mt-1 text-xs text-green-600">Client has been notified and can track your location</p>
              </div>
              <a
                href={googleMapsPickupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 text-base font-semibold text-accent-foreground hover:bg-accent/90"
              >
                <Navigation className="h-5 w-5" />
                Navigate to Pickup
              </a>
              <button
                type="button"
                onClick={handleClientOnBoard}
                disabled={updating}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-6 py-4 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {updating ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserCheck className="h-5 w-5" />}
                Client On Board
              </button>
            </>
          )}

          {/* STAGE: ON-BOARD - Client is in the vehicle */}
          {journeyStage === "on-board" && (
            <>
              <div className="rounded-xl border-2 border-blue-500 bg-blue-50 p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-blue-700">
                  <Car className="h-5 w-5" />
                  <span className="font-semibold">Journey In Progress</span>
                </div>
                <p className="mt-1 text-xs text-blue-600">
                  Client on board since {pickupTime ? formatTime(pickupTime) : "--"} &middot; {elapsedMinutes} min elapsed
                </p>
              </div>
              <a
                href={googleMapsDestUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 text-base font-semibold text-accent-foreground hover:bg-accent/90"
              >
                <Navigation className="h-5 w-5" />
                Navigate to Destination
              </a>
              <button
                type="button"
                onClick={handleCompleteJob}
                disabled={updating}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-red-600 px-6 py-4 text-base font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {updating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Flag className="h-5 w-5" />}
                Complete Job
              </button>
            </>
          )}

          {/* STAGE: COMPLETED */}
          {journeyStage === "completed" && (
            <div className="rounded-xl border-2 border-black bg-black p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-white" />
              <h3 className="mt-3 text-lg font-bold text-white">Job Completed</h3>
              <p className="mt-1 text-sm text-gray-300">
                All journey data has been recorded. The client tracking link has been deactivated.
              </p>
            </div>
          )}
        </div>

        {/* Driver License Notice */}
        {journeyStage !== "completed" && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">
            <Shield className="h-4 w-4 shrink-0" />
            <span>Your SPSV license details are visible to the client via the tracking link.</span>
          </div>
        )}
      </div>
    </div>
  );
}
