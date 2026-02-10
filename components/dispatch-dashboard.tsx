"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Loader2, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle2, Clock, MapPin, Car, Navigation,
} from "lucide-react";

interface Booking {
  [key: string]: string;
}

export function DispatchDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
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

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

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

  // Only show Confirmed and Completed bookings in dispatch
  const dispatchBookings = bookings.filter((b) => {
    const status = b["Status"] || "";
    if (filterStatus === "all") return status === "Confirmed" || status === "Completed";
    return status === filterStatus;
  });

  const confirmedCount = bookings.filter((b) => b["Status"] === "Confirmed").length;
  const completedCount = bookings.filter((b) => b["Status"] === "Completed").length;

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Dispatch Dashboard</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading dispatch jobs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">
          Dispatch Dashboard
          <span className="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-accent/10 px-2 text-xs font-bold text-accent">
            {dispatchBookings.length}
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-green-800">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              {confirmedCount} Active
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
              {completedCount} Completed
            </span>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none"
          >
            <option value="all">All Dispatch</option>
            <option value="Confirmed">Active Jobs</option>
            <option value="Completed">Completed Jobs</option>
          </select>
          <button
            type="button"
            onClick={fetchBookings}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {dispatchBookings.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No dispatch jobs found. Confirmed bookings will appear here.</p>
      ) : (
        <div className="space-y-2">
          {dispatchBookings.map((booking) => {
            const requestId = booking["Request ID"];
            const uniqueKey = booking["_rowIndex"] || requestId;
            const isExpanded = expandedBooking === uniqueKey;
            const status = booking["Status"] || "Confirmed";
            const displayFare = booking["Owner Fare"] || booking["Adjusted Fare"] || booking["NTA Max Fare"] || "0";

            // Check if the booking date/time has passed
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
              <div key={uniqueKey} className={`rounded-lg border ${status === "Completed" ? "border-border bg-muted/30" : "border-green-200 bg-green-50/30"}`}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                  onClick={() => setExpandedBooking(isExpanded ? null : uniqueKey)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-accent">{requestId}</span>
                    <span className="text-sm font-medium text-foreground">{booking["Customer Name"]}</span>
                    {status === "Completed" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-black px-2 py-0.5 text-xs font-medium text-white">
                        <CheckCircle2 className="h-3 w-3" /> Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Active
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
                    {/* Job Details */}
                    <div className="mb-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                        <div>
                          <p className="text-xs text-muted-foreground">Pickup</p>
                          <p className="font-medium text-foreground">{booking["Origin Address"] || booking["Pickup Eircode"]}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                        <div>
                          <p className="text-xs text-muted-foreground">Destination</p>
                          <p className="font-medium text-foreground">{booking["Destination Address"] || booking["Destination Eircode"]}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Car className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Vehicle</p>
                          <p className="font-medium text-foreground">{booking["Vehicle Type"]}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Scheduled</p>
                          <p className="font-medium text-foreground">{bookingDate}{bookingTime !== "23:59" ? ` at ${bookingTime}` : ""}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 flex items-center justify-between rounded-lg bg-accent/5 border border-accent/20 px-4 py-3">
                      <span className="text-sm text-muted-foreground">Fare</span>
                      <span className="text-lg font-bold text-foreground">{"\u20AC"}{displayFare}</span>
                    </div>

                    {/* Dispatch Actions */}
                    <div className="space-y-2">
                      <a
                        href={`/dispatch/${requestId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90"
                      >
                        <Navigation className="h-4 w-4" />
                        Open Driver Dispatch
                      </a>

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
                          <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-300 px-4 py-2.5 text-sm font-medium text-gray-500 cursor-not-allowed" title={`Available after ${bookingDate} ${bookingTime}`}>
                            <Clock className="h-4 w-4" />
                            Job Not Yet Due
                          </div>
                        )
                      )}

                      {status === "Completed" && (
                        <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white">
                          <CheckCircle2 className="h-4 w-4" />
                          Job Completed
                        </div>
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
