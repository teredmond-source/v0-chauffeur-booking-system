import { NextResponse } from "next/server";
import { calculateDistance } from "../../../lib/google-maps";
import { calculateNTAFare } from "../../../lib/pricing";
import { appendSheetRow } from "../../../lib/google-sheets";

// Generate a Request ID like RD-1001
let requestCounter = 1000;
function generateRequestId(): string {
  requestCounter++;
  return `RD-${requestCounter}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      phone,
      email,
      generalQuery,
      pickupEircode,
      destinationEircode,
      vehicleType,
      passengers,
      pickupDate,
      pickupTime,
      minFare,
      adjustedFare,
    } = body;

    // Validate required fields
    if (!customerName || !pickupEircode || !destinationEircode || !vehicleType) {
      return NextResponse.json(
        { error: "Missing required fields: Name, Pickup Eircode, Destination Eircode, and Vehicle Type are required." },
        { status: 400 }
      );
    }

    // Step 1: Calculate distance via Google Maps
    const distance = await calculateDistance(pickupEircode, destinationEircode);

    // Step 2: Calculate NTA fare
    const fare = calculateNTAFare(distance.distanceKm, distance.durationMinutes);

    // Step 3: Apply minimum fare and round to nearest euro
    const ntaFare = fare.totalFare;
    const vehicleMinFare = minFare || 15;
    const finalFare = adjustedFare || Math.round(Math.max(ntaFare, vehicleMinFare));

    // Step 4: Generate Request ID
    const requestId = generateRequestId();
    const timestamp = new Date().toISOString();

    // Step 5: Write to Google Sheets - Bookings tab
    const rowData = [
      requestId,
      customerName,
      phone || "",
      email || "",
      generalQuery || "",
      pickupEircode,
      destinationEircode,
      vehicleType,
      pickupDate || "",
      pickupTime || "",
      passengers?.toString() || "1",
      distance.distanceKm.toString(),
      distance.durationMinutes.toString(),
      ntaFare.toFixed(2),
      finalFare.toString(),
      "Requested",
      timestamp,
      distance.originAddress,
      distance.destinationAddress,
    ];

    await appendSheetRow("Bookings!A:S", [rowData]);

    return NextResponse.json({
      success: true,
      bookingId: requestId,
      distance: {
        km: distance.distanceKm,
        minutes: distance.durationMinutes,
        originAddress: distance.originAddress,
        destinationAddress: distance.destinationAddress,
      },
      fare: { ...fare, totalFare: finalFare },
    });
  } catch (error) {
    console.error("Booking API error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
