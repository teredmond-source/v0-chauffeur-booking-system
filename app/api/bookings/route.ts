import { NextResponse } from "next/server";
import { getBookings } from "../../../lib/google-sheets";

export async function GET() {
  try {
    const bookings = await getBookings();
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("[v0] Error fetching bookings:", error);
    // If sheet doesn't exist, return empty
    return NextResponse.json({ bookings: [] });
  }
}
