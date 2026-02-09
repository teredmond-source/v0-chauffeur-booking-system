"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
  User, Phone, Mail, MapPin, Car, Users, Calendar, Clock,
  FileText, ArrowRight, Loader2, CheckCircle2, Calculator, Route,
} from "lucide-react";

interface FareBreakdown {
  initialCharge: number;
  preBookingFee: number;
  tariffA: number;
  tariffB: number;
  totalFare: number;
  distanceKm: number;
  durationMinutes: number;
}

interface QuoteResult {
  distance: { km: number; minutes: number; originAddress: string; destinationAddress: string };
  fare: FareBreakdown;
}

interface BookingResult extends QuoteResult {
  bookingId: string;
}

const VEHICLE_TYPES = [
  "Saloon", "Estate", "MPV (6-seater)", "Executive", "Minibus (8-seater)", "Wheelchair Accessible",
];

function FareBreakdownDisplay({ fare, originAddress, destinationAddress }: { fare: FareBreakdown; originAddress: string; destinationAddress: string }) {
  const hours = Math.floor(fare.durationMinutes / 60);
  const mins = fare.durationMinutes % 60;
  const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-secondary/50 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex flex-col items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-full border-2 border-accent bg-accent" />
            <div className="h-8 w-px border-l-2 border-dashed border-muted-foreground/30" />
            <div className="h-2.5 w-2.5 rounded-full border-2 border-primary bg-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pickup</p>
              <p className="text-sm font-medium text-foreground">{originAddress}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Destination</p>
              <p className="text-sm font-medium text-foreground">{destinationAddress}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
          <div className="flex items-center gap-1.5">
            <Route className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">{fare.distanceKm} km</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">{durationText}</span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">NTA 2026 Fare Breakdown</h4>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Initial Charge (incl. 500m)</span>
            <span className="font-medium text-foreground">{"\u20AC"}{fare.initialCharge.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pre-Booking Fee</span>
            <span className="font-medium text-foreground">{"\u20AC"}{fare.preBookingFee.toFixed(2)}</span>
          </div>
          {fare.tariffA > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{"Tariff A (\u20AC1.32/km \u2264 15km)"}</span>
              <span className="font-medium text-foreground">{"\u20AC"}{fare.tariffA.toFixed(2)}</span>
            </div>
          )}
          {fare.tariffB > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{"Tariff B (\u20AC1.72/km > 15km)"}</span>
              <span className="font-medium text-foreground">{"\u20AC"}{fare.tariffB.toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-semibold text-foreground">NTA Maximum Fare</span>
          <span className="text-xl font-bold text-accent">{"\u20AC"}{fare.totalFare.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export function BookingForm() {
  const [formData, setFormData] = useState({
    customerName: "", phone: "", email: "",
    pickupEircode: "", destinationEircode: "",
    vehicleType: "Saloon", passengers: "1",
    pickupDate: "", pickupTime: "", notes: "",
  });
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "pickupEircode" || field === "destinationEircode") {
      setQuoteResult(null);
      setBookingResult(null);
    }
  };

  const handleGetQuote = async () => {
    if (!formData.pickupEircode || !formData.destinationEircode) {
      toast.error("Please enter both Pickup and Destination Eircodes.");
      return;
    }
    setIsQuoting(true);
    setQuoteResult(null);
    setBookingResult(null);
    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupEircode: formData.pickupEircode, destinationEircode: formData.destinationEircode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to get quote");
      setQuoteResult(data);
      toast.success("Quote calculated successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to get quote");
    } finally {
      setIsQuoting(false);
    }
  };

  const handleSubmitBooking = async () => {
    if (!formData.customerName) { toast.error("Customer Name is required."); return; }
    if (!formData.pickupEircode || !formData.destinationEircode) { toast.error("Both Eircodes are required."); return; }
    setIsBooking(true);
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit booking");
      setBookingResult(data);
      setQuoteResult(null);
      toast.success(`Booking ${data.bookingId} created and written to Google Sheets.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit booking");
    } finally {
      setIsBooking(false);
    }
  };

  const handleReset = () => {
    setFormData({ customerName: "", phone: "", email: "", pickupEircode: "", destinationEircode: "", vehicleType: "Saloon", passengers: "1", pickupDate: "", pickupTime: "", notes: "" });
    setQuoteResult(null);
    setBookingResult(null);
  };

  if (bookingResult) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
              <CheckCircle2 className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Booking Confirmed</h3>
              <p className="text-sm text-muted-foreground">Reference: <span className="font-mono font-semibold text-accent">{bookingResult.bookingId}</span></p>
            </div>
          </div>
          <FareBreakdownDisplay fare={bookingResult.fare} originAddress={bookingResult.distance.originAddress} destinationAddress={bookingResult.distance.destinationAddress} />
          <div className="mt-4 rounded-lg border border-border bg-card p-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Customer:</span> <span className="font-medium text-foreground">{formData.customerName}</span></div>
              <div><span className="text-muted-foreground">Vehicle:</span> <span className="font-medium text-foreground">{formData.vehicleType}</span></div>
              {formData.pickupDate && <div><span className="text-muted-foreground">Date:</span> <span className="font-medium text-foreground">{formData.pickupDate}</span></div>}
              {formData.pickupTime && <div><span className="text-muted-foreground">Time:</span> <span className="font-medium text-foreground">{formData.pickupTime}</span></div>}
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">This booking has been written to the Google Sheets database.</p>
        </div>
        <button type="button" onClick={handleReset} className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary">Create New Booking</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer Information</legend>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Customer Name *" value={formData.customerName} onChange={(e) => updateField("customerName", e.target.value)} className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="tel" placeholder="Phone Number" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
          </div>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="email" placeholder="Email Address" value={formData.email} onChange={(e) => updateField("email", e.target.value)} className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
          </div>
        </div>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Route</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
            <input type="text" placeholder="Pickup Eircode *" value={formData.pickupEircode} onChange={(e) => updateField("pickupEircode", e.target.value.toUpperCase())} className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm font-mono uppercase text-foreground placeholder:font-sans placeholder:normal-case placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
          </div>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <input type="text" placeholder="Destination Eircode *" value={formData.destinationEircode} onChange={(e) => updateField("destinationEircode", e.target.value.toUpperCase())} className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm font-mono uppercase text-foreground placeholder:font-sans placeholder:normal-case placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
          </div>
        </div>
        <button type="button" onClick={handleGetQuote} disabled={isQuoting || !formData.pickupEircode || !formData.destinationEircode} className="flex w-full items-center justify-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50">
          {isQuoting ? (<><Loader2 className="h-4 w-4 animate-spin" />Calculating Route...</>) : (<><Calculator className="h-4 w-4" />Get Fare Estimate</>)}
        </button>
      </fieldset>
      {quoteResult && (
        <div className="rounded-xl border border-accent/20 bg-card p-5">
          <FareBreakdownDisplay fare={quoteResult.fare} originAddress={quoteResult.distance.originAddress} destinationAddress={quoteResult.distance.destinationAddress} />
        </div>
      )}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trip Details</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="relative">
            <Car className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select value={formData.vehicleType} onChange={(e) => updateField("vehicleType", e.target.value)} className="h-11 w-full appearance-none rounded-lg border border-input bg-card pl-10 pr-10 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20">
              {VEHICLE_TYPES.map((type) => (<option key={type} value={type}>{type}</option>))}
            </select>
          </div>
          <div className="relative">
            <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select value={formData.passengers} onChange={(e) => updateField("passengers", e.target.value)} className="h-11 w-full appearance-none rounded-lg border border-input bg-card pl-10 pr-10 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20">
              {[1,2,3,4,5,6,7,8].map((n) => (<option key={n} value={n.toString()}>{n} {n === 1 ? "Passenger" : "Passengers"}</option>))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="date" value={formData.pickupDate} onChange={(e) => updateField("pickupDate", e.target.value)} className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
          </div>
          <div className="relative">
            <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="time" value={formData.pickupTime} onChange={(e) => updateField("pickupTime", e.target.value)} className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
          </div>
        </div>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Additional Notes</legend>
        <div className="relative">
          <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <textarea placeholder="Special requests, flight numbers, etc." value={formData.notes} onChange={(e) => updateField("notes", e.target.value)} rows={3} className="w-full rounded-lg border border-input bg-card pl-10 pr-4 pt-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
        </div>
      </fieldset>
      <button type="button" onClick={handleSubmitBooking} disabled={isBooking || !formData.customerName || !formData.pickupEircode || !formData.destinationEircode} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
        {isBooking ? (<><Loader2 className="h-4 w-4 animate-spin" />Submitting Booking...</>) : (<>Submit Booking Request<ArrowRight className="h-4 w-4" /></>)}
      </button>
      <p className="text-center text-xs text-muted-foreground">Booking will be calculated via Google Maps and written directly to Google Sheets.</p>
    </div>
  );
}
