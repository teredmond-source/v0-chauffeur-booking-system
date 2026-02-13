"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Loader2, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle2, Clock, MapPin, Car, Navigation, UserPlus, User, ClipboardList,
} from "lucide-react";

interface Booking {
  [key: string]: string;
}

interface Driver {
  [key: string]: string;
}

export function DispatchDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [assigningDriver, setAssigningDriver] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("Confirmed");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch bookings");
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await fetch("/api/drivers");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch drivers");
      setDrivers(data.drivers || []);
    } catch {
      setDrivers([]);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchDrivers();
  }, [fetchBookings, fetchDrivers]);

  const handleStatusUpdate = async (requestId: string, newStatus: string, rowIndex?: string) => {
    setUpdatingStatus(requestId);
    try {
      const res = await fetch("/api/bookings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, field: "Status", value: newStatus, rowIndex }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBookings((prev) =>
        prev.map((b) =>
          b["Request ID"] === requestId ? { ...b, Status: newStatus } : b
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleAssignDriver = async (booking: Booking, driverName: string) => {
    const requestId = booking["Request ID"];
    const rowIndex = booking["_rowIndex"];
    setAssigningDriver(requestId);
    try {
      const res = await fetch("/api/dispatch/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          rowIndex,
          updates: { "Driver Name": driverName },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBookings((prev) =>
        prev.map((b) =>
          b["Request ID"] === requestId ? { ...b, "Driver Name": driverName } : b
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to assign driver");
    } finally {
      setAssigningDriver(null);
    }
  };

  const getDriverDisplayName = (driver: Driver): string => {
    const firstName = driver["First Name"] || driver["first name"] || "";
    const lastName = driver["Last Name"] || driver["Surname"] || driver["last name"] || driver["Name"] || "";
    return (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || Object.values(driver)[0]) || "Unknown";
  };

  const dispatchBookings = bookings.filter((b) => {
    const status = b["Status"] || "";
    if (filterStatus === "all") return status === "Confirmed" || status === "Completed";
    return status === filterStatus;
  });

  const confirmedCount = bookings.filter((b) => b["Status"] === "Confirmed").length;
  const completedCount = bookings.filter((b) => b["Status"] === "Completed").length;

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
          <ClipboardList className="h-5 w-5 text-accent" />
          Pending Executive Bookings
        </h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading dispatch jobs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
          <ClipboardList className="h-5 w-5 text-accent" />
          Pending Executive Bookings
          <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
            {dispatchBookings.length}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-green-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
            {confirmedCount} Active
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" />
            {completedCount} Completed
          </span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-muted-foreground/30 bg-secondary px-3 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none"
          >
            <option value="all">All Dispatch</option>
            <option value="Confirmed">Active Jobs</option>
            <option value="Completed">Completed Jobs</option>
          </select>
          <button type="button" onClick={() => { fetchBookings(); fetchDrivers(); }} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground">
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {dispatchBookings.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No dispatch jobs found. Confirmed bookings will appear here.</p>
      ) : (
        <div className="space-y-3">
          {dispatchBookings.map((booking) => {
            const requestId = booking["Request ID"];
            const uniqueKey = booking["_rowIndex"] || requestId;
            const isExpanded = expandedBooking === uniqueKey;
            const status = booking["Status"] || "Confirmed";
            const assignedDriver = booking["Driver Name"] || "";
            const displayFare = booking["Owner Fare"] || booking["Adjusted Fare"] || booking["NTA Max Fare"] || "0";

            const bookingDate = booking["Date"] || "";
            const bookingTime = booking["Time"] || "23:59";
            let jobDatePassed = false;
            try {
              const parts = bookingDate.split("/");
              const dateStr = parts.length === 3
                ? `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}T${bookingTime}:00`
                : `${bookingDate}T${bookingTime}:00`;
              jobDatePassed = new Date(dateStr) <= new Date();
            } catch {
              jobDatePassed = false;
            }

            return (
              <div key={uniqueKey} className="rounded-lg border border-border bg-background">
                <button type="button" onClick={() => setExpandedBooking(isExpanded ? null : uniqueKey)} className="flex w-full items-center justify-between px-4 py-3 text-left">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">{requestId}</span>
                    <span className="text-sm font-medium text-foreground">{booking["Customer Name"]}</span>
                    {status === "Completed" ? (
                      <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        Completed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-green-400/10 px-2 py-0.5 text-xs font-medium text-green-400">
                        Active
                      </span>
                    )}
                    {assignedDriver && (
                      <span className="flex items-center gap-1 rounded-full bg-blue-400/10 px-2 py-0.5 text-xs font-medium text-blue-400">
                        <User className="h-3 w-3" />
                        {assignedDriver}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {bookingDate && (
                      <span className="text-xs text-muted-foreground">{bookingDate}{bookingTime !== "23:59" ? ` ${bookingTime}` : ""}</span>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    <div className="mb-4 grid gap-3 sm:grid-cols-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 text-accent" />
                        <div>
                          <p className="text-xs text-muted-foreground">Pickup</p>
                          <p className="text-sm font-medium text-foreground">{booking["Origin Address"] || booking["Pickup Eircode"]}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Navigation className="mt-0.5 h-3.5 w-3.5 text-accent" />
                        <div>
                          <p className="text-xs text-muted-foreground">Destination</p>
                          <p className="text-sm font-medium text-foreground">{booking["Destination Address"] || booking["Destination Eircode"]}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Car className="mt-0.5 h-3.5 w-3.5 text-accent" />
                        <div>
                          <p className="text-xs text-muted-foreground">Vehicle</p>
                          <p className="text-sm font-medium text-foreground">{booking["Vehicle Type"]}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="mt-0.5 h-3.5 w-3.5 text-accent" />
                        <div>
                          <p className="text-xs text-muted-foreground">Scheduled</p>
                          <p className="text-sm font-medium text-foreground">{bookingDate}{bookingTime !== "23:59" ? ` at ${bookingTime}` : ""}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 rounded-lg bg-accent/5 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Fare</p>
                      <p className="text-2xl font-bold text-foreground">{"\u20AC"}{displayFare}</p>
                    </div>

                    {/* Driver Assignment */}
                    <div className="mb-3">
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <UserPlus className="h-3.5 w-3.5" />
                        Assign Driver
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          value={assignedDriver}
                          onChange={(e) => handleAssignDriver(booking, e.target.value)}
                          disabled={assigningDriver === requestId || status === "Completed"}
                          className="flex-1 rounded-lg border border-muted-foreground/30 bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none disabled:opacity-50"
                        >
                          <option value="">-- Select Driver --</option>
                          {drivers.map((driver, idx) => {
                            const name = getDriverDisplayName(driver);
                            return (
                              <option key={idx} value={name}>{name}</option>
                            );
                          })}
                        </select>
                        {assigningDriver === requestId && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Dispatch Actions */}
                    <div className="flex flex-col gap-2">
                      {assignedDriver ? (
                        <a
                          href={`/dispatch/${requestId}`}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90"
                        >
                          <User className="h-4 w-4" />
                          {assignedDriver} - Open Dispatch
                        </a>
                      ) : (
                        <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground">
                          <UserPlus className="h-4 w-4" />
                          Assign a driver to open dispatch
                        </div>
                      )}

                      {status === "Confirmed" && (
                        jobDatePassed ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("Has this job been completed? This action cannot be undone.")) {
                                handleStatusUpdate(requestId, "Completed", uniqueKey);
                              }
                            }}
                            disabled={updatingStatus === requestId}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {updatingStatus === requestId ? "Updating..." : "Confirm Job Completed"}
                          </button>
                        ) : (
                          <p className="flex items-center justify-center gap-2 rounded-lg bg-secondary/50 px-4 py-2.5 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            Job Not Yet Due
                          </p>
                        )
                      )}

                      {status === "Completed" && (
                        <p className="flex items-center justify-center gap-2 rounded-lg bg-green-400/10 px-4 py-2.5 text-xs text-green-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Job Completed
                        </p>
                      )}
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
