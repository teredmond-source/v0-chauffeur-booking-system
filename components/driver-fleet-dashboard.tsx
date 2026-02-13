"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users, Car, Calendar, RefreshCw, ChevronDown, ChevronUp, Loader2,
  Truck, Phone,
} from "lucide-react";

interface SheetRecord {
  [key: string]: string;
}

function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function toDirectImageUrl(url: string, size?: number): string {
  if (!url) return "";
  const fileId = extractDriveFileId(url);
  if (fileId) {
    const sizeParam = size ? `=s${size}` : "";
    return `https://lh3.googleusercontent.com/d/${fileId}${sizeParam}`;
  }
  if (url.includes("lh3.googleusercontent.com") && size) {
    return url.replace(/=s\d+.*$/, "") + `=s${size}`;
  }
  return url;
}

function isImageColumn(key: string, val: string): boolean {
  const keyLower = key.toLowerCase();
  if (keyLower.includes("photo") || keyLower.includes("image") || keyLower.includes("picture") || keyLower.includes("avatar") || keyLower.includes("pic")) return true;
  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(val)) return true;
  if (/drive\.google\.com\/(file\/d|open\?id|uc\?)/i.test(val)) return true;
  if (/lh3\.googleusercontent\.com/i.test(val)) return true;
  if (/googleusercontent\.com/i.test(val)) return true;
  return false;
}

function findPhotoUrl(record: SheetRecord, size?: number): string {
  const photoKeys = ["Profile Photo", "Photo", "Image", "Picture", "Photo URL", "Vehicle Photo", "profile photo", "Pic", "Avatar"];
  for (const key of photoKeys) {
    if (record[key]) return toDirectImageUrl(record[key], size);
  }
  for (const [key, val] of Object.entries(record)) {
    if (val && (val.startsWith("http://") || val.startsWith("https://")) && isImageColumn(key, val)) {
      return toDirectImageUrl(val, size);
    }
  }
  return "";
}

