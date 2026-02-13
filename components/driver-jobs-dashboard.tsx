"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Loader2, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle2, Clock, MapPin, Car, Navigation, User,
  Briefcase,
} from "lucide-react";

interface Booking {
  [key: string]: string;
}

interface Driver {
  [key: string]: string;
}

function getDriverDisplayName(driver: Driver): string {
  const firstName = driver["First Name"] || driver["first name"] || "";
  const lastName = driver["Last Name"] || driver["Surname"] || driver["last name"] || driver["Name"] || "";
  return (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || Object.values(driver)[0]) || "Unknown";
}

function DriverJobCard({ booking, onComplete }: { booking: Booking; onComplete: (booking: Booking) => void }) {
  const [expanded, setExpanded] = useState(false);
  const status = booking["Status"] || "Confirmed";
  const journeyStatus = booking["Journey Status"] || "idle";
  const requestId = booking["Request ID"] || "";
  const displayFare = booking["Owner Fare"] || booking["Adjusted Fare"] || booking["NTA Max Fare"] || "0";

  const journeyLabel = journeyStatus === "completed" ? "Completed" :
    journeyStatus === "on-board" ? "In Progress" :
    journeyStatus === "en-route" ? "En Route" : "Pending";
  const journeyColor = journeyStatus === "completed" ? "bg-muted text-muted-foreground" :
    journeyStatus === "on-board" ? "bg-green-400/10 text-green-400" :
    journeyStatus === "en-route" ? "bg-blue-400/10 text-blue-400" : "bg-amber-400/10 text-amber-400";

  return (
    <div className="rounded-lg border border-border bg-background">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground">{requestId}</span>
          <span className="text-sm font-medium text-foreground">{booking["Customer Name"]}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${journeyColor}`}>
            {journeyLabel}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-foreground">{"\u20AC"}{displayFare}</span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 text-green-400" />
              <div>
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="text-sm font-medium text-foreground">{booking["Origin Address"] || booking["Pickup Eircode"] || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Navigation className="mt-0.5 h-3.5 w-3.5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Destination</p>
                <p className="text-sm font-medium text-foreground">{booking["Destination Address"] || booking["Destination Eircode"] || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Scheduled</p>
                <p className="text-sm font-medium text-foreground">{booking["Date"] || "-"}{booking["Time"] ? ` at ${booking["Time"]}` : ""}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Car className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Vehicle</p>
                <p className="text-sm font-medium text-foreground">{booking["Vehicle Type"] || "-"}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {status !== "Completed" && journeyStatus !== "completed" && (
              <a
                href={`/dispatch/${requestId}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Open Job Details
              </a>
            )}

            {status === "Confirmed" && journeyStatus !== "completed" && (
              <button
                type="button"
                onClick={() => onComplete(booking)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark as Complete
              </button>
            )}

            {(status === "Completed" || journeyStatus === "completed") && (
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
}

export function DriverJobsDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [expandedDriverIdx, setExpandedDriverIdx] = useState<number | null>(null);
  const [completing, setCompleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingsRes, driversRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/drivers"),
      ]);
      const bookingsData = await bookingsRes.json();
      const driversData = await driversRes.json();
      setBookings(bookingsData.bookings || []);
      setDrivers(driversData.drivers || []);
    } catch {
      setBookings([]);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCompleteJob = async (booking: Booking) => {
    if (!window.confirm("Mark this job as completed? This will update across the system.")) return;
    setCompleting(true);
    try {
      const requestId = booking["Request ID"];
      const rowIndex = booking["_rowIndex"];

      // Update status to Completed
      await fetch("/api/bookings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, field: "Status", value: "Completed", rowIndex }),
      });

      // Update journey status to completed
      await fetch("/api/dispatch/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          rowIndex,
          updates: {
            "Journey Status": "completed",
            "Status": "Completed",
            "Completion Timestamp": new Date().toISOString(),
          },
        }),
      });

      setBookings((prev) =>
        prev.map((b) =>
          b["Request ID"] === requestId
            ? { ...b, Status: "Completed", "Journey Status": "completed" }
            : b
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to complete job");
    } finally {
      setCompleting(false);
    }
  };

  // Get assigned bookings grouped by driver
  const assignedBookings = bookings.filter((b) => b["Driver Name"] && (b["Status"] === "Confirmed" || b["Status"] === "Completed"));

  const driversWithJobs = drivers.map((driver) => {
    const name = getDriverDisplayName(driver);
    const jobs = assignedBookings.filter((b) => b["Driver Name"] === name);
    const activeJobs = jobs.filter((b) => b["Status"] === "Confirmed");
    const completedJobs = jobs.filter((b) => b["Status"] === "Completed");
    return { driver, name, jobs, activeJobs, completedJobs };
  }).filter((d) => d.jobs.length > 0);

  const totalAssigned = assignedBookings.length;

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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Briefcase className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-xs font-semibold text-blue-400">
              {loading ? "..." : String(totalAssigned)}
            </span>
            <span className="ml-2 text-sm font-semibold text-foreground">Driver Jobs</span>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>

      {expanded && (
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading driver jobs...
            </div>
          ) : driversWithJobs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No jobs assigned yet. Use the Dispatch Dashboard to assign drivers to bookings.
            </p>
          ) : (
            <div className="space-y-4">
              {driversWithJobs.map((driverData, idx) => {
                const isDriverExpanded = expandedDriverIdx === idx;
                return (
                  <div key={idx} className="rounded-xl border border-border bg-card">
                    <button
                      type="button"
                      onClick={() => setExpandedDriverIdx(isDriverExpanded ? null : idx)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-400/10">
                          <User className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{driverData.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {driverData.activeJobs.length} active, {driverData.completedJobs.length} completed
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-xs font-semibold text-blue-400">
                          {driverData.jobs.length} job{driverData.jobs.length !== 1 ? "s" : ""}
                        </span>
                        {isDriverExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {isDriverExpanded && (
                      <div className="border-t border-border p-4">
                        {completing && (
                          <div className="mb-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Updating...
                          </div>
                        )}
                        <div className="space-y-2">
                          {driverData.jobs.map((booking, jobIdx) => (
                            <DriverJobCard
                              key={jobIdx}
                              booking={booking}
                              onComplete={handleCompleteJob}
                            />
                          ))}
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
  );
}
