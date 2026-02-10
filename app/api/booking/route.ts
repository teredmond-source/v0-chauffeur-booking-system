import { NextResponse } from "next/server";
import { calculateDistance } from "../../../lib/google-maps";
import { calculateNTAFare } from "../../../lib/pricing";
import { appendSheetRow } from "../../../lib/google-sheets";

let counter = 0;

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
      preferredReply,
    } = body;

    if (!customerName || !pickupEircode || !destinationEircode) {
      return NextResponse.json(
        { error: "Name, Pickup Eircode, and Destination Eircode are required." },
        { status: 400 },
      );
    }

    // Generate unique Request ID using timestamp + counter
    counter++;
    const ts = Date.now().toString().slice(-4);
    const requestId = `RD-${ts}${counter}`;
    const timestamp = new Date().toISOString();

    // Calculate distance
    let distanceKm = 0;
    let durationMinutes = 0;
    let originAddress = pickupEircode;
    let destinationAddress = destinationEircode;
    try {
      const distance = await calculateDistance(pickupEircode, destinationEircode);
      distanceKm = distance.distanceKm;
      durationMinutes = distance.durationMinutes;
      originAddress = distance.originAddress || pickupEircode;
      destinationAddress = distance.destinationAddress || destinationEircode;
    } catch {
      // Distance calculation failed - continue without it
    }

    // Calculate fare
    let ntaFare = 0;
    try {
      const result = calculateNTAFare(distanceKm, durationMinutes);
      ntaFare = result.totalFare;
    } catch {
      // Fare calculation failed - continue without it
    }
    const vehicleMinFare = minFare || 15;
    const finalFare = Math.round(Math.max(ntaFare, vehicleMinFare));

    const rowData = [
      requestId,
      customerName || "",
      phone || "",
      email || "",
      generalQuery || "",
      pickupEircode || "",
      destinationEircode || "",
      vehicleType || "",
      pickupDate || "",
      pickupTime || "",
      passengers?.toString() || "1",
      distanceKm.toString(),
      durationMinutes.toString(),
      ntaFare.toFixed(2),
      finalFare.toString(),
      "Requested",
      timestamp,
      originAddress,
      destinationAddress,
      "",
      preferredReply || "whatsapp",
    ];

    await appendSheetRow("Bookings!A:U", [rowData]);

    return NextResponse.json({
      success: true,
      bookingId: requestId,
      distance: {
        km: distanceKm,
        minutes: durationMinutes,
        originAddress,
        destinationAddress,
      },
      fare: { totalFare: finalFare },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
