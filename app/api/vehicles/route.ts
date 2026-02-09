import { NextResponse } from "next/server";
import { getVehicles } from "../../../lib/google-sheets";

export async function GET() {
  try {
    console.log("[v0] Vehicles API called");
    const vehicles = await getVehicles();
    console.log("[v0] Vehicles fetched, count:", vehicles.length);
    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error("[v0] Error fetching vehicles:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}
