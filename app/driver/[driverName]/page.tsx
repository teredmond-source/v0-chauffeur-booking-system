"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Navigation, MapPin, Clock, Car, Users, Phone, Calendar,
  Loader2, XCircle, CheckCircle2, MessageCircle,
  Play, UserCheck, Flag, RefreshCw, ChevronDown, ChevronUp,
  Shield, Download, X,
} from "lucide-react";

interface BookingData {
  [key: string]: string;
}

type JourneyStage = "idle" | "en-route" | "on-board" | "completed";

function formatPickupDate(dateStr: string): string {
  if (!dateStr) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const day = parseInt(parts[2], 10);
    const month = months[parseInt(parts[1], 10) - 1] || parts[1];
    const year = parts[0];
    return `${day} ${month} ${year}`;
  }
  return dateStr;
}

function formatPickupTime(timeStr: string): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;
    const minStr = minutes === 0 ? "" : `.${minutes.toString().padStart(2, "0")}`;
    return `${hours}${minStr}${ampm}`;
  }
  return timeStr;
}

function formatTimestamp(isoStr: string) {
  return new Date(isoStr).toLocaleString("en-IE", { dateStyle: "short", timeStyle: "short" });
}

function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  const [y, m, d] = dateStr.split("-").map(Number);
  return y === today.getFullYear() && m === today.getMonth() + 1 && d === today.getDate();
}

function isFuture(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split("-").map(Number);
  const bookingDate = new Date(y, m - 1, d);
  return bookingDate > today;
}

