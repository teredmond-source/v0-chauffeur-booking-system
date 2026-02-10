import { NextResponse } from "next/server";

export async function GET() {
  console.log("[v0] TEST-BOOKING GET hit");
  try {
    console.log("[v0] Importing google-sheets...");
    const { appendSheetRow } = await import("../../../lib/google-sheets");
    console.log("[v0] Import OK, writing test row...");
    
    const testRow = [
      "RD-TEST",
      "Test User",
      "0851234567",
      "test@test.com",
      "",
      "D02 X285",
      "D04 Y678",
      "E-Class",
      "2026-01-01",
      "10:00",
      "2",
      "15",
      "20",
      "25.00",
      "25",
      "Requested",
      new Date().toISOString(),
      "Dublin 2",
      "Dublin 4",
      "",
      "whatsapp",
    ];
    
    await appendSheetRow("Bookings!A:U", [testRow]);
    console.log("[v0] Test row written successfully");
    return NextResponse.json({ success: true, message: "Test row written" });
  } catch (error) {
    console.error("[v0] TEST ERROR:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
