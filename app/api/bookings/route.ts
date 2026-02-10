import { NextResponse } from "next/server";
import { getBookings, ensureSheetTab, getSheetData, updateSheetRow } from "../../../lib/google-sheets";

const HEADERS = [
  "Request ID", "Customer Name", "Phone", "Email", "General Query",
  "Pickup Eircode", "Destination Eircode", "Vehicle Type", "Date", "Time",
  "Pax", "Distance KM", "Travel Time", "NTA Max Fare", "Adjusted Fare",
  "Status", "Timestamp", "Origin Address", "Destination Address", "Owner Fare",
];

export async function GET() {
  try {
    // Ensure Bookings tab exists
    const tabExisted = await ensureSheetTab("Bookings");
    if (!tabExisted) {
      // Just created - write headers and return empty
      await updateSheetRow("Bookings!A1:T1", [HEADERS]);
      return NextResponse.json({ bookings: [] });
    }

    // Check if headers exist
    const row1 = await getSheetData("Bookings!A1:T1");
    if (!row1 || row1.length === 0 || row1[0][0] !== "Request ID") {
      console.log("[v0] Bookings sheet missing headers, row1:", JSON.stringify(row1));
      return NextResponse.json({ bookings: [], needsHeaders: true });
    }

    const bookings = await getBookings();
    console.log("[v0] Bookings fetched, count:", bookings.length);
    if (bookings.length > 0) {
      console.log("[v0] First booking keys:", Object.keys(bookings[0]).join(", "));
    }
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("[v0] Error fetching bookings:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
