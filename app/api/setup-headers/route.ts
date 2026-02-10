import { NextResponse } from "next/server";
import { getSheetData, updateSheetRow, ensureSheetTab } from "../../../lib/google-sheets";

const HEADERS = [
  "Request ID", "Customer Name", "Phone", "Email", "General Query",
  "Pickup Eircode", "Destination Eircode", "Vehicle Type", "Date", "Time",
  "Pax", "Distance KM", "Travel Time", "NTA Max Fare", "Adjusted Fare",
  "Status", "Timestamp", "Origin Address", "Destination Address", "Owner Fare",
];

export async function POST() {
  try {
    // Step 1: Ensure "Bookings" tab exists
    const tabExisted = await ensureSheetTab("Bookings");
    console.log("[v0] Bookings tab existed:", tabExisted);

    if (!tabExisted) {
      // Tab was just created - write headers to empty sheet
      await updateSheetRow("Bookings!A1:T1", [HEADERS]);
      return NextResponse.json({ message: "Created Bookings tab and wrote headers", headers: HEADERS });
    }

    // Step 2: Check if row 1 already has correct headers
    let existing: string[][] = [];
    try {
      existing = await getSheetData("Bookings!A1:T1");
    } catch {
      // Sheet might be empty
    }

    if (existing && existing.length > 0 && existing[0][0] === "Request ID") {
      return NextResponse.json({ message: "Headers already exist", headers: existing[0] });
    }

    // Step 3: Row 1 exists but is data, not headers - shift everything down
    let allData: string[][] = [];
    try {
      allData = await getSheetData("Bookings!A1:T");
    } catch {
      // Empty
    }

    if (!allData || allData.length === 0) {
      await updateSheetRow("Bookings!A1:T1", [HEADERS]);
      return NextResponse.json({ message: "Headers written to empty Bookings tab", headers: HEADERS });
    }

    // Prepend headers and rewrite
    const newData = [HEADERS, ...allData];
    await updateSheetRow(`Bookings!A1:T${newData.length}`, newData);

    return NextResponse.json({
      message: `Headers inserted. ${allData.length} existing rows shifted down.`,
      headers: HEADERS,
      existingRows: allData.length,
    });
  } catch (error) {
    console.error("[v0] Error setting up headers:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to set up headers" },
      { status: 500 }
    );
  }
}
