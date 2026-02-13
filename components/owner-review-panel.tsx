"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MessageCircle, Edit3, Loader2, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Clock, MapPin, Car, Users as UsersIcon,
  Send, Phone, Navigation, UserPlus, User, ClipboardList, Search,
  ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";

interface Booking {
  [key: string]: string;
}

interface Driver {
  [key: string]: string;
}

function normalizeIrishPhone(phone: string): string {
  const cleaned = phone?.replace(/\s/g, "") || "";
  if (cleaned.startsWith("353")) return cleaned;
  if (cleaned.startsWith("+353")) return cleaned.replace("+", "");
  if (cleaned.startsWith("0")) return cleaned.replace(/^0/, "353");
  if (cleaned.startsWith("8")) return `353${cleaned}`;
  return cleaned;
}

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

function formatRequestTimestamp(isoStr: string): string {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;
    const minStr = minutes === 0 ? "" : `.${minutes.toString().padStart(2, "0")}`;
    return `${day} ${month} ${year} ${hours}${minStr}${ampm}`;
  } catch {
    return isoStr;
  }
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

export function OwnerReviewPanel() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [fareOverrides, setFareOverrides] = useState<Record<string, string>>({});
  const [confirmSentTimes, setConfirmSentTimes] = useState<Record<string, string>>({});
  const [savingFare, setSavingFare] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [assigningDriver, setAssigningDriver] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("pickupDateTime");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [dashboardCollapsed, setDashboardCollapsed] = useState(false);
  const [settingUpHeaders, setSettingUpHeaders] = useState(false);
  const [quoteComments, setQuoteComments] = useState<Record<string, string>>({});

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

  const handleSaveFare = async (requestId: string, rowIndex?: string) => {
    const fare = fareOverrides[requestId];
    if (!fare) return;
    setSavingFare(requestId);
    try {
      const res = await fetch("/api/bookings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, field: "Owner Fare", value: fare, rowIndex }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBookings((prev) =>
        prev.map((b) =>
          (rowIndex && b["_rowIndex"] === rowIndex) || b["Request ID"] === requestId
            ? { ...b, "Owner Fare": fare }
            : b
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save fare");
    } finally {
      setSavingFare(null);
    }
  };

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

  const generateWhatsAppLink = (booking: Booking) => {
    const phone = normalizeIrishPhone(booking["Phone"] || "");
    const name = booking["Customer Name"] || "there";
    const requestId = booking["Request ID"];
    const fare = fareOverrides[requestId] || booking["Owner Fare"] || booking["Adjusted Fare"] || booking["NTA Max Fare"];
    const vehicle = booking["Vehicle Type"] || "";
    const from = booking["Origin Address"] || booking["Pickup Eircode"] || "";
    const to = booking["Destination Address"] || booking["Destination Eircode"] || "";
    const date = booking["Date"] || "";
    const time = booking["Time"] || "";
    const dateStr = date ? ` on ${date}${time ? ` at ${time}` : ""}` : "";

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const rowIndex = booking["_rowIndex"] || "";
    const confirmUrl = `${baseUrl}/confirm/${requestId}?row=${rowIndex}`;

    const comment = quoteComments[requestId] || "";
    let message = `Hi ${name},\n\nThank you for reaching out to Redmond Chauffeur Drive.\n\nRegarding your booking Request ${requestId}, the Fare for our ${vehicle} from ${from} to ${to}${dateStr} is \u20AC${fare}.`;
    if (comment.trim()) {
      message += `\n\n${comment.trim()}`;
    }
    message += `\n\nPlease confirm your booking or cancel your request here:\n${confirmUrl}\n\nKind regards,\nRedmond Chauffeur Drive`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const generateRejectMessage = (booking: Booking) => {
    const phone = normalizeIrishPhone(booking["Phone"] || "");
    const name = booking["Customer Name"] || "there";
    const requestId = booking["Request ID"];
    const comment = quoteComments[requestId] || "";
    let message = `Hi ${name},\n\nThank you for your enquiry with Redmond Chauffeur Drive (Ref: ${requestId}). We appreciate your interest in our services.`;
    if (comment.trim()) {
      message += `\n\n${comment.trim()}`;
    }
    message += `\n\nIf you would like to submit a new booking request for a different date or time, you are very welcome to do so via our booking page.\n\nKind regards,\nRedmond Chauffeur Drive`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  // Keep for confirmed booking cancellations
  const generateCancelMessage = (booking: Booking) => {
    const phone = normalizeIrishPhone(booking["Phone"] || "");
    const name = booking["Customer Name"] || "there";
    const message = `Hi ${name},\n\nWe regret to inform you that your confirmed booking with Redmond Chauffeur Drive has been cancelled.\n\nShould you require chauffeur services in the future, please do not hesitate to contact us.\n\nKind regards,\nRedmond Chauffeur Drive`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const generateConfirmMessage = (booking: Booking) => {
    const phone = normalizeIrishPhone(booking["Phone"] || "");
    const name = booking["Customer Name"] || "there";
    const requestId = booking["Request ID"];
    const fare = fareOverrides[requestId] || booking["Owner Fare"] || booking["Adjusted Fare"] || booking["NTA Max Fare"];
    const vehicle = booking["Vehicle Type"] || "";
    const from = booking["Origin Address"] || booking["Pickup Eircode"] || "";
    const to = booking["Destination Address"] || booking["Destination Eircode"] || "";
    const date = booking["Date"] || "";
    const time = booking["Time"] || "";
    const dateStr = date ? `\nRequested Date: ${date}${time ? ` at ${time}` : ""}` : "";
    const confirmedAt = new Date().toLocaleString("en-IE", { dateStyle: "medium", timeStyle: "short" });

    const message = `Hi ${name},\n\nYour booking is confirmed!\n\nBooking Ref: ${requestId}\nVehicle: ${vehicle}\nFrom: ${from}\nTo: ${to}${dateStr}\nFare: \u20AC${fare}\nConfirmed At: ${confirmedAt}\n\nYour driver will contact you before pickup. Thank you for choosing Redmond Chauffeur Drive.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const toPickupMinutes = (dateStr: string, timeStr: string): number => {
    if (!dateStr) return 999999999;
    const [y, m, d] = dateStr.split("-").map(Number);
    const t = (timeStr || "0:00").trim();
    const [h, min] = t.split(":").map(Number);
    return ((y * 10000 + m * 100 + d) * 10000) + ((h || 0) * 60 + (min || 0));
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const filteredBookings = (filterStatus === "all"
    ? bookings
    : bookings.filter((b) => b["Status"] === filterStatus)
  ).filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (b["Customer Name"] || "").toLowerCase().includes(q) ||
      (b["Request ID"] || "").toLowerCase().includes(q) ||
      (b["Phone"] || "").toLowerCase().includes(q) ||
      (b["Origin Address"] || "").toLowerCase().includes(q) ||
      (b["Destination Address"] || "").toLowerCase().includes(q) ||
      (b["Status"] || "").toLowerCase().includes(q) ||
      (b["Vehicle Type"] || "").toLowerCase().includes(q)
    );
  }).sort((a, b) => {
    const dir = sortDirection === "asc" ? 1 : -1;
    switch (sortColumn) {
      case "requested":
        return dir * (new Date(a["Timestamp"] || 0).getTime() - new Date(b["Timestamp"] || 0).getTime());
      case "requestId":
        return dir * (a["Request ID"] || "").localeCompare(b["Request ID"] || "");
      case "name":
        return dir * (a["Customer Name"] || "").localeCompare(b["Customer Name"] || "");
      case "pickupDateTime":
        return dir * (toPickupMinutes(a["Date"], a["Time"]) - toPickupMinutes(b["Date"], b["Time"]));
      case "status":
        return dir * (a["Status"] || "").localeCompare(b["Status"] || "");
      case "driver":
        return dir * (a["Driver Name"] || "").localeCompare(b["Driver Name"] || "");
      case "fare": {
        const fareA = parseFloat(a["Owner Fare"] || a["Adjusted Fare"] || a["NTA Max Fare"] || "0");
        const fareB = parseFloat(b["Owner Fare"] || b["Adjusted Fare"] || b["NTA Max Fare"] || "0");
        return dir * (fareA - fareB);
      }
      default:
        return dir * (toPickupMinutes(a["Date"], a["Time"]) - toPickupMinutes(b["Date"], b["Time"]));
    }
  });

  const statusColor = (status: string) => {
    switch (status) {
      case "Requested": return "bg-amber-400/10 text-amber-400 border border-amber-400/20";
      case "Quoted": return "bg-blue-400/10 text-blue-400 border border-blue-400/20";
      case "Confirmed": return "bg-green-400/10 text-green-400 border border-green-400/20";
      case "Cancelled": return "bg-red-400/10 text-red-400 border border-red-400/20";
      case "Completed": return "bg-muted text-muted-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const statusCounts = {
    all: bookings.length,
    Requested: bookings.filter((b) => b["Status"] === "Requested").length,
    Quoted: bookings.filter((b) => b["Status"] === "Quoted").length,
    Confirmed: bookings.filter((b) => b["Status"] === "Confirmed").length,
    Cancelled: bookings.filter((b) => b["Status"] === "Cancelled").length,
    Completed: bookings.filter((b) => b["Status"] === "Completed").length,
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
          <ClipboardList className="h-5 w-5 text-accent" />
          Booking Management Dashboard
        </h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading bookings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => setDashboardCollapsed(!dashboardCollapsed)} className="flex items-center gap-2 text-left">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
            <ClipboardList className="h-5 w-5 text-accent" />
            Booking Management Dashboard
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
              {filteredBookings.length}
            </span>
          </h2>
          <span className="text-[10px] text-muted-foreground/60">{dashboardCollapsed ? "Expand List" : "Collapse List"}</span>
          {dashboardCollapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
        </button>

      </div>

      {!dashboardCollapsed && (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Search</span>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookings..."
              className="rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none w-44 sm:w-56"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-muted-foreground/30 bg-secondary px-3 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none"
          >
            <option value="all">All Statuses ({statusCounts.all})</option>
            <option value="Requested">Requested ({statusCounts.Requested})</option>
            <option value="Quoted">Quoted ({statusCounts.Quoted})</option>
            <option value="Confirmed">Confirmed ({statusCounts.Confirmed})</option>
            <option value="Cancelled">Cancelled ({statusCounts.Cancelled})</option>
            <option value="Completed">Completed ({statusCounts.Completed})</option>
          </select>
          <button type="button" onClick={() => { fetchBookings(); fetchDrivers(); }} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground">
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {filteredBookings.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No bookings found.</p>
      ) : (
        <div className="space-y-3">
          {/* Column Headers - clickable to sort */}
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2 rounded-lg">
            <div className="flex items-center gap-2 sm:gap-4">
              <button type="button" onClick={() => handleSort("requested")} className="flex w-28 sm:w-32 items-center gap-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                Requested {getSortIcon("requested")}
              </button>
              <button type="button" onClick={() => handleSort("requestId")} className="flex w-16 sm:w-20 items-center gap-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                Request ID {getSortIcon("requestId")}
              </button>
              <button type="button" onClick={() => handleSort("name")} className="flex w-24 sm:w-32 items-center gap-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                Name {getSortIcon("name")}
              </button>
              <button type="button" onClick={() => handleSort("pickupDateTime")} className="flex w-28 sm:w-36 items-center gap-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                Pickup Date/Time {getSortIcon("pickupDateTime")}
              </button>
              <button type="button" onClick={() => handleSort("status")} className="flex w-20 sm:w-24 items-center gap-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                Status {getSortIcon("status")}
              </button>
              <button type="button" onClick={() => handleSort("driver")} className="hidden sm:flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                Driver {getSortIcon("driver")}
              </button>
            </div>
            <button type="button" onClick={() => handleSort("fare")} className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
              Fare {getSortIcon("fare")}
            </button>
          </div>

          {filteredBookings.map((booking) => {
            const requestId = booking["Request ID"];
            const uniqueKey = booking["_rowIndex"] || requestId;
            const isExpanded = expandedBooking === uniqueKey;
            const status = booking["Status"] || "Requested";
            const ownerFare = booking["Owner Fare"] || "";
            const displayFare = ownerFare || booking["Adjusted Fare"] || booking["NTA Max Fare"] || "0";
            const assignedDriver = booking["Driver Name"] || "";

            return (
              <div key={uniqueKey} className="rounded-lg border border-border bg-background">
                <button type="button" onClick={() => setExpandedBooking(isExpanded ? null : uniqueKey)} className="flex w-full items-center justify-between px-4 py-3 text-left">
                  <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-4">
                    <span className="w-28 sm:w-32 shrink-0 text-xs text-muted-foreground">{formatRequestTimestamp(booking["Timestamp"])}</span>
                    <span className="w-16 sm:w-20 shrink-0 font-mono text-xs text-muted-foreground">{requestId}</span>
                    <span className="w-24 sm:w-32 shrink-0 truncate text-sm font-medium text-foreground">{booking["Customer Name"]}</span>
                    <span className="flex w-36 shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {booking["Date"] ? `${formatPickupDate(booking["Date"])}${booking["Time"] ? ` ${formatPickupTime(booking["Time"])}` : ""}` : "No date set"}
                    </span>
                    <span className={`w-24 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-medium ${statusColor(status)}`}>
                      {status}
                    </span>
                    {assignedDriver && (
                      <span className="flex items-center gap-1 rounded-full bg-blue-400/10 px-2 py-0.5 text-xs font-medium text-blue-400">
                        <User className="h-3 w-3" />
                        {assignedDriver}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{"\u20AC"}{displayFare}</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    {/* Booking Details */}
                    <div className="mb-4 grid gap-3 sm:grid-cols-2">
                      <div className="flex items-start gap-2">
                        <Phone className="mt-0.5 h-3.5 w-3.5 text-accent" />
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium text-foreground">{booking["Phone"] || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 text-accent" />
                        <div>
                          <p className="text-xs text-muted-foreground">From</p>
                          <p className="text-sm font-medium text-foreground">{booking["Origin Address"] || booking["Pickup Eircode"]}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Navigation className="mt-0.5 h-3.5 w-3.5 text-accent" />
                        <div>
                          <p className="text-xs text-muted-foreground">To</p>
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
                      {booking["Date"] && (
                        <div className="flex items-start gap-2">
                          <Clock className="mt-0.5 h-3.5 w-3.5 text-accent" />
                          <div>
                            <p className="text-xs text-muted-foreground">Date/Time</p>
                            <p className="text-sm font-medium text-foreground">{formatPickupDate(booking["Date"])}{booking["Time"] ? ` at ${formatPickupTime(booking["Time"])}` : ""}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <UsersIcon className="mt-0.5 h-3.5 w-3.5 text-accent" />
                        <div>
                          <p className="text-xs text-muted-foreground">Passengers</p>
                          <p className="text-sm font-medium text-foreground">{booking["Pax"] || booking["Passengers"] || "1"}</p>
                        </div>
                      </div>
                    </div>

                    {booking["General Query"] && (
                      <div className="mb-4 rounded-lg bg-secondary/30 p-3">
                        <p className="text-xs font-semibold text-foreground">General Query</p>
                        <p className="text-sm text-muted-foreground">{booking["General Query"]}</p>
                      </div>
                    )}

                    {/* Fare Details */}
                    <div className="mb-4">
                      <div className="mb-2 text-xs text-muted-foreground">
                        <span>Distance: {booking["Distance KM"]} km ({booking["Travel Time"]} mins)</span>
                      </div>

                      {/* NTA Fare Range */}
                      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-secondary/50 p-2">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">NTA Low</p>
                          <p className="text-sm font-bold text-foreground">{"\u20AC"}{booking["NTA Fare Low"] || booking["NTA Max Fare"]}</p>
                        </div>
                        <div className="rounded-lg bg-secondary/50 p-2">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">NTA High</p>
                          <p className="text-sm font-bold text-foreground">{"\u20AC"}{booking["NTA Fare High"] || booking["NTA Max Fare"]}</p>
                        </div>
                        <div className="rounded-lg bg-accent/10 p-2">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-accent">Premium</p>
                          <p className="text-sm font-bold text-accent">{"\u20AC"}{booking["Premium Fare"] || Math.round(Number(booking["NTA Max Fare"] || 0) * 1.2)}</p>
                        </div>
                      </div>

                      <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
                        <label htmlFor={`fare-${requestId}`} className="mb-1 block text-xs font-semibold text-foreground">
                          Your Fare (manual override)
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-foreground">{"\u20AC"}</span>
                          <input
                            id={`fare-${requestId}`}
                            type="number"
                            value={fareOverrides[requestId] ?? ownerFare}
                            onChange={(e) => setFareOverrides((prev) => ({ ...prev, [requestId]: e.target.value }))}
                            placeholder={displayFare}
                            className="w-full rounded-lg border border-muted-foreground/30 bg-secondary px-3 py-2 text-lg font-bold text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                            step="1"
                            min="0"
                          />
                        </div>
                        <p className="mt-1.5 text-[10px] text-muted-foreground">NTA range: {"\u20AC"}{booking["NTA Fare Low"] || booking["NTA Max Fare"]} - {"\u20AC"}{booking["NTA Fare High"] || booking["NTA Max Fare"]} | Suggested premium: {"\u20AC"}{booking["Premium Fare"] || Math.round(Number(booking["NTA Max Fare"] || 0) * 1.2)}</p>
                      </div>
                    </div>

                    {/* Driver Assignment - shown for Confirmed and Completed bookings */}
                    {(status === "Confirmed" || status === "Completed") && (
                      <div className="mb-4 rounded-lg border border-blue-400/20 bg-blue-400/5 p-3">
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
                        {assignedDriver && status !== "Completed" && (
                          <a
                            href={`/dispatch/${requestId}`}
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90"
                          >
                            <User className="h-4 w-4" />
                            {assignedDriver} - Open Driver Dispatch
                          </a>
                        )}
                      </div>
                    )}

                    {/* Quote Comment */}
                    {(status === "Requested" || status === "Quoted") && (
                      <div className="mb-3">
                        <label htmlFor={`comment-${requestId}`} className="mb-1 block text-xs font-semibold text-muted-foreground">
                          Add comment to message (optional)
                        </label>
                        <textarea
                          id={`comment-${requestId}`}
                          value={quoteComments[requestId] || ""}
                          onChange={(e) => setQuoteComments((prev) => ({ ...prev, [requestId]: e.target.value }))}
                          placeholder="e.g. Not available at 10:30 but free from 11:00 / Do you require two cars? / Available from Cork only..."
                          rows={2}
                          className="w-full rounded-lg border border-muted-foreground/30 bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {status === "Requested" && (
                        <a
                          href={generateWhatsAppLink(booking)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            const manualFare = fareOverrides[requestId];
                            if (manualFare) {
                              handleSaveFare(requestId, uniqueKey);
                            }
                            handleStatusUpdate(requestId, "Quoted", uniqueKey);
                          }}
                          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Send Quote via WhatsApp
                        </a>
                      )}

                      {status === "Quoted" && (
                        <a href={generateWhatsAppLink(booking)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700">
                          <MessageCircle className="h-4 w-4" />
                          Resend Quote via WhatsApp
                        </a>
                      )}

                      {status === "Confirmed" && (() => {
                        const replyMethod = (booking["Preferred Reply"] || "whatsapp") === "email" ? "Email" : "WhatsApp";
                        const sentTime = confirmSentTimes[uniqueKey];

                        return (
                          <>
                            <div className="flex w-full gap-2">
                              <a
                                href={generateConfirmMessage(booking)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setConfirmSentTimes((prev) => ({ ...prev, [uniqueKey]: new Date().toLocaleString("en-IE", { dateStyle: "medium", timeStyle: "short" }) }))}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white ${sentTime ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                              >
                                <Send className="h-4 w-4" />
                                {sentTime ? `Sent Confirmation via ${replyMethod} on ${sentTime}` : `Send Confirmation via ${replyMethod}`}
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to cancel this confirmed booking?")) {
                                    handleStatusUpdate(requestId, "Cancelled", uniqueKey);
                                    window.open(generateCancelMessage(booking), "_blank");
                                  }
                                }}
                                disabled={updatingStatus === requestId}
                                className="flex items-center justify-center gap-2 rounded-lg border border-red-400/30 bg-transparent px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-400/10 disabled:opacity-50"
                              >
                                <XCircle className="h-4 w-4" />
                                Cancel Booking
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm("Has this job been completed? This action cannot be undone.")) {
                                  handleStatusUpdate(requestId, "Completed", uniqueKey);
                                }
                              }}
                              disabled={updatingStatus === requestId}
                              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              {updatingStatus === requestId ? "Updating..." : "Mark Job Complete"}
                            </button>
                          </>
                        );
                      })()}

                      {status === "Completed" && (
                        <p className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-400/10 px-4 py-2.5 text-xs font-medium text-green-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Job Completed{assignedDriver ? ` - Driver: ${assignedDriver}` : ""}
                        </p>
                      )}

                      {(status === "Requested" || status === "Quoted") && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Reject this job and notify the client via WhatsApp?")) {
                              handleStatusUpdate(requestId, "Cancelled", uniqueKey);
                              window.open(generateRejectMessage(booking), "_blank");
                            }
                          }}
                          disabled={updatingStatus === requestId}
                          className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-transparent px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-400/10 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject Job
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
      </>
      )}
    </div>
  );
}
