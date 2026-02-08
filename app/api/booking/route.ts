import { NextResponse } from "next/server";
import { calculateDistance } from "@/lib/google-maps";
import { calculateNTAFare } from "@/lib/pricing";
import { appendSheetRow } from "@/lib/google-sheets";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      phone,
      email,
      pickupEircode,
      destinationEircode,
      vehicleType,
      passengers,
      pickupDate,
      pickupTime,
      notes,
    } = body;

    // Validate required fields
    if (!customerName || !pickupEircode || !destinationEircode || !vehicleType) {
      return NextResponse.json(
        { error: "Missing required fields: Customer Name, Pickup Eircode, Destination Eircode, and Vehicle Type are mandatory." },
        { status: 400 }
      );
    }

    // Step 1: Calculate distance via Google Maps
    const distance = await calculateDistance(pickupEircode, destinationEircode);

    // Step 2: Calculate NTA fare
    const fare = calculateNTAFare(distance.distanceKm, distance.durationMinutes);

    // Step 3: Write to Google Sheets
    const timestamp = new Date().toISOString();
    const bookingId = `BK-${Date.now().toString(36).toUpperCase()}`;

    const rowData = [
      bookingId,
      timestamp,
      customerName,
      phone || "",
      email || "",
      pickupEircode,
      destinationEircode,
      distance.originAddress,
      distance.destinationAddress,
      vehicleType,
      passengers?.toString() || "1",
      pickupDate || "",
      pickupTime || "",
      distance.distanceKm.toString(),
      distance.durationMinutes.toString(),
      fare.totalFare.toFixed(2),
      fare.initialCharge.toFixed(2),
      fare.preBookingFee.toFixed(2),
      fare.tariffA.toFixed(2),
      fare.tariffB.toFixed(2),
      notes || "",
      "Pending",
    ];

    await appendSheetRow("Bookings!A:V", [rowData]);

    return NextResponse.json({
      success: true,
      bookingId,
      distance: {
        km: distance.distanceKm,
        minutes: distance.durationMinutes,
        originAddress: distance.originAddress,
        destinationAddress: distance.destinationAddress,
      },
      fare,
    });
  } catch (error) {
    console.error("Booking API error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
