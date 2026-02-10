import { NextResponse } from "next/server";
import { getBookings, getSheetData } from "../../../lib/google-sheets";

export async function GET() {
  try {
    // Debug: log the raw headers from the Bookings sheet
    const rawData = await getSheetData("Bookings!A1:T2");
    console.log("[v0] Bookings sheet row 1 (headers):", JSON.stringify(rawData[0]));
    if (rawData[1]) console.log("[v0] Bookings sheet row 2 (first data):", JSON.stringify(rawData[1]));

    const bookings = await getBookings();
    if (bookings.length > 0) {
      console.log("[v0] First booking keys:", Object.keys(bookings[0]).join(", "));
      console.log("[v0] First booking values:", JSON.stringify(bookings[0]));
    }
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