// Haversine distance calculation in metres
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function DriverDashboardPage() {
  const params = useParams();
  const rawDriverName = decodeURIComponent(params.driverName as string).replace(/-/g, " ");

  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [driverInfo, setDriverInfo] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

  const [isIOS, setIsIOS] = useState(false);

  // Set driver-specific manifest so PWA opens this page, not the admin dashboard
  useEffect(() => {
    const slug = (params.driverName as string);
    const existing = document.querySelector('link[rel="manifest"]');
    if (existing) existing.remove();
    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = `/driver/${slug}/manifest.json`;
    document.head.appendChild(link);
  }, [params.driverName]);

  // Register service worker and detect platform
  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Detect platform
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(ios);

    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (!isStandalone) {
      setShowInstallBanner(true);
    }

    // Listen for Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [updatingJob, setUpdatingJob] = useState<string | null>(null);
  const [elapsedMap, setElapsedMap] = useState<Record<string, number>>({});
  const locationWatchRef = useRef<number | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Driver GPS position for proximity check
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [destCoords, setDestCoords] = useState<Record<string, { lat: number; lng: number }>>({});
  const [proximityOverride, setProximityOverride] = useState<Record<string, boolean>>({});

  const fetchMyJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const allBookings: BookingData[] = data.bookings || [];
      const searchName = rawDriverName.toLowerCase().trim();
      const myJobs = allBookings.filter((b) => {
        const driverName = (b["Driver Name"] || "").toLowerCase().trim();
        // Skip bookings with no driver assigned
        if (!driverName) return false;
        // Skip cancelled bookings
        const status = (b["Status"] || "").toLowerCase();
        if (status === "cancelled" || status === "rejected") return false;
        // Match driver name
        return driverName === searchName || driverName.includes(searchName) || searchName.includes(driverName);
      });
      // Sort by pickup date/time
      myJobs.sort((a, b) => {
        const toMin = (ds: string, ts: string) => {
          if (!ds) return 999999999;
          const [y, m, d] = ds.split("-").map(Number);
          const t = (ts || "0:00").trim();
          const [h, min] = t.split(":").map(Number);
          return ((y * 10000 + m * 100 + d) * 10000) + ((h || 0) * 60 + (min || 0));
        };
        return toMin(a["Date"], a["Time"]) - toMin(b["Date"], b["Time"]);
      });
      setBookings(myJobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [rawDriverName]);

  useEffect(() => {
    fetchMyJobs();
    // Auto-refresh every 30 seconds
    refreshTimerRef.current = setInterval(fetchMyJobs, 30000);

    // Fetch driver profile info (license photo, NTA ID, etc.)
    fetch("/api/drivers")
      .then((r) => r.json())
      .then((data) => {
        const drivers = data.drivers || [];
        const searchName = rawDriverName.toLowerCase().trim();
        const me = drivers.find((d: Record<string, string>) => {
          const firstName = (d["First Name"] || "").toLowerCase();
          const name = (d["Name"] || "").toLowerCase();
          const fullName = (firstName + " " + (d["Last Name"] || d["Surname"] || d["Name"] || "")).trim().toLowerCase();
          return fullName === searchName || fullName.includes(searchName) || searchName.includes(fullName)
            || firstName === searchName || name === searchName;
        });
        if (me) setDriverInfo(me);
      })
      .catch(() => {});

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [fetchMyJobs, rawDriverName]);

  // Track elapsed time for on-board jobs
  useEffect(() => {
    const onBoardJobs = bookings.filter((b) => b["Journey Status"] === "on-board" && b["Pickup Timestamp"]);
    if (onBoardJobs.length > 0) {
      elapsedRef.current = setInterval(() => {
        const map: Record<string, number> = {};
        for (const job of onBoardJobs) {
          const start = new Date(job["Pickup Timestamp"]).getTime();
          map[job["Request ID"]] = Math.floor((Date.now() - start) / 60000);
        }
        setElapsedMap((prev) => ({ ...prev, ...map }));
      }, 10000);
    }
    return () => {
      if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null; }
    };
  }, [bookings]);

  // GPS tracking for active jobs
  useEffect(() => {
    const activeJob = bookings.find(
      (b) => b["Journey Status"] === "en-route" || b["Journey Status"] === "on-board"
    );
    if (activeJob && navigator.geolocation) {
      locationWatchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setDriverPos(loc);
          fetch("/api/dispatch/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requestId: activeJob["Request ID"],
              rowIndex: activeJob["_rowIndex"],
              updates: { "Driver Lat": String(loc.lat), "Driver Lng": String(loc.lng) },
            }),
          }).catch(() => {});
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
  }, [bookings]);

  // Geocode destination for on-board jobs (for proximity check)
  useEffect(() => {
    const onBoardJobs = bookings.filter((b) => b["Journey Status"] === "on-board");
    onBoardJobs.forEach(async (job) => {
      const reqId = job["Request ID"];
      if (destCoords[reqId]) return; // Already geocoded
      const destAddress = job["Destination Address"] || job["Destination Eircode"] || "";
      if (!destAddress) return;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destAddress)}&limit=1`,
          { headers: { "User-Agent": "RCDChauffeurApp/1.0" } }
        );
        const results = await res.json();
        if (results.length > 0) {
          setDestCoords((prev) => ({
            ...prev,
            [reqId]: { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) },
          }));
        }
      } catch {
        // Geocoding failed -- allow override
      }
    });
  }, [bookings, destCoords]);

  const updateDispatch = async (booking: BookingData, updates: Record<string, string>) => {
    setUpdatingJob(booking["Request ID"]);
    try {
      const res = await fetch("/api/dispatch/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: booking["Request ID"],
          rowIndex: booking["_rowIndex"],
          updates,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchMyJobs();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setUpdatingJob(null);
    }
  };

  const handleStartJourney = async (booking: BookingData) => {
    const driverName = booking["Driver Name"] || rawDriverName;
    const vehicleReg = booking["Vehicle Reg"] || booking["Registration"] || booking["Reg"] || "";
    const vehicleType = booking["Vehicle Type"] || "";
    const ntaId = driverInfo["NTA Driver ID"] || "";

    await updateDispatch(booking, {
      "Journey Status": "en-route",
      "Driver Name": driverName,
      "Vehicle Reg": vehicleReg,
    });

    // Build license photo link from driver profile
    const photoUrl = driverInfo["Profile Photo"] || "";
    let licenseLink = "";
    if (photoUrl) {
      const driveMatch = photoUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (driveMatch) {
        licenseLink = `https://drive.google.com/file/d/${driveMatch[1]}/view`;
      } else {
        licenseLink = photoUrl;
      }
    }

    const rawPhone = booking["Phone"]?.replace(/\s/g, "") || "";
    // Normalize Irish numbers: ensure we have 353 prefix
    const phone = rawPhone.startsWith("353") ? rawPhone 
      : rawPhone.startsWith("0") ? rawPhone.replace(/^0/, "353")
      : rawPhone.startsWith("8") ? `353${rawPhone}` 
      : rawPhone;
    const clientName = booking["Customer Name"] || "there";
    const bookingId = booking["Request ID"];
    const trackingUrl = `${window.location.origin}/track/${bookingId}`;

    const pickupTime = booking["Time"] || "";
    let message = `Hi ${clientName},\n\nYour chauffeur *${driverName}* is on the way.`;
    if (pickupTime) {
      message += `\n\nScheduled pickup: *${pickupTime}*`;
      message += `\nYour driver will arrive a few minutes early and will be waiting for you at the pickup point.`;
    }
    if (vehicleType || vehicleReg) {
      message += `\n\nVehicle: ${vehicleType}${vehicleReg ? `\nRegistration: *${vehicleReg}*` : ""}`;
    }
    if (ntaId) {
      message += `\nNTA License: ${ntaId}`;
    }
    if (licenseLink) {
      message += `\n\nView driver license:\n${licenseLink}`;
    }
    message += `\n\nTrack your driver live here:\n${trackingUrl}`;
    message += `\n\nRedmond Chauffeur Drive\nTel: 085 229 7379`;

    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  const handleClientOnBoard = async (booking: BookingData) => {
    // Open the Google Maps window BEFORE the async call to avoid popup blocker
    const destAddress = booking["Destination Address"] || booking["Destination Eircode"] || "";
    let mapsWindow: Window | null = null;
    if (destAddress) {
      const destUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destAddress)}&travelmode=driving`;
      mapsWindow = window.open(destUrl, "_blank");
    }

    const now = new Date().toISOString();
    try {
      await updateDispatch(booking, {
        "Journey Status": "on-board",
        "Pickup Timestamp": now,
      });
    } catch {
      // If the dispatch update fails, close the maps window if it opened
      if (mapsWindow) mapsWindow.close();
      throw new Error("Failed to update journey status");
    }
  };

  const handleCompleteJob = async (booking: BookingData) => {
    if (!window.confirm("Mark this job as completed?")) return;
    const now = new Date().toISOString();
    let actualDuration = "";
    if (booking["Pickup Timestamp"]) {
      const mins = Math.round((Date.now() - new Date(booking["Pickup Timestamp"]).getTime()) / 60000);
      actualDuration = String(mins);
    }
    const actualKm = booking["Distance KM"] || "";

    await updateDispatch(booking, {
      "Journey Status": "completed",
      "Status": "Completed",
      "Completion Timestamp": now,
      "Actual KM Driven": actualKm,
      "Actual Duration": actualDuration,
      "Driver Lat": "",
      "Driver Lng": "",
    });

    const rawPhone2 = booking["Phone"]?.replace(/\s/g, "") || "";
    const phone = rawPhone2.startsWith("353") ? rawPhone2 
      : rawPhone2.startsWith("0") ? rawPhone2.replace(/^0/, "353")
      : rawPhone2.startsWith("8") ? `353${rawPhone2}` 
      : rawPhone2;
    const clientName = booking["Customer Name"] || "there";
    const reviewUrl = "https://g.page/r/CdsSZeCTlq7_EBM/review";
    const message = `Hi ${clientName},\n\nThank you for traveling with Redmond Chauffeur Drive. We hope you had an excellent journey.\n\nIf you have a moment, we would really appreciate a Google review. It helps us continue to provide the best service:\n${reviewUrl}\n\nWe look forward to welcoming you again.\n\nRedmond Chauffeur Drive`;
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  const getStageInfo = (booking: BookingData) => {
    const journeyStatus = (booking["Journey Status"] || "").toLowerCase();
    const bookingStatus = (booking["Status"] || "").toLowerCase();
    switch (journeyStatus) {
      case "en-route": return { label: "En Route", color: "bg-blue-400/10 text-blue-400" };
      case "on-board": return { label: "On Board", color: "bg-green-400/10 text-green-400" };
      case "completed": return { label: "Completed", color: "bg-muted text-muted-foreground" };
      default:
        if (bookingStatus === "completed") return { label: "Completed", color: "bg-muted text-muted-foreground" };
        if (bookingStatus === "confirmed") return { label: "Assigned", color: "bg-accent/10 text-accent" };
        if (bookingStatus === "quoted") return { label: "Quoted", color: "bg-purple-400/10 text-purple-400" };
        return { label: "Pending", color: "bg-amber-400/10 text-amber-400" };
    }
  };

  // Categorise jobs
  const todayJobs = bookings.filter((b) => isToday(b["Date"]) && b["Journey Status"] !== "completed");
  const activeJobs = bookings.filter((b) => b["Journey Status"] === "en-route" || b["Journey Status"] === "on-board");
  const upcomingJobs = bookings.filter((b) => isFuture(b["Date"]) && !isToday(b["Date"]) && b["Journey Status"] !== "completed");
  const completedJobs = bookings.filter((b) => b["Journey Status"] === "completed" || (b["Status"] || "").toLowerCase() === "completed");
  const pendingJobs = bookings.filter(
    (b) => b["Journey Status"] !== "completed" && (b["Status"] || "").toLowerCase() !== "completed"
      && b["Journey Status"] !== "en-route" && b["Journey Status"] !== "on-board"
      && !isToday(b["Date"]) && !isFuture(b["Date"])
  );

  if (loading) {
    return (
      <div className="theme-driver flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading your jobs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="theme-driver flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-bold text-foreground">Error Loading Jobs</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const renderJobCard = (booking: BookingData) => {
    const requestId = booking["Request ID"];
  const stage = (booking["Journey Status"] as JourneyStage) || "idle";
  const stageInfo = getStageInfo(booking);
    const isExpanded = expandedJob === requestId;
    const isUpdating = updatingJob === requestId;
    const pickupAddress = booking["Origin Address"] || booking["Pickup Eircode"] || "";
    const destAddress = booking["Destination Address"] || booking["Destination Eircode"] || "";
    const googleMapsPickupUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pickupAddress)}`;
    const googleMapsDestUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destAddress)}`;
    const customerPhone = booking["Phone"] || "";
    const telLink = `tel:${customerPhone.replace(/\s/g, "")}`;
    const displayFare = booking["Owner Fare"] || booking["Adjusted Fare"] || booking["NTA Max Fare"] || "0";
    const elapsed = elapsedMap[requestId] || 0;

    return (
      <div key={requestId} className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Job Summary - always visible */}
        <button
          type="button"
          onClick={() => setExpandedJob(isExpanded ? null : requestId)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${stageInfo.color}`}>
                {stageInfo.label}
              </span>
              {isToday(booking["Date"]) && stage !== "completed" && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  TODAY
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-semibold text-foreground">{booking["Customer Name"]}</p>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatPickupDate(booking["Date"])} at {formatPickupTime(booking["Time"])}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{"\u20AC"}{displayFare}</span>
            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>

        {/* Expanded Job Details */}
        {isExpanded && (
          <div className="border-t border-border px-4 pb-4 pt-3">
            {/* Route */}
            <div className="mb-3 space-y-2">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-400/10">
                  <MapPin className="h-3 w-3 text-green-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Pickup</p>
                  <p className="text-xs font-medium text-foreground">{pickupAddress}</p>
                </div>
              </div>
              <div className="ml-2.5 border-l-2 border-dashed border-muted py-0.5 pl-4">
                <p className="text-[10px] text-muted-foreground">
                  {booking["Distance KM"] && `${booking["Distance KM"]} km`}
                  {booking["Travel Time"] && ` - ${booking["Travel Time"]} mins est.`}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-3 w-3 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Destination</p>
                  <p className="text-xs font-medium text-foreground">{destAddress}</p>
                </div>
              </div>
            </div>

            {/* Vehicle & Pax */}
            <div className="mb-3 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-foreground">{booking["Vehicle Type"]}</span>
              </div>
              {booking["Pax"] && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {booking["Pax"]} pax
                </div>
              )}
            </div>

            {/* Journey Log */}
            {(booking["Pickup Timestamp"] || booking["Completion Timestamp"]) && (
              <div className="mb-3 rounded-lg border border-border p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Journey Log</p>
                <div className="space-y-1 text-xs">
                  {booking["Pickup Timestamp"] && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Client On Board</span>
                      <span className="text-foreground">{formatTimestamp(booking["Pickup Timestamp"])}</span>
                    </div>
                  )}
                  {stage === "on-board" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Elapsed</span>
                      <span className="font-medium text-primary">{elapsed} min</span>
                    </div>
                  )}
                  {booking["Completion Timestamp"] && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed</span>
                      <span className="text-foreground">{formatTimestamp(booking["Completion Timestamp"])}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Call Client */}
            {customerPhone && (
              <a href={telLink} className="mb-3 flex items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary">
                <Phone className="h-4 w-4" />
                Call Client: {booking["Phone"] || customerPhone}
              </a>
            )}

            {/* Action Buttons by Stage */}
            <div className="space-y-2">
              {stage === "idle" && (
                <>
                  <button type="button" onClick={() => handleStartJourney(booking)} disabled={isUpdating} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                    Notify Client / Start Journey
                  </button>
                  <a href={googleMapsPickupUrl} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary">
                    <Navigation className="h-4 w-4" />
                    Navigate to Pickup
                  </a>
                </>
              )}

              {stage === "en-route" && (
                <>
                  <div className="rounded-lg bg-blue-400/10 p-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-blue-400">
                      <Navigation className="h-4 w-4" />
                      <span className="text-sm font-medium">En Route to Client</span>
                    </div>
                    <p className="mt-1 text-xs text-blue-400/80">Client has been notified and can track you</p>
                  </div>
                  <a href={googleMapsPickupUrl} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary">
                    <Navigation className="h-4 w-4" />
                    Navigate to Pickup
                  </a>
                  <button type="button" onClick={() => handleClientOnBoard(booking)} disabled={isUpdating} className="flex w-full flex-col items-center justify-center gap-1 rounded-lg bg-green-600 px-4 py-3 text-white hover:bg-green-700 disabled:opacity-50">
                    <div className="flex items-center gap-2">
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                      <span className="text-sm font-medium">Client On Board</span>
                    </div>
                    <span className="text-[10px] opacity-80">Navigation to destination will open automatically</span>
                  </button>
                </>
              )}

              {stage === "on-board" && (
                <>
                  <div className="rounded-lg bg-green-400/10 p-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-green-700">
                      <Car className="h-4 w-4" />
                      <span className="text-sm font-medium">Journey In Progress</span>
                    </div>
                    <p className="mt-1 text-xs text-green-600">
                      {elapsed} min elapsed
                    </p>
                  </div>
                  <a href={googleMapsDestUrl} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary">
                    <Navigation className="h-4 w-4" />
                    Navigate to Destination
                  </a>
                  {/* Proximity-gated Complete Job */}
                  {(() => {
                    const dest = destCoords[requestId];
                    const distance = driverPos && dest
                      ? haversineDistance(driverPos.lat, driverPos.lng, dest.lat, dest.lng)
                      : null;
                    const PROXIMITY_THRESHOLD = 500; // 500 metres
                    const isNearDest = distance !== null && distance <= PROXIMITY_THRESHOLD;
                    const hasOverride = proximityOverride[requestId] === true;
                    const canComplete = isNearDest || hasOverride || !dest;

                    return (
                      <div className="space-y-2">
                        {/* Distance indicator */}
                        {dest && distance !== null && (
                          <div className={`flex items-center justify-center gap-2 rounded-lg p-2 text-xs font-medium ${
                            isNearDest ? "bg-green-400/10 text-green-400" : "bg-amber-400/10 text-amber-400"
                          }`}>
                            <MapPin className="h-3.5 w-3.5" />
                            {isNearDest
                              ? "You are near the destination"
                              : `${distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`} from destination`
                            }
                          </div>
                        )}

                        {/* Complete button */}
                        <button
                          type="button"
                          onClick={() => handleCompleteJob(booking)}
                          disabled={isUpdating || !canComplete}
                          className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-50 ${
                            canComplete
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "bg-muted text-muted-foreground cursor-not-allowed"
                          }`}
                        >
                          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
                          {canComplete ? "Complete Job" : "Drive closer to destination"}
                        </button>

                        {/* Manual override after 5 min on-board (GPS might be inaccurate) */}
                        {!canComplete && elapsed >= 5 && (
                          <button
                            type="button"
                            onClick={() => setProximityOverride((prev) => ({ ...prev, [requestId]: true }))}
                            className="w-full rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                          >
                            Override: I have arrived (GPS inaccurate)
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}

              {stage === "completed" && (
                <div className="rounded-lg bg-muted p-3 text-center">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-green-600" />
                  <p className="mt-1 text-sm font-medium text-foreground">Job Completed</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="theme-driver min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-4">
        {/* Header */}
        <div className="mb-6 overflow-hidden rounded-xl border border-accent/30 bg-card">
          <div className="h-1.5 w-full bg-accent" />
          <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
  <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">RCD Driver</p>
  <h1 className="text-lg font-bold text-foreground">{rawDriverName}</h1>
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <a href="tel:+353852297379" className="text-xs text-muted-foreground hover:text-foreground">
              085 229 7379
            </a>
            <span className="text-[10px] text-muted-foreground/50">RCD Office</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setLoading(true); fetchMyJobs(); }}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
          </div>
          {/* Stats bar */}
          <div className="mt-3 flex items-center gap-3 text-xs">
            <span className="rounded-full bg-amber-400/10 px-2 py-0.5 font-medium text-amber-400">
              {todayJobs.length + activeJobs.length + pendingJobs.length} Active
            </span>
            <span className="rounded-full bg-blue-400/10 px-2 py-0.5 font-medium text-blue-400">
              {upcomingJobs.length} Upcoming
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
              {completedJobs.length} Done
            </span>
          </div>
          </div>
        </div>

        {/* Install to Home Screen Banner */}
        {showInstallBanner && (
          <div className="mb-4 rounded-xl border border-accent/30 bg-accent/5 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-accent" />
                <p className="text-xs font-semibold text-foreground">Add RCD to Home Screen</p>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallBanner(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {deferredPrompt ? (
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">Tap Install to add the RCD icon to your phone</p>
                <button
                  type="button"
                  onClick={async () => {
                    const prompt = deferredPrompt as { prompt: () => void; userChoice: Promise<{ outcome: string }> };
                    prompt.prompt();
                    const result = await prompt.userChoice;
                    if (result.outcome === "accepted") setShowInstallBanner(false);
                    setDeferredPrompt(null);
                  }}
                  className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90"
                >
                  Install
                </button>
              </div>
            ) : isIOS ? (
              <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
                <p className="font-medium text-foreground">iPhone / iPad:</p>
                <p>1. Tap the <strong>Share</strong> button (square with arrow) at the bottom of Safari</p>
                <p>2. Scroll down and tap <strong>"Add to Home Screen"</strong></p>
                <p>3. Tap <strong>"Add"</strong> in the top right</p>
              </div>
            ) : (
              <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
                <p className="font-medium text-foreground">Android:</p>
                <p>1. Tap the <strong>three dots menu</strong> in the top right of Chrome</p>
                <p>2. Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></p>
              </div>
            )}
          </div>
        )}

        {bookings.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Car className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium text-foreground">No jobs assigned yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Jobs will appear here once they are assigned to you</p>
          </div>
        )}

        {/* Active Jobs (en-route / on-board) */}
        {activeJobs.length > 0 && (
          <div className="mb-4">
            <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
              <Play className="h-3 w-3 text-green-600" />
              Active Now
            </h2>
            <div className="space-y-3">
              {activeJobs.map(renderJobCard)}
            </div>
          </div>
        )}

        {/* Today's Jobs */}
        {todayJobs.length > 0 && (
          <div className="mb-4">
            <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
              <Calendar className="h-3 w-3 text-primary" />
              {"Today's Jobs"}
            </h2>
            <div className="space-y-3">
              {todayJobs.filter((b) => b["Journey Status"] !== "en-route" && b["Journey Status"] !== "on-board").map(renderJobCard)}
            </div>
          </div>
        )}

        {/* Past Pending Jobs */}
        {pendingJobs.length > 0 && (
          <div className="mb-4">
            <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
              <Clock className="h-3 w-3 text-amber-600" />
              Pending
            </h2>
            <div className="space-y-3">
              {pendingJobs.map(renderJobCard)}
            </div>
          </div>
        )}

        {/* Upcoming Jobs */}
        {upcomingJobs.length > 0 && (
          <div className="mb-4">
            <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
              <Calendar className="h-3 w-3 text-blue-600" />
              Upcoming
            </h2>
            <div className="space-y-3">
              {upcomingJobs.map(renderJobCard)}
            </div>
          </div>
        )}

        {/* Completed Jobs */}
        {completedJobs.length > 0 && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowCompleted(!showCompleted)}
              className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              <CheckCircle2 className="h-3 w-3" />
              Completed ({completedJobs.length})
              <span className="text-[10px] font-normal normal-case">{showCompleted ? "Hide" : "Show"}</span>
              {showCompleted ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {showCompleted && (
              <div className="space-y-3">
                {completedJobs.map(renderJobCard)}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pb-4 text-center">
          <p className="text-[10px] text-muted-foreground/60">Redmond Chauffeur Drive</p>
          <p className="text-[10px] text-muted-foreground/40">Auto-refreshes every 30 seconds</p>
        </div>
      </div>
    </div>
  );
}
