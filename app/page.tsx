"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users, Car, Calendar, Clock, CalendarCheck, TrendingUp,
  RefreshCw, ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface SheetRecord {
  [key: string]: string;
}

/* ------------------------------------------------------------------ */
/*  Drivers Panel                                                      */
/* ------------------------------------------------------------------ */
function DriversPanel({ drivers, loading, error, onRefresh }: {
  drivers: SheetRecord[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const [expandedDriver, setExpandedDriver] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">Active Drivers</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading drivers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Active Drivers</h3>
          </div>
          <button type="button" onClick={onRefresh} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">
            Active Drivers
            <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">{drivers.length}</span>
          </h3>
        </div>
        <button type="button" onClick={onRefresh} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>
      {drivers.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No drivers found in the Drivers sheet.</p>
      ) : (
        <div className="space-y-2">
          {drivers.map((driver, idx) => {
            const isExpanded = expandedDriver === idx;
            const firstName = driver["First Name"] || "";
            const name = driver["Name"] || firstName || Object.values(driver)[0] || "Unknown";
            const status = driver["Current Status"] || "";
            const ntaId = driver["NTA Driver ID"] || "";
            const availableFrom = driver["Available From"] || "";
            const profilePhoto = driver["Profile Photo"] || "";
            const isActive = status.toLowerCase() === "active" || status.toLowerCase() === "available" || status.toLowerCase() === "on duty" || status === "";
            const allKeys = Object.keys(driver);

            return (
              <div key={idx} className="rounded-lg border border-border bg-secondary/30 transition-colors hover:bg-secondary/60">
                <button type="button" className="flex w-full items-center justify-between px-3 py-3 text-left" onClick={() => setExpandedDriver(isExpanded ? null : idx)}>
                  <div className="flex items-center gap-3">
                    {profilePhoto ? (
                      <img src={profilePhoto || "/placeholder.svg"} alt={name} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{name}</p>
                      <div className="flex items-center gap-2">
                        {status && (
                          <span className={`inline-flex items-center gap-1 text-xs ${isActive ? "text-green-600" : "text-muted-foreground"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-muted-foreground/50"}`} />
                            {status}
                          </span>
                        )}
                        {ntaId && <span className="text-xs text-muted-foreground">NTA: {ntaId}</span>}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-border px-3 pb-3 pt-2">
                    <div className="grid grid-cols-1 gap-1.5">
                      {allKeys.map((key) => {
                        const val = driver[key];
                        if (!val) return null;
                        if (key === "Profile Photo") {
                          return (
                            <div key={key} className="flex items-start gap-2 text-xs">
                              <span className="min-w-[120px] shrink-0 font-medium text-muted-foreground">{key}:</span>
                              <img src={val || "/placeholder.svg"} alt="Profile" className="h-16 w-16 rounded-lg object-cover" />
                            </div>
                          );
                        }
                        return (
                          <div key={key} className="flex items-start gap-2 text-xs">
                            <span className="min-w-[120px] shrink-0 font-medium text-muted-foreground">{key}:</span>
                            <span className="text-foreground">{val}</span>
                          </div>
                        );
                      })}
                    </div>
                    {availableFrom && (
                      <div className="mt-2 flex items-center gap-1.5 rounded-md bg-accent/10 px-2 py-1 text-xs">
                        <Calendar className="h-3 w-3 text-accent" />
                        <span className="text-muted-foreground">Available from:</span>
                        <span className="font-medium text-foreground">{availableFrom}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Vehicles Panel                                                     */
/* ------------------------------------------------------------------ */
function VehiclesPanel({ vehicles, loading, error, onRefresh }: {
  vehicles: SheetRecord[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const [expandedVehicle, setExpandedVehicle] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Car className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">Fleet Vehicles</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading vehicles...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Fleet Vehicles</h3>
          </div>
          <button type="button" onClick={onRefresh} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">
            Fleet Vehicles
            <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">{vehicles.length}</span>
          </h3>
        </div>
        <button type="button" onClick={onRefresh} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>
      {vehicles.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No vehicles found in the Vehicles sheet.</p>
      ) : (
        <div className="space-y-2">
          {vehicles.map((vehicle, idx) => {
            const isExpanded = expandedVehicle === idx;
            const name = vehicle["Vehicle Name"] || vehicle["Name"] || vehicle["Make"] || vehicle["Registration"] || Object.values(vehicle)[0] || "Unknown";
            const reg = vehicle["Registration"] || vehicle["Reg"] || "";
            const type = vehicle["Type"] || vehicle["Vehicle Type"] || vehicle["Category"] || "";
            const status = vehicle["Status"] || vehicle["Current Status"] || "";
            const isActive = status.toLowerCase() === "active" || status.toLowerCase() === "available" || status === "";
            const allKeys = Object.keys(vehicle);

            return (
              <div key={idx} className="rounded-lg border border-border bg-secondary/30 transition-colors hover:bg-secondary/60">
                <button type="button" className="flex w-full items-center justify-between px-3 py-3 text-left" onClick={() => setExpandedVehicle(isExpanded ? null : idx)}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Car className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{name}</p>
                      <div className="flex items-center gap-2">
                        {reg && <span className="font-mono text-xs text-muted-foreground">{reg}</span>}
                        {type && <span className="text-xs text-muted-foreground">{type}</span>}
                        {status && (
                          <span className={`inline-flex items-center gap-1 text-xs ${isActive ? "text-green-600" : "text-muted-foreground"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-muted-foreground/50"}`} />
                            {status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-border px-3 pb-3 pt-2">
                    <div className="grid grid-cols-1 gap-1.5">
                      {allKeys.map((key) => {
                        const val = vehicle[key];
                        if (!val) return null;
                        return (
                          <div key={key} className="flex items-start gap-2 text-xs">
                            <span className="min-w-[120px] shrink-0 font-medium text-muted-foreground">{key}:</span>
                            <span className="text-foreground">{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function Home() {
  const [drivers, setDrivers] = useState<SheetRecord[]>([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const [driversError, setDriversError] = useState<string | null>(null);

  const [vehicles, setVehicles] = useState<SheetRecord[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vehiclesError, setVehiclesError] = useState<string | null>(null);

  const fetchDrivers = useCallback(async () => {
    setDriversLoading(true);
    setDriversError(null);
    try {
      const res = await fetch("/api/drivers");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch drivers");
      setDrivers(data.drivers);
    } catch (err) {
      setDriversError(err instanceof Error ? err.message : "Failed to load drivers");
    } finally {
      setDriversLoading(false);
    }
  }, []);

  const fetchVehicles = useCallback(async () => {
    setVehiclesLoading(true);
    setVehiclesError(null);
    try {
      const res = await fetch("/api/vehicles");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch vehicles");
      setVehicles(data.vehicles);
    } catch (err) {
      setVehiclesError(err instanceof Error ? err.message : "Failed to load vehicles");
    } finally {
      setVehiclesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
    fetchVehicles();
  }, [fetchDrivers, fetchVehicles]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">Redmond Chauffeur Drive</h1>
            <p className="text-sm text-muted-foreground">Booking & Dispatch System</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            System Online
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Booking Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create bookings, calculate fares, and manage dispatch.</p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10"><CalendarCheck className="h-5 w-5 text-accent" /></div>
              <div><p className="text-2xl font-bold text-foreground">--</p><p className="text-xs text-muted-foreground">{"Today's Bookings"}</p></div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10"><Users className="h-5 w-5 text-accent" /></div>
              <div><p className="text-2xl font-bold text-foreground">{driversLoading ? "..." : drivers.length}</p><p className="text-xs text-muted-foreground">Active Drivers</p></div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10"><Car className="h-5 w-5 text-accent" /></div>
              <div><p className="text-2xl font-bold text-foreground">{vehiclesLoading ? "..." : vehicles.length}</p><p className="text-xs text-muted-foreground">Fleet Vehicles</p></div>
            </div>
          </div>
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20"><TrendingUp className="h-5 w-5 text-accent" /></div>
              <div><p className="text-2xl font-bold text-accent">--</p><p className="text-xs text-muted-foreground">Avg Fare (NTA 2026)</p></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground">New Booking Request</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Enter customer and route details. Fares are calculated automatically using Google Maps distance and NTA 2026 rates.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Booking form coming soon. Drivers & Vehicles loading from Google Sheets below.</p>
            </div>
          </div>

          <div className="space-y-6">
            <DriversPanel drivers={drivers} loading={driversLoading} error={driversError} onRefresh={fetchDrivers} />
            <VehiclesPanel vehicles={vehicles} loading={vehiclesLoading} error={vehiclesError} onRefresh={fetchVehicles} />
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">NTA 2026 Fare Reference</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
                <span>Initial charge (500m):</span><span className="font-medium text-foreground">EUR 4.20</span>
                <span>Pre-booking fee:</span><span className="font-medium text-foreground">EUR 2.00</span>
                <span>{"Tariff A (up to 15km):"}</span><span className="font-medium text-foreground">EUR 1.18/km</span>
                <span>{"Tariff B (over 15km):"}</span><span className="font-medium text-foreground">EUR 1.54/km</span>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Eircode Tips</h3>
              <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
                <li className="flex gap-2"><span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />Enter the full 7-character Eircode (e.g. D02 AF30)</li>
                <li className="flex gap-2"><span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{"Eircodes are automatically prefixed with \"Ireland\" for accurate geocoding"}</li>
                <li className="flex gap-2"><span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{"Use \"Get Fare Estimate\" to preview the route before submitting"}</li>
                <li className="flex gap-2"><span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />All bookings are written directly to Google Sheets</li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">System Status</h3>
              <div className="space-y-2.5">
                {[
                  { name: "Google Maps API", status: "Connected" },
                  { name: "Google Sheets", status: "Connected" },
                  { name: "NTA Pricing", status: "2026 Rates" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-xs font-medium text-foreground">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="border-t border-border bg-card py-6">
        <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
          <p className="text-xs text-muted-foreground">Redmond Chauffeur Drive - Booking & Dispatch System v1.0</p>
        </div>
      </footer>
    </div>
  );
}
