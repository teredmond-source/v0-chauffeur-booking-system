"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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

// Leaflet map component loaded dynamically to avoid SSR issues
function LiveMap({ lat, lng, isOnBoard }: { lat: number; lng: number; isOnBoard: boolean }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const pulseRef = useRef<L.CircleMarker | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet CSS and JS dynamically
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Add Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Import Leaflet
    import("leaflet").then(() => {
      setLeafletLoaded(true);
    });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapRef.current) return;

    import("leaflet").then((L) => {
      const map = L.map(mapContainerRef.current!, {
        zoomControl: false,
        attributionControl: false,
      }).setView([lat, lng], 15);

      // Dark tile layer
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Add zoom control to bottom right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Pulsing circle behind the car
      const pulse = L.circleMarker([lat, lng], {
        radius: 20,
        color: isOnBoard ? "#4ade80" : "#60a5fa",
        fillColor: isOnBoard ? "#4ade80" : "#60a5fa",
        fillOpacity: 0.15,
        weight: 2,
        opacity: 0.4,
      }).addTo(map);
      pulseRef.current = pulse;

      // Car marker using a custom div icon
      const carIcon = L.divIcon({
        html: `<div style="
          width: 40px; height: 40px; 
          background: ${isOnBoard ? "#16a34a" : "#2563eb"}; 
          border-radius: 50%; 
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 20px ${isOnBoard ? "rgba(74,222,128,0.5)" : "rgba(96,165,250,0.5)"};
          border: 3px solid white;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <path d="M9 17h6"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>`,
        className: "",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([lat, lng], { icon: carIcon }).addTo(map);
      markerRef.current = marker;
      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        pulseRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletLoaded]);

  // Smoothly update marker position when lat/lng change
  useEffect(() => {
    if (!markerRef.current || !mapRef.current || !pulseRef.current) return;

    import("leaflet").then((L) => {
      const newLatLng = L.latLng(lat, lng);
      markerRef.current!.setLatLng(newLatLng);
      pulseRef.current!.setLatLng(newLatLng);
      mapRef.current!.panTo(newLatLng, { animate: true, duration: 1 });

      // Update colors based on stage
      const color = isOnBoard ? "#4ade80" : "#60a5fa";
      pulseRef.current!.setStyle({
        color,
        fillColor: color,
      });

      // Update car icon color
      const bgColor = isOnBoard ? "#16a34a" : "#2563eb";
      const shadowColor = isOnBoard ? "rgba(74,222,128,0.5)" : "rgba(96,165,250,0.5)";
      const carIcon = L.divIcon({
        html: `<div style="
          width: 40px; height: 40px; 
          background: ${bgColor}; 
          border-radius: 50%; 
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 20px ${shadowColor};
          border: 3px solid white;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <path d="M9 17h6"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>`,
        className: "",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
      markerRef.current!.setIcon(carIcon);
    });
  }, [lat, lng, isOnBoard]);

  return (
    <div ref={mapContainerRef} className="h-full w-full" />
  );
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

  useEffect(() => {
    fetchTracking();
    // Poll every 8 seconds for smoother tracking
    const interval = setInterval(fetchTracking, 8000);
    return () => clearInterval(interval);
  }, [fetchTracking]);

  const formatTime = (isoStr: string) => {
    return new Date(isoStr).toLocaleString("en-IE", { dateStyle: "short", timeStyle: "short" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading tracking...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <Car className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-bold text-foreground">Tracking Unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error || "This tracking link is no longer active."}</p>
        </div>
      </div>
    );
  }

  const { journeyStatus } = data;

  if (journeyStatus === "completed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-400/10">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-foreground">Trip Completed</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Thank you for traveling with Redmond Chauffeur Drive.
          </p>
          {data.completionTimestamp && (
            <p className="mt-1 text-xs text-muted-foreground">
              Arrived at {formatTime(data.completionTimestamp)}
            </p>
          )}

          <div className="mt-6 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-center gap-1 text-amber-500">
              <Star className="h-5 w-5 fill-current" />
              <Star className="h-5 w-5 fill-current" />
              <Star className="h-5 w-5 fill-current" />
              <Star className="h-5 w-5 fill-current" />
              <Star className="h-5 w-5 fill-current" />
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">How was your journey?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              We would love to hear your feedback. Your review helps us provide the best service.
            </p>
            <a
              href="https://g.page/r/CdsSZeCTlq7_EBM/review"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Leave a Google Review
            </a>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">This tracking link is now inactive.</p>
        </div>
      </div>
    );
  }

  if (journeyStatus === "idle") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <Car className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 text-xl font-bold text-foreground">Your Booking is Confirmed</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your driver has not started the journey yet. This page will update automatically when they are on the way.
          </p>
          {data.date && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Scheduled: {data.date}{data.time ? ` at ${data.time}` : ""}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isOnBoard = journeyStatus === "on-board";
  const hasLocation = data.lat && data.lng;
  const driverLat = hasLocation ? parseFloat(data.lat!) : null;
  const driverLng = hasLocation ? parseFloat(data.lng!) : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Live Map - takes most of the screen */}
      <div className="relative flex-1" style={{ minHeight: "55vh" }}>
        {driverLat && driverLng ? (
          <>
            <LiveMap lat={driverLat} lng={driverLng} isOnBoard={isOnBoard} />
            {/* Floating status pill */}
            <div className="absolute left-3 top-3 z-[1000]">
              <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-lg backdrop-blur-md ${
                isOnBoard 
                  ? "bg-green-600/90 text-white" 
                  : "bg-blue-600/90 text-white"
              }`}>
                <span className="relative flex h-2 w-2">
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${isOnBoard ? "bg-green-300" : "bg-blue-300"}`} />
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${isOnBoard ? "bg-green-200" : "bg-blue-200"}`} />
                </span>
                {isOnBoard ? "Journey In Progress" : "Driver En Route"}
              </div>
            </div>
            {/* Live indicator */}
            <div className="absolute right-3 top-3 z-[1000] flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5 text-[10px] font-medium text-foreground shadow-lg backdrop-blur-md">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
              </span>
              LIVE
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <div className="text-center text-muted-foreground">
              <Navigation className="mx-auto h-8 w-8 animate-pulse" />
              <p className="mt-2 text-sm">Acquiring driver location...</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Panel - slides up over map */}
      <div className="relative z-[1000] -mt-4 rounded-t-2xl bg-background shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
        <div className="mx-auto mb-2 mt-2 h-1 w-10 rounded-full bg-muted-foreground/30" />
        
        <div className="px-4 pb-6 pt-2">
          {/* Status Banner */}
          <div className={`mb-4 rounded-xl p-3 ${isOnBoard ? "bg-green-400/10" : "bg-blue-400/10"}`}>
            <div className="flex items-center gap-2">
              {isOnBoard ? <Car className="h-5 w-5 text-green-400" /> : <Navigation className="h-5 w-5 text-blue-400" />}
              <span className={`text-sm font-semibold ${isOnBoard ? "text-green-400" : "text-blue-400"}`}>
                {isOnBoard ? "You are on your way!" : "Your driver is on the way"}
              </span>
            </div>
            {!isOnBoard && (
              <p className="mt-1 text-xs text-muted-foreground">
                {data.driverName || "Your chauffeur"} is heading to your pickup in a {data.vehicleType}
              </p>
            )}
            {isOnBoard && data.pickupTimestamp && (
              <p className="mt-1 text-xs text-muted-foreground">
                Picked up at {formatTime(data.pickupTimestamp)}
              </p>
            )}
          </div>

          {/* Driver Details */}
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{data.driverName || "Your Chauffeur"}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{data.vehicleType}</span>
                {data.vehicleReg && (
                  <>
                    <span className="text-muted-foreground/30">|</span>
                    <span className="font-mono">{data.vehicleReg}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-green-400/10 px-2 py-1 text-[10px] font-medium text-green-400">
              <Shield className="h-3 w-3" />
              SPSV
            </div>
          </div>

          {/* Route */}
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-400/10">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                </div>
                <div className="h-6 w-px border-l border-dashed border-muted-foreground/30" />
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pickup</p>
                  <p className="text-sm text-foreground">{data.pickupAddress}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Destination</p>
                  <p className="text-sm text-foreground">{data.destAddress}</p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-[10px] text-muted-foreground/50">
            Powered by Redmond Chauffeur Drive
          </p>
        </div>
      </div>
    </div>
  );
}
