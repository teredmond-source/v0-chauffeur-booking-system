import { NextResponse } from "next/server";
import { calculateDistance } from "../../../lib/google-maps";
import { calculateNTAFare } from "../../../lib/pricing";
import { appendSheetRow, ensureSheetTab, getSheetData, updateSheetRow } from "../../../lib/google-sheets";

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
      preferredReply,
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

    const timestamp = new Date().toISOString();

    // Step 5: Write to Google Sheets - Bookings tab
    // First, check if headers exist. If not, write them.
    const headers = [
      "Request ID", "Customer Name", "Phone", "Email", "General Query",
      "Pickup Eircode", "Destination Eircode", "Vehicle Type", "Date", "Time",
      "Pax", "Distance KM", "Travel Time", "NTA Max Fare", "Adjusted Fare",
      "Status", "Timestamp", "Origin Address", "Destination Address", "Owner Fare", "Preferred Reply",
    ];

    // Ensure Bookings tab and headers exist
    const tabExisted = await ensureSheetTab("Bookings");
    if (!tabExisted) {
      // Tab just created - write headers
      await updateSheetRow("Bookings!A1:U1", [headers]);
    } else {
      const existing = await getSheetData("Bookings!A1:A1");
      if (!existing || existing.length === 0 || existing[0][0] !== "Request ID") {
        // No headers - insert them
        const allData = await getSheetData("Bookings!A1:U");
        if (!allData || allData.length === 0) {
          await updateSheetRow("Bookings!A1:U1", [headers]);
        } else {
          const newData = [headers, ...allData];
          await updateSheetRow(`Bookings!A1:U${newData.length}`, newData);
        }
      }
    }

    // Generate unique Request ID by reading existing IDs from the now-guaranteed sheet
    let maxNum = 1000;
    try {
      const idData = await getSheetData("Bookings!A:A");
      console.log("[v0] All IDs in column A:", JSON.stringify(idData.map((r: string[]) => r[0])));
      for (const row of idData) {
        const val = row[0];
        if (val && val.startsWith("RD-")) {
          const num = parseInt(val.replace("RD-", ""), 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      }
    } catch (e) {
      console.log("[v0] Failed to read IDs, using timestamp fallback:", e);
    }
    const requestId = `RD-${maxNum + 1}`;
    console.log("[v0] Generated new Request ID:", requestId);

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
      "", // Owner Fare - blank until owner sets it
      preferredReply || "whatsapp",
    ];

    await appendSheetRow("Bookings!A:U", [rowData]);

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
