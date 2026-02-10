"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppHeader } from "@/components/app-header";
import { BookingForm } from "@/components/booking-form";
import { NTAInfoPanel } from "@/components/nta-info-panel";
import { OwnerReviewPanel } from "@/components/owner-review-panel";
import { DispatchDashboard } from "@/components/dispatch-dashboard";
import { DriverFleetDashboard } from "@/components/driver-fleet-dashboard";
import {
  CalendarCheck,
  RefreshCw, ChevronDown, ChevronUp, Loader2,
} from "lucide-react";

interface SheetRecord {
  [key: string]: string;
}

export default function Home() {
  const [bookings, setBookings] = useState<SheetRecord[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsExpanded, setBookingsExpanded] = useState(false);

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch bookings");
      setBookings(data.bookings || []);
    } catch {
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Booking Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create bookings, calculate fares, and manage dispatch.</p>
        </div>

        {/* All Booking Requests - Full Width */}
        <div className="mb-8 rounded-xl border border-border bg-card">
          <div className="flex w-full items-center justify-between px-5 py-4">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setBookingsExpanded(!bookingsExpanded)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setBookingsExpanded(!bookingsExpanded); }}
              className="flex cursor-pointer items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <CalendarCheck className="h-5 w-5 text-accent" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-foreground">
                  {bookingsLoading ? "..." : String(bookings.length)}
                </p>
                <p className="text-xs text-muted-foreground">All Booking Requests</p>
              </div>
              {bookingsExpanded ? <ChevronUp className="ml-2 h-5 w-5 text-muted-foreground" /> : <ChevronDown className="ml-2 h-5 w-5 text-muted-foreground" />}
            </div>
            <button
              type="button"
              onClick={() => fetchBookings()}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
          {bookingsExpanded && (
            <div className="border-t border-border px-5 pb-5">
              {bookingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading bookings...</span>
                </div>
              ) : bookings.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No bookings yet. Submit a booking request to get started.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="whitespace-nowrap px-2 py-2 font-semibold text-muted-foreground">Request ID</th>
                        <th className="whitespace-nowrap px-2 py-2 font-semibold text-muted-foreground">Customer</th>
                        <th className="whitespace-nowrap px-2 py-2 font-semibold text-muted-foreground">Phone</th>
                        <th className="whitespace-nowrap px-2 py-2 font-semibold text-muted-foreground">From</th>
                        <th className="whitespace-nowrap px-2 py-2 font-semibold text-muted-foreground">To</th>
                        <th className="whitespace-nowrap px-2 py-2 font-semibold text-muted-foreground">Vehicle</th>
                        <th className="whitespace-nowrap px-2 py-2 font-semibold text-muted-foreground">Date</th>
                        <th className="whitespace-nowrap px-2 py-2 font-semibold text-muted-foreground">Pax</th>
                        <th className="whitespace-nowrap px-2 py-2 font-semibold text-muted-foreground">Distance</th>
                        <th className="whitespace-nowrap px-2 py-2 font-semibold text-muted-foreground">Fare</th>
                        <th className="whitespace-nowrap px-2 py-2 font-semibold text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b, i) => {
                        const status = b["Status"] || "Requested";
                        const statusColor = status === "Confirmed" ? "text-green-600 bg-green-50" :
                          status === "Cancelled" ? "text-red-600 bg-red-50" :
                          status === "Quoted" ? "text-blue-600 bg-blue-50" :
                          status === "Completed" ? "text-primary bg-primary/10" :
                          "text-amber-600 bg-amber-50";
                        return (
                          <tr key={i} className="border-b border-border/50 hover:bg-secondary/30">
                            <td className="whitespace-nowrap px-2 py-2 font-mono font-medium text-foreground">{b["Request ID"] || "-"}</td>
                            <td className="whitespace-nowrap px-2 py-2 text-foreground">{b["Customer Name"] || "-"}</td>
                            <td className="whitespace-nowrap px-2 py-2 text-foreground">{b["Phone"] || "-"}</td>
                            <td className="px-2 py-2 text-foreground max-w-[140px] truncate">{b["Origin Address"] || b["Pickup Eircode"] || "-"}</td>
                            <td className="px-2 py-2 text-foreground max-w-[140px] truncate">{b["Destination Address"] || b["Destination Eircode"] || "-"}</td>
                            <td className="whitespace-nowrap px-2 py-2 text-foreground">{b["Vehicle Type"] || "-"}</td>
                            <td className="whitespace-nowrap px-2 py-2 text-foreground">{b["Date"] || "-"}{b["Time"] ? ` ${b["Time"]}` : ""}</td>
                            <td className="whitespace-nowrap px-2 py-2 text-center text-foreground">{b["Pax"] || "-"}</td>
                            <td className="whitespace-nowrap px-2 py-2 text-foreground">{b["Distance KM"] ? `${b["Distance KM"]} km` : "-"}{b["Travel Time"] ? ` (${b["Travel Time"]} min)` : ""}</td>
                            <td className="whitespace-nowrap px-2 py-2 font-medium text-foreground">{b["Owner Fare"] ? `\u20AC${b["Owner Fare"]}` : b["Adjusted Fare"] ? `\u20AC${b["Adjusted Fare"]}` : "-"}</td>
                            <td className="whitespace-nowrap px-2 py-2">
                              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>{status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-8">
          <DriverFleetDashboard />
        </div>

        <div className="mb-8">
          <BookingForm />
        </div>

        <div>
          <OwnerReviewPanel />
        </div>

        <div className="mt-8">
          <DispatchDashboard />
        </div>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8">
          <p className="text-center text-xs text-muted-foreground">
            {"Redmond Chauffeur Drive - Booking & Dispatch System v1.0"}
          </p>
        </div>
      </footer>
    </div>
  );
}