export function DriverFleetDashboard() {
  const [drivers, setDrivers] = useState<SheetRecord[]>([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const [driversError, setDriversError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<SheetRecord[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vehiclesError, setVehiclesError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<"drivers" | "vehicles">("drivers");
  const [expandedDriver, setExpandedDriver] = useState<number | null>(null);
  const [expandedVehicle, setExpandedVehicle] = useState<number | null>(null);

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

  const totalCount = (driversLoading || vehiclesLoading) ? "..." : `${drivers.length} / ${vehicles.length}`;

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setExpanded(!expanded)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded(!expanded); }}
          className="flex cursor-pointer items-center gap-3"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <Users className="h-4 w-4 text-accent-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Driver & Fleet Dashboard</h3>
            <p className="text-xs text-muted-foreground">
              {driversLoading ? "..." : `${drivers.length} Active Drivers`}{" / "}
              {vehiclesLoading ? "..." : `${vehicles.length} Fleet Vehicles`}
            </p>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
        <button
          type="button"
          onClick={() => { fetchDrivers(); fetchVehicles(); }}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>

      {expanded && (
        <div className="p-4">
          {/* Tabs */}
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("drivers")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "drivers"
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4" />
              Active Drivers
              <span className="rounded-full bg-background px-2 py-0.5 text-xs">
                {driversLoading ? "..." : drivers.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("vehicles")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "vehicles"
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Car className="h-4 w-4" />
              Fleet Vehicles
              <span className="rounded-full bg-background px-2 py-0.5 text-xs">
                {vehiclesLoading ? "..." : vehicles.length}
              </span>
            </button>
          </div>

          {/* Drivers Tab */}
          {activeTab === "drivers" && (
            <div>
              {driversLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading drivers...
                </div>
              ) : driversError ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-destructive">{driversError}</p>
                </div>
              ) : drivers.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No drivers found.</p>
              ) : (
                <div className="space-y-2">
                  {drivers.map((driver, idx) => {
                    const isExpanded = expandedDriver === idx;
                    const firstName = driver["First Name"] || driver["first name"] || "";
                    const lastName = driver["Last Name"] || driver["Surname"] || driver["last name"] || driver["Name"] || "";
                    const name = (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || Object.values(driver)[0]) || "Unknown";
                    const status = driver["Current Status"] || "";
                    const ntaId = driver["NTA Driver ID"] || "";
                    const rawPhone = driver["Phone"] || driver["phone"] || driver["Mobile"] || driver["mobile"] || driver["Contact"] || driver["contact"] || driver["Phone Number"] || driver["phone number"] || driver["Tel"] || driver["tel"] || "";
                    // Fix missing leading 0 (Google Sheets strips it from numbers)
                    const phone = rawPhone && !rawPhone.startsWith("0") && !rawPhone.startsWith("+") && !rawPhone.startsWith("00")
                      ? `0${rawPhone}` : rawPhone;
                    const availableFrom = driver["Available From"] || "";
                    const isActive = status.toLowerCase() === "active" || status.toLowerCase() === "available" || status.toLowerCase() === "on duty" || status === "";
                    const allKeys = Object.keys(driver);
                    return (
                      <div key={idx} className="rounded-lg border border-border bg-background">
                        <button type="button" className="flex w-full items-center justify-between px-4 py-3 text-left" onClick={() => setExpandedDriver(isExpanded ? null : idx)}>
                          <div className="flex items-center gap-3">
                            <div className={`h-2 w-2 rounded-full ${isActive ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                            <span className="text-sm font-medium text-foreground">{name}</span>
                            <div className="flex items-center gap-2">
                              {status && (
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isActive ? "bg-green-400/10 text-green-400" : "bg-muted text-muted-foreground"}`}>
                                  {status}
                                </span>
                              )}
                              {ntaId && <span className="text-xs text-muted-foreground">NTA: {ntaId}</span>}
                              {phone && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {phone}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-muted-foreground">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="border-t border-border px-4 py-3">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {/* Render images first, larger and clickable */}
                              {allKeys.filter((key) => {
                                const val = driver[key];
                                return val && (val.startsWith("http://") || val.startsWith("https://")) && isImageColumn(key, val);
                              }).map((key) => {
                                const val = driver[key];
                                const directUrl = toDirectImageUrl(val, 800);
                                return (
                                  <div key={key} className="col-span-2 mb-3">
                                    <span className="mb-2 block text-xs font-semibold text-muted-foreground">{key}</span>
                                    <a href={directUrl || val} target="_blank" rel="noopener noreferrer" className="inline-block">
                                      <img
                                        src={directUrl || "/placeholder.svg"}
                                        alt={key}
                                        className="rounded-lg border border-border"
                                        style={{ maxWidth: "100%", height: "auto", display: "block" }}
                                        onError={(e) => {
                                          const img = e.target as HTMLImageElement;
                                          if (img.src !== val) {
                                            img.src = val;
                                          } else {
                                            img.style.display = "none";
                                          }
                                        }}
                                      />
                                    </a>
                                    <span className="mt-1 block text-[10px] text-muted-foreground/60">Click image to view full size</span>
                                  </div>
                                );
                              })}
                              {/* Render non-image fields */}
                              {allKeys.filter((key) => {
                                const val = driver[key];
                                if (!val) return false;
                                const isUrl = val.startsWith("http://") || val.startsWith("https://");
                                return !(isUrl && isImageColumn(key, val));
                              }).map((key) => {
                                let val = driver[key];
                                if (!val) return null;
                                // Fix missing leading 0 on phone numbers
                                const isPhoneField = /phone|mobile|contact|tel/i.test(key);
                                if (isPhoneField && val && !val.startsWith("0") && !val.startsWith("+") && !val.startsWith("00")) {
                                  val = `0${val}`;
                                }
                                const isUrl = val.startsWith("http://") || val.startsWith("https://");
                                return (
                                  <div key={key}>
                                    <span className="font-medium text-muted-foreground">{key}: </span>
                                    {isUrl ? (
                                      <a href={val} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">{val}</a>
                                    ) : (
                                      <span className="text-foreground">{val}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {availableFrom && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>Available from: </span>
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
          )}

          {/* Vehicles Tab */}
          {activeTab === "vehicles" && (
            <div>
              {vehiclesLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading vehicles...
                </div>
              ) : vehiclesError ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-destructive">{vehiclesError}</p>
                </div>
              ) : vehicles.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No vehicles found.</p>
              ) : (
                <div className="space-y-2">
                  {vehicles.map((vehicle, idx) => {
                    const isExpanded = expandedVehicle === idx;
                    const name = vehicle["Vehicle Name"] || vehicle["Name"] || vehicle["Make"] || vehicle["Registration"] || Object.values(vehicle)[0] || "Unknown";
                    const reg = vehicle["Registration"] || vehicle["Reg"] || "";
                    const vType = vehicle["Type"] || vehicle["Vehicle Type"] || "";
                    const status = vehicle["Status"] || vehicle["Current Status"] || "";
                    const vehiclePhoto = findPhotoUrl(vehicle);
                    const isActive = status.toLowerCase() === "active" || status.toLowerCase() === "available" || status === "";
                    const allKeys = Object.keys(vehicle);
                    return (
                      <div key={idx} className="rounded-lg border border-border bg-background">
                        <button type="button" className="flex w-full items-center justify-between px-4 py-3 text-left" onClick={() => setExpandedVehicle(isExpanded ? null : idx)}>
                          <div className="flex items-center gap-3">
                            {vehiclePhoto ? (
                              <img src={vehiclePhoto || "/placeholder.svg"} alt={name} className="h-10 w-10 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                <Truck className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <span className="text-sm font-medium text-foreground">{name}</span>
                              <div className="flex items-center gap-2">
                                {reg && <span className="text-xs text-muted-foreground">{reg}</span>}
                                {vType && <span className="text-xs text-muted-foreground">{vType}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-muted-foreground">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="border-t border-border px-4 py-3">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {allKeys.map((key) => {
                                const val = vehicle[key];
                                if (!val) return null;
                                const isUrl = val.startsWith("http://") || val.startsWith("https://");
                                const isImg = isUrl && isImageColumn(key, val);
                                if (isImg) {
                                  const directUrl = toDirectImageUrl(val);
                                  return (
                                    <div key={key} className="col-span-2">
                                      <span className="font-medium text-muted-foreground">{key}: </span>
                                      <img src={directUrl || "/placeholder.svg"} alt={key} className="mt-1 h-20 w-20 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                    </div>
                                  );
                                }
                                return (
                                  <div key={key}>
                                    <span className="font-medium text-muted-foreground">{key}: </span>
                                    {isUrl ? (
                                      <a href={val} target="_blank" rel="noopener noreferrer" className="text-primary underline">{val}</a>
                                    ) : (
                                      <span className="text-foreground">{val}</span>
                                    )}
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
          )}
        </div>
      )}
    </div>
  );
}
