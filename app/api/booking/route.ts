import { NextResponse } from "next/server";
import { calculateDistance } from "../../../lib/google-maps";
import { calculateNTAFare } from "../../../lib/pricing";
import { appendSheetRow } from "../../../lib/google-sheets";

let counter = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
        { status: 400 }
      );
    }

    // Simple unique Request ID using timestamp + counter
    counter++;
    const requestId = `RD-${Date.now().toString().slice(-5)}${counter}`;
    const timestamp = new Date().toISOString();

    // Calculate distance
    const distance = await calculateDistance(pickupEircode, destinationEircode);
    const distanceKm = distance.distanceKm;
    const durationMinutes = distance.durationMinutes;
    const originAddress = distance.originAddress || pickupEircode;
    const destinationAddress = distance.destinationAddress || destinationEircode;

    // Calculate NTA fare based on pickup date/time (determines Standard/Premium/Special rate)
    const fareResult = calculateNTAFare(distanceKm, durationMinutes, pickupDate, pickupTime);
    const ntaFareLow = fareResult.fareLow;
    const ntaFareHigh = fareResult.fareHigh;
    const premiumFare = fareResult.premiumFare;
    const ntaMaxFare = ntaFareHigh;
    const finalFare = Math.round(Math.max(ntaMaxFare, Number(minFare) || 15));

    // Build row data matching column order
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
      ntaMaxFare.toFixed(2),
      String(finalFare),
      "Requested",
      timestamp,
      originAddress,
      destinationAddress,
      "",
      preferredReply,
      ntaFareLow.toFixed(2),
      ntaFareHigh.toFixed(2),
      premiumFare.toFixed(2),
    ];

    // Write to Google Sheet
    await appendSheetRow("Bookings!A:X", [rowData]);

    return NextResponse.json({
      success: true,
      bookingId: requestId,
      distance: { km: distanceKm, minutes: durationMinutes, originAddress, destinationAddress },
      fare: { totalFare: finalFare, fareLow: ntaFareLow, fareHigh: ntaFareHigh, premiumFare },
    });
  } catch (error) {
    console.error("Booking API error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
