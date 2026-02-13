"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Navigation, MapPin, Clock, Car, Users, Phone, Calendar,
  Loader2, XCircle, CheckCircle2, ExternalLink, MessageCircle,
  Play, UserCheck, Flag, Shield, ArrowLeft,
} from "lucide-react";

interface BookingData {
  [key: string]: string;
}

type JourneyStage = "idle" | "en-route" | "on-board" | "completed";

export default function DriverDispatchPage() {
  const params = useParams();
  const router = useRouter();
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

  useEffect(() => {
    if ((journeyStage === "en-route" || journeyStage === "on-board") && navigator.geolocation) {
      locationWatchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setDriverLocation(loc);
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

    const phone = booking["Phone"]?.replace(/\s/g, "").replace(/^0/, "353") || "";
    const clientName = booking["Customer Name"] || "there";
    const trackingUrl = `${window.location.origin}/track/${bookingId}`;
    const message = `Hi ${clientName},\n\nYour chauffeur ${driverName} is on the way in a ${vehicleType}${vehicleReg ? ` (${vehicleReg})` : ""}.\n\nTrack your driver live here:\n${trackingUrl}\n\nRedmond Chauffeur Drive`;
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  const handleClientOnBoard = async () => {
    const now = new Date().toISOString();
    setPickupTime(now);
    setJourneyStage("on-board");
    await updateDispatch({
      "Journey Status": "on-board",
      "Pickup Timestamp": now,
    });
  };

  const handleCompleteJob = async () => {
    if (!window.confirm("Mark this job as completed?")) return;
    const now = new Date().toISOString();
    setCompletionTime(now);
    setJourneyStage("completed");

    let actualDuration = "";
    if (pickupTime) {
      const mins = Math.round((Date.now() - new Date(pickupTime).getTime()) / 60000);
      actualDuration = String(mins);
    }

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
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading dispatch...</span>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-bold text-foreground">Dispatch Not Found</h1>
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
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">Driver Dispatch</h1>
            <p className="text-sm text-muted-foreground">
              Booking <span className="font-mono">{bookingId}</span>
            </p>
          </div>
        </div>

        {/* Stage Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {stages.map((stage, idx) => (
              <React.Fragment key={stage.key}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    idx <= currentStageIdx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {idx < currentStageIdx ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className={`text-[10px] ${idx <= currentStageIdx ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                    {stage.label}
                  </span>
                </div>
                {idx < stages.length - 1 && (
                  <div className={`mx-1 mb-4 h-0.5 flex-1 ${idx < currentStageIdx ? "bg-primary" : "bg-muted"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-4 rounded-xl border border-border bg-card p-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{booking["Customer Name"]}</p>
              {customerPhone && (
                <a href={telLink} className="flex items-center gap-1 text-sm text-primary">
                  <Phone className="h-3 w-3" />
                  Call Client: {customerPhone}
                </a>
              )}
            </div>
            {booking["Pax"] && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {booking["Pax"]} passenger{Number.parseInt(booking["Pax"]) !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>

        {/* Journey Details */}
        <div className="mb-4 rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Journey</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-400/10">
                <MapPin className="h-3 w-3 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="text-sm font-medium text-foreground">{pickupAddress}</p>
              </div>
            </div>
            <div className="ml-3 border-l-2 border-dashed border-muted py-1 pl-6">
              <p className="text-xs text-muted-foreground">{booking["Distance KM"]} km &middot; {booking["Travel Time"]} mins est.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-3 w-3 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Destination</p>
                <p className="text-sm font-medium text-foreground">{destAddress}</p>
              </div>
            </div>
          </div>

          {(booking["Date"] || booking["Time"]) && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{booking["Date"]}{booking["Time"] ? ` at ${booking["Time"]}` : ""}</span>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{booking["Vehicle Type"]}</span>
            </div>
            <span className="font-semibold text-foreground">{"\u20AC"}{displayFare}</span>
          </div>
        </div>

        {/* Journey Timestamps */}
        {(pickupTime || completionTime) && (
          <div className="mb-4 rounded-xl border border-border bg-card p-4">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Journey Log</h2>
            <div className="space-y-2 text-sm">
              {pickupTime && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client On Board</span>
                  <span className="text-foreground">{formatTime(pickupTime)}</span>
                </div>
              )}
              {journeyStage === "on-board" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Elapsed</span>
                  <span className="font-medium text-primary">{elapsedMinutes} min</span>
                </div>
              )}
              {completionTime && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Job Completed</span>
                  <span className="text-foreground">{formatTime(completionTime)}</span>
                </div>
              )}
              {completionTime && pickupTime && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Duration</span>
                  <span className="font-medium text-foreground">
                    {Math.round((new Date(completionTime).getTime() - new Date(pickupTime).getTime()) / 60000)} mins
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {journeyStage === "idle" && (
            <>
              <button type="button" onClick={handleStartJourney} disabled={updating} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                Message Client / Start Journey
              </button>
              <a href={googleMapsPickupUrl} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary">
                <Navigation className="h-4 w-4" />
                Navigate to Pickup
              </a>
            </>
          )}

          {journeyStage === "en-route" && (
            <>
              <div className="rounded-lg bg-blue-400/10 p-3 text-center">
                <div className="flex items-center justify-center gap-2 text-blue-400">
                  <Navigation className="h-4 w-4" />
                  <span className="text-sm font-medium">En Route to Client</span>
                </div>
                <p className="mt-1 text-xs text-blue-400/80">Client has been notified and can track your location</p>
              </div>
              <a href={googleMapsPickupUrl} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary">
                <Navigation className="h-4 w-4" />
                Navigate to Pickup
              </a>
              <button type="button" onClick={handleClientOnBoard} disabled={updating} className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                Client On Board
              </button>
            </>
          )}

          {journeyStage === "on-board" && (
            <>
              <div className="rounded-lg bg-green-400/10 p-3 text-center">
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <Car className="h-4 w-4" />
                  <span className="text-sm font-medium">Journey In Progress</span>
                </div>
                <p className="mt-1 text-xs text-green-400/80">
                  Client on board since {pickupTime ? formatTime(pickupTime) : "--"} &middot; {elapsedMinutes} min elapsed
                </p>
              </div>
              <a href={googleMapsDestUrl} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary">
                <Navigation className="h-4 w-4" />
                Navigate to Destination
              </a>
              <button type="button" onClick={handleCompleteJob} disabled={updating} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
                Complete Job
              </button>
            </>
          )}

          {journeyStage === "completed" && (
            <div className="rounded-lg bg-muted p-4 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-green-400" />
              <p className="mt-2 font-medium text-foreground">Job Completed</p>
              <p className="mt-1 text-xs text-muted-foreground">
                All journey data has been recorded. The client tracking link has been deactivated.
              </p>
            </div>
          )}
        </div>

        {/* Driver License Notice */}
        {journeyStage !== "completed" && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Your SPSV license details are visible to the client via the tracking link.</span>
          </div>
        )}
      </div>
    </div>
  );
}
