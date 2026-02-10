import { NextResponse } from "next/server";
import { calculateDistance } from "../../../lib/google-maps";
import { calculateNTAFare } from "../../../lib/pricing";
import { appendSheetRow, getSheetData } from "../../../lib/google-sheets";

export async function POST(request: Request) {
  console.log("[v0] === BOOKING POST START ===");
  try {
    const body = await request.json();
    console.log("[v0] Body received:", JSON.stringify(body).slice(0, 300));

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
        { status: 400 }
      );
    }

    // Generate unique Request ID from existing data
    let requestId = `RD-${Date.now().toString().slice(-6)}`;
    try {
      const idData = await getSheetData("Bookings!A:A");
      let maxNum = 1000;
      for (const row of idData) {
        const val = row[0];
        if (val && val.startsWith("RD-")) {
          const num = parseInt(val.replace("RD-", ""), 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      }
      requestId = `RD-${maxNum + 1}`;
      console.log("[v0] Generated ID from sheet:", requestId);
    } catch (idErr) {
      console.log("[v0] ID generation fallback used:", requestId, idErr);
    }

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
      console.log("[v0] Distance calculated:", distanceKm, "km,", durationMinutes, "min");
    } catch (distErr) {
      console.log("[v0] Distance calc failed, continuing without:", distErr);
    }

    // Calculate fare
    let ntaFare = 0;
    try {
      const fare = calculateNTAFare(distanceKm, durationMinutes);
      ntaFare = fare.totalFare;
    } catch (fareErr) {
      console.log("[v0] Fare calc failed:", fareErr);
    }
    const vehicleMinFare = minFare || 15;
    const finalFare = Math.round(Math.max(ntaFare, vehicleMinFare));

    const timestamp = new Date().toISOString();

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

    console.log("[v0] Writing row:", JSON.stringify(rowData).slice(0, 300));
    await appendSheetRow("Bookings!A:U", [rowData]);
    console.log("[v0] Row written successfully");

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
    console.error("[v0] BOOKING ERROR:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
