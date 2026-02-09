import { NextResponse } from "next/server";
import { getDrivers } from "../../../lib/google-sheets";

export async function GET() {
  try {
    console.log("[v0] Drivers API called");
    console.log("[v0] Using Sheet ID: 1Mm2OGOpz32gKIdyT0ZY5KbmmgqjVMaKLprHDoFwKFFM");
    console.log("[v0] Using service account: v0-69-270@taxi-app-486813.iam.gserviceaccount.com");
    console.log("[v0] Querying range: Drivers!A1:Z");
    const drivers = await getDrivers();
    console.log("[v0] Drivers fetched successfully, count:", drivers.length);
    console.log("[v0] First driver:", JSON.stringify(drivers[0] || "none"));
    return NextResponse.json({ drivers });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errDetails = error && typeof error === 'object' && 'response' in error ? JSON.stringify((error as { response?: unknown }).response) : '';
    console.error("[v0] Error fetching drivers:", errMsg, errDetails);
    return NextResponse.json(
      { error: errMsg, details: errDetails },
      { status: 500 }
    );
  }
}
