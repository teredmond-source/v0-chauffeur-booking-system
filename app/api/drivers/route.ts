import { NextResponse } from "next/server";
import { getDrivers } from "../../../lib/google-sheets";

export async function GET() {
  try {
    console.log("[v0] Drivers API called");
    console.log("[v0] GOOGLE_SHEET_ID set:", !!process.env.GOOGLE_SHEET_ID);
    console.log("[v0] GOOGLE_SHEETS_CLIENT_EMAIL set:", !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL);
    console.log("[v0] GOOGLE_SHEETS_PRIVATE_KEY set:", !!process.env.GOOGLE_SHEETS_PRIVATE_KEY);
    const drivers = await getDrivers();
    console.log("[v0] Drivers fetched successfully, count:", drivers.length);
    console.log("[v0] First driver:", JSON.stringify(drivers[0] || "none"));
    return NextResponse.json({ drivers });
  } catch (error) {
    console.error("[v0] Error fetching drivers:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch drivers" },
      { status: 500 }
    );
  }
}
