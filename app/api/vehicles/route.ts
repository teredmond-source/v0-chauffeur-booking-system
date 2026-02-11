import { NextResponse } from "next/server";
import { getVehicles } from "../../../lib/google-sheets";

export async function GET() {
  try {
    const vehicles = await getVehicles();
    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error("[v0] Error fetching vehicles:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}
