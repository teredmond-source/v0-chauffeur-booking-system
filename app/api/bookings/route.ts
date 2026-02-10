import { NextResponse } from "next/server";
import { getBookings } from "../../../lib/google-sheets";

export async function GET() {
  try {
    const bookings = await getBookings();
    console.log("[v0] Bookings fetched, count:", bookings.length);
    if (bookings.length > 0) {
      console.log("[v0] First booking keys:", Object.keys(bookings[0]).join(", "));
      console.log("[v0] First booking Phone:", bookings[0]["Phone"]);
      console.log("[v0] First booking Origin:", bookings[0]["Origin Address"]);
      console.log("[v0] First booking Vehicle:", bookings[0]["Vehicle Type"]);
    }
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("[v0] Error fetching bookings:", error);
    // If sheet doesn't exist, return empty
    return NextResponse.json({ bookings: [] });
  }
}
