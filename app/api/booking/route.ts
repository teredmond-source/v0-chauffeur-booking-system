import { NextResponse } from "next/server";

let counter = 0;

export async function POST(request: Request) {
  console.log("[v0] BOOKING ROUTE HIT");

  try {
    const body = await request.json();
    console.log("[v0] Body received:", body.customerName);

    const {
      customerName = "",
      phone = "",
      email = "",
      generalQuery = "",
      pickupEircode = "",
      destinationEircode = "",
      vehicleType = "",
      passengers = "1",
      pickupDate = "",
      pickupTime = "",
      minFare = 15,
      preferredReply = "whatsapp",
    } = body;

    if (!customerName || !pickupEircode || !destinationEircode) {
      return NextResponse.json(
        { error: "Name, Pickup Eircode, and Destination Eircode are required." },
        { status: 400 },
      );
    }

    // Simple unique Request ID
    counter++;
    const requestId = `RD-${Date.now().toString().slice(-5)}${counter}`;
    const timestamp = new Date().toISOString();

    // Calculate distance using Google Maps
    let distanceKm = 0;
    let durationMinutes = 0;
    let originAddress = pickupEircode;
    let destinationAddress = destinationEircode;
    try {
      const { calculateDistance } = await import("../../../lib/google-maps");
      const dist = await calculateDistance(pickupEircode, destinationEircode);
      distanceKm = dist.distanceKm;
      durationMinutes = dist.durationMinutes;
      originAddress = dist.originAddress || pickupEircode;
      destinationAddress = dist.destinationAddress || destinationEircode;
      console.log("[v0] Distance calculated:", distanceKm, "km");
    } catch (e) {
      console.log("[v0] Distance calc failed:", e instanceof Error ? e.message : e);
    }

    // Calculate NTA fare
    let ntaFare = 0;
    try {
      const { calculateNTAFare } = await import("../../../lib/pricing");
      const result = calculateNTAFare(distanceKm, durationMinutes);
      ntaFare = result.totalFare;
      console.log("[v0] Fare calculated:", ntaFare);
    } catch (e) {
      console.log("[v0] Fare calc failed:", e instanceof Error ? e.message : e);
    }
    const finalFare = Math.round(Math.max(ntaFare, Number(minFare) || 15));

    // Build row data
    const rowData = [
      requestId,
      customerName,
      phone,
      email,
      generalQuery,
      pickupEircode,
      destinationEircode,
      vehicleType,
      pickupDate,
      pickupTime,
      String(passengers),
      String(distanceKm),
      String(durationMinutes),
      ntaFare.toFixed(2),
      String(finalFare),
      "Requested",
      timestamp,
      originAddress,
      destinationAddress,
      "",
      preferredReply,
    ];

    console.log("[v0] Writing row to sheet:", rowData[0], rowData[1], rowData[2]);

    // Write to Google Sheet
    const { appendSheetRow } = await import("../../../lib/google-sheets");
    await appendSheetRow("Bookings!A:U", [rowData]);

    console.log("[v0] Row written successfully");

    return NextResponse.json({
      success: true,
      bookingId: requestId,
      distance: { km: distanceKm, minutes: durationMinutes, originAddress, destinationAddress },
      fare: { totalFare: finalFare },
    });
  } catch (error) {
    console.log("[v0] BOOKING ERROR:", error instanceof Error ? error.message : error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
