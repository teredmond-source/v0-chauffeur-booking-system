import { NextResponse } from "next/server";
import { getDrivers } from "../../../lib/google-sheets";

export async function GET() {
  try {
    const drivers = await getDrivers();
    return NextResponse.json({ drivers });
  } catch (error) {
    console.error("[v0] Error fetching drivers:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch drivers" },
      { status: 500 }
    );
  }
}
