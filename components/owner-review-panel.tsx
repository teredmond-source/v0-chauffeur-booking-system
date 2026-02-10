"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MessageCircle, Edit3, Loader2, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Clock, MapPin, Car, Users as UsersIcon,
  Send, Phone, Navigation,
} from "lucide-react";

interface Booking {
  [key: string]: string;
}

export function OwnerReviewPanel() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [fareOverrides, setFareOverrides] = useState<Record<string, string>>({});
  const [savingFare, setSavingFare] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [settingUpHeaders, setSettingUpHeaders] = useState(false);

  const handleSetupHeaders = async () => {
    setSettingUpHeaders(true);
    try {
      const res = await fetch("/api/setup-headers", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`Headers setup complete: ${data.message}`);
      fetchBookings();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to set up headers");
    } finally {
      setSettingUpHeaders(false);
    }
  };

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

  const handleSaveFare = async (requestId: string) => {
    const fare = fareOverrides[requestId];
    if (!fare) return;
    setSavingFare(requestId);
    try {
      const res = await fetch("/api/bookings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, field: "Owner Fare", value: fare }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Update local state
      setBookings((prev) =>
        prev.map((b) =>
          b["Request ID"] === requestId ? { ...b, "Owner Fare": fare } : b
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save fare");
    } finally {
      setSavingFare(null);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    setUpdatingStatus(requestId);
    try {
      const res = await fetch("/api/bookings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, field: "Status", value: newStatus }),
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

  const generateWhatsAppLink = (booking: Booking) => {
    const phone = booking["Phone"]?.replace(/\s/g, "").replace(/^0/, "353");
    const name = booking["Customer Name"] || "there";
    const requestId = booking["Request ID"];
    const fare = booking["Owner Fare"] || booking["Adjusted Fare"] || booking["NTA Max Fare"];
    const vehicle = booking["Vehicle Type"] || "";
    const from = booking["Origin Address"] || booking["Pickup Eircode"] || "";
    const to = booking["Destination Address"] || booking["Destination Eircode"] || "";
    const date = booking["Date"] || "";
    const time = booking["Time"] || "";
    const dateStr = date ? ` on ${date}${time ? ` at ${time}` : ""}` : "";

    // Get the confirmation page URL
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const confirmUrl = `${baseUrl}/confirm/${requestId}`;

    const message = `Hi ${name},\n\nThank you for reaching out to Redmond Chauffeur Drive.\n\nRegarding your booking Request ${requestId}, the Exact Fare for our ${vehicle} from ${from} to ${to}${dateStr} is \u20AC${fare}.\n\nPlease confirm or cancel your booking here:\n${confirmUrl}\n\nKind regards,\nRedmond Chauffeur Drive`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const generateCancelMessage = (booking: Booking) => {
    const phone = booking["Phone"]?.replace(/\s/g, "").replace(/^0/, "353");
    const name = booking["Customer Name"] || "there";
    const message = `Hi ${name},\n\nThank you for your enquiry with Redmond Chauffeur Drive. We appreciate your interest in our services.\n\nShould you require chauffeur services in the future, please do not hesitate to contact us.\n\nKind regards,\nRedmond Chauffeur Drive`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const generateConfirmMessage = (booking: Booking) => {
    const phone = booking["Phone"]?.replace(/\s/g, "").replace(/^0/, "353");
    const name = booking["Customer Name"] || "there";
    const requestId = booking["Request ID"];
    const fare = booking["Owner Fare"] || booking["Adjusted Fare"] || booking["NTA Max Fare"];
    const vehicle = booking["Vehicle Type"] || "";
    const driver = booking["Assigned Driver"] || "your assigned driver";
    const from = booking["Origin Address"] || booking["Pickup Eircode"] || "";
    const to = booking["Destination Address"] || booking["Destination Eircode"] || "";
    const date = booking["Date"] || "";
    const time = booking["Time"] || "";
    const dateStr = date ? ` on ${date}${time ? ` at ${time}` : ""}` : "";

    const message = `Hi ${name},\n\nYour booking is confirmed!\n\nBooking: ${requestId}\nVehicle: ${vehicle}\nFrom: ${from}\nTo: ${to}${dateStr}\nFare: \u20AC${fare}\nDriver: ${driver}\n\nYour driver will contact you before pickup. Thank you for choosing Redmond Chauffeur Drive.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const filteredBookings = filterStatus === "all"
    ? bookings
    : bookings.filter((b) => b["Status"] === filterStatus);

  const statusColor = (status: string) => {
    switch (status) {
      case "Requested": return "bg-amber-100 text-amber-800";
      case "Quoted": return "bg-blue-100 text-blue-800";
      case "Confirmed": return "bg-green-100 text-green-800";
      case "Cancelled": return "bg-red-100 text-red-700";
      case "Completed": return "bg-muted text-muted-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Client Requests</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading bookings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">
          Client Requests
          <span className="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-accent/10 px-2 text-xs font-bold text-accent">
            {filteredBookings.length}
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Requested">Requested</option>
            <option value="Quoted">Quoted</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
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

      {filteredBookings.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No bookings found.</p>
      ) : (
        <div className="space-y-2">
          {filteredBookings.map((booking) => {
            const requestId = booking["Request ID"];
            const isExpanded = expandedBooking === requestId;
            const status = booking["Status"] || "Requested";
            const ownerFare = booking["Owner Fare"] || "";
            const displayFare = ownerFare || booking["Adjusted Fare"] || booking["NTA Max Fare"] || "0";

            return (
              <div key={requestId} className="rounded-lg border border-border bg-secondary/20">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                  onClick={() => setExpandedBooking(isExpanded ? null : requestId)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-accent">{requestId}</span>
                    <span className="text-sm font-medium text-foreground">{booking["Customer Name"]}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(status)}`}>
                      {status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground">{"\u20AC"}{displayFare}</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    {/* Booking Details */}
                    <div className="mb-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <div className="flex items-start gap-2">
                        <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="font-medium text-foreground">{booking["Phone"] || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                        <div>
                          <p className="text-xs text-muted-foreground">From</p>
                          <p className="font-medium text-foreground">{booking["Origin Address"] || booking["Pickup Eircode"]}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                        <div>
                          <p className="text-xs text-muted-foreground">To</p>
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
                      {booking["Date"] && (
                        <div className="flex items-start gap-2">
                          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Date/Time</p>
                            <p className="font-medium text-foreground">{booking["Date"]}{booking["Time"] ? ` at ${booking["Time"]}` : ""}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <UsersIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Passengers</p>
                          <p className="font-medium text-foreground">{booking["Pax"] || booking["Passengers"] || "1"}</p>
                        </div>
                      </div>
                    </div>

                    {booking["General Query"] && (
                      <div className="mb-4 rounded-lg bg-secondary/40 p-3">
                        <p className="text-xs font-medium text-muted-foreground">General Query</p>
                        <p className="mt-1 text-sm text-foreground">{booking["General Query"]}</p>
                      </div>
                    )}

                    {/* Fare Details */}
                    <div className="mb-4 rounded-lg bg-accent/5 border border-accent/20 p-4">
                      <div className="mb-3 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Distance: <strong className="text-foreground">{booking["Distance KM"]} km</strong> ({booking["Travel Time"]} mins)</span>
                        <span className="text-muted-foreground">NTA Max: <strong className="text-foreground">{"\u20AC"}{booking["NTA Max Fare"]}</strong></span>
                      </div>
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <label className="mb-1 block text-xs font-medium text-muted-foreground">
                            <Edit3 className="mr-1 inline h-3 w-3" />
                            Your Fare (manual override)
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-foreground">{"\u20AC"}</span>
                            <input
                              type="number"
                              value={fareOverrides[requestId] ?? ownerFare ?? displayFare}
                              onChange={(e) => setFareOverrides((prev) => ({ ...prev, [requestId]: e.target.value }))}
                              placeholder={displayFare}
                              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-lg font-bold text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                              step="1"
                              min="0"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSaveFare(requestId)}
                          disabled={savingFare === requestId || !fareOverrides[requestId]}
                          className="flex items-center gap-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
                        >
                          {savingFare === requestId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          Save
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {status === "Requested" && (
                        <a
                          href={generateWhatsAppLink(booking)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleStatusUpdate(requestId, "Quoted")}
                          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Send Quote via WhatsApp
                        </a>
                      )}

                      {status === "Quoted" && (
                        <a
                          href={generateWhatsAppLink(booking)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Resend Quote via WhatsApp
                        </a>
                      )}

                      {status === "Confirmed" && (
                        <>
                          <a
                            href={generateConfirmMessage(booking)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
                          >
                            <Send className="h-4 w-4" />
                            Send Confirmation via WhatsApp
                          </a>
                          <a
                            href={`/dispatch/${requestId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90"
                          >
                            <Navigation className="h-4 w-4" />
                            Driver Dispatch Link
                          </a>
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(requestId, "Completed")}
                            disabled={updatingStatus === requestId}
                            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Mark Completed
                          </button>
                        </>
                      )}

                      {(status === "Requested" || status === "Quoted") && (
                        <button
                          type="button"
                          onClick={() => {
                            handleStatusUpdate(requestId, "Cancelled");
                            window.open(generateCancelMessage(booking), "_blank");
                          }}
                          disabled={updatingStatus === requestId}
                          className="flex items-center gap-2 rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Cancel & Notify
                        </button>
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
