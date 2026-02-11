"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Car, MapPin, Calendar, Clock } from "lucide-react";

interface BookingData {
  "Request ID": string;
  "Customer Name": string;
  "Phone": string;
  "Email": string;
  "Pickup Eircode": string;
  "Destination Eircode": string;
  "Vehicle Type": string;
  "Date": string;
  "Time": string;
  "Pax": string;
  "Distance KM": string;
  "Travel Time": string;
  "NTA Max Fare": string;
  "Adjusted Fare": string;
  "Owner Fare": string;
  "Status": string;
  "Origin Address": string;
  "Destination Address": string;
  [key: string]: string;
}

export default function ConfirmBookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingId = params.bookingId as string;
  const rowParam = searchParams.get("row");

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionDone, setActionDone] = useState<"confirmed" | "cancelled" | null>(null);

  const fetchBooking = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Find by row index first (unique), then fall back to Request ID
      let found: BookingData | undefined;
      if (rowParam) {
        found = data.bookings?.find((b: BookingData) => b["_rowIndex"] === rowParam);
      }
      if (!found) {
        found = data.bookings?.find((b: BookingData) => b["Request ID"] === bookingId);
      }
      if (!found) throw new Error("Booking not found");
      setBooking(found);

      if (found["Status"] === "Confirmed") setActionDone("confirmed");
      else if (found["Status"] === "Cancelled") setActionDone("cancelled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load booking");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleAction = async (action: "confirm" | "cancel") => {
    setActionLoading(true);
    try {
      const newStatus = action === "confirm" ? "Confirmed" : "Cancelled";
      const res = await fetch("/api/bookings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: bookingId,
          field: "Status",
          value: newStatus,
          rowIndex: booking?.["_rowIndex"] || rowParam || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionDone(action === "confirm" ? "confirmed" : "cancelled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update booking");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <span className="text-muted-foreground">Loading booking details...</span>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-xl font-semibold text-foreground">Booking Not Found</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error || "This booking reference could not be found."}</p>
        </div>
      </div>
    );
  }

  const displayFare = booking["Owner Fare"] || booking["Adjusted Fare"] || booking["NTA Max Fare"] || "0";
  const preferredReply = booking["Preferred Reply"] || "whatsapp";
  const replyMethod = preferredReply === "email" ? "email" : "WhatsApp";
  const confirmationTime = new Date().toLocaleString("en-IE", { dateStyle: "medium", timeStyle: "short" });

  // Already confirmed or cancelled
  if (actionDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
          {actionDone === "confirmed" ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-foreground">Booking Confirmed</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Thank you, {booking["Customer Name"]}! Your booking <span className="font-mono font-bold">{bookingId}</span> has been confirmed.
              </p>
              <div className="mt-5 rounded-lg bg-secondary/30 p-4 text-left text-sm">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">From</p>
                      <p className="font-medium text-foreground">{booking["Origin Address"] || booking["Pickup Eircode"]}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">To</p>
                      <p className="font-medium text-foreground">{booking["Destination Address"] || booking["Destination Eircode"]}</p>
                    </div>
                  </div>
                  {booking["Date"] && (
                    <div className="flex items-start gap-2">
                      <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <div>
                        <p className="text-xs text-muted-foreground">Requested Date & Time</p>
                        <p className="font-medium text-foreground">{booking["Date"]}{booking["Time"] ? ` at ${booking["Time"]}` : ""}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">Confirmed At</p>
                      <p className="font-medium text-foreground">{confirmationTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-accent" />
                    <span className="text-foreground">{booking["Vehicle Type"]}</span>
                  </div>
                  <div className="border-t border-border pt-2">
                    <p className="text-lg font-bold text-accent">{"\u20AC"}{displayFare}</p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Your booking confirmation will be sent to you via <strong>{replyMethod}</strong>. Your driver details will also be shared before your pickup.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Thank you for choosing Redmond Chauffeur Drive.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <XCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-foreground">Booking Cancelled</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Thank you for your enquiry, {booking["Customer Name"]}. Your booking <span className="font-mono font-bold">{bookingId}</span> has been cancelled.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                We appreciate you considering Redmond Chauffeur Drive. Should you need our services in the future, please do not hesitate to get in touch.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Show confirm/cancel options
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Redmond Chauffeur Drive</h2>
          <p className="mt-1 text-sm text-muted-foreground">Booking Quote for Reference <span className="font-mono font-bold">{bookingId}</span></p>
        </div>

        <div className="mt-6 rounded-lg bg-secondary/30 p-5 text-sm">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer:</span>
              <span className="font-medium text-foreground">{booking["Customer Name"]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">From:</span>
              <span className="text-right font-medium text-foreground">{booking["Origin Address"] || booking["Pickup Eircode"]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">To:</span>
              <span className="text-right font-medium text-foreground">{booking["Destination Address"] || booking["Destination Eircode"]}</span>
            </div>
            {booking["Date"] && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium text-foreground">{booking["Date"]}{booking["Time"] ? ` at ${booking["Time"]}` : ""}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vehicle:</span>
              <span className="font-medium text-foreground">{booking["Vehicle Type"]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Distance:</span>
              <span className="font-medium text-foreground">{booking["Distance KM"]} km ({booking["Travel Time"]} mins)</span>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-foreground">Exact Fare:</span>
                <span className="text-accent">{"\u20AC"}{displayFare}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Would you like to confirm this booking?
        </p>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => handleAction("confirm")}
            disabled={actionLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Confirm Booking
          </button>
          <button
            type="button"
            onClick={() => handleAction("cancel")}
            disabled={actionLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
