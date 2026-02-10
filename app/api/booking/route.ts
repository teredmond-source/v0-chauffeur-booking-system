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
    const ntaFare = fareResult.totalFare;
    const finalFare = Math.round(Math.max(ntaFare, Number(minFare) || 15));

    // Build row data matching column order:
    // A: Request ID, B: Customer Name, C: Phone, D: Email, E: General Query,
    // F: Pickup Eircode, G: Destination Eircode, H: Vehicle Type, I: Date, J: Time,
    // K: Pax, L: Distance KM, M: Travel Time, N: NTA Max Fare, O: Adjusted Fare,
    // P: Status, Q: Timestamp, R: Origin Address, S: Destination Address, T: Owner Fare, U: Preferred Reply
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

    // Write to Google Sheet
    await appendSheetRow("Bookings!A:U", [rowData]);

    return NextResponse.json({
      success: true,
      bookingId: requestId,
      distance: { km: distanceKm, minutes: durationMinutes, originAddress, destinationAddress },
      fare: { totalFare: finalFare },
    });
  } catch (error) {
    console.error("Booking API error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
