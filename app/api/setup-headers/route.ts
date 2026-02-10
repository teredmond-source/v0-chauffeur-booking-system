import { NextResponse } from "next/server";
import { getSheetData, updateSheetRow } from "../../../lib/google-sheets";

const HEADERS = [
  "Request ID", "Customer Name", "Phone", "Email", "General Query",
  "Pickup Eircode", "Destination Eircode", "Vehicle Type", "Date", "Time",
  "Pax", "Distance KM", "Travel Time", "NTA Max Fare", "Adjusted Fare",
  "Status", "Timestamp", "Origin Address", "Destination Address", "Owner Fare",
];

export async function POST() {
  try {
    // Check if headers exist
    const existing = await getSheetData("Bookings!A1:T1");
    if (existing && existing.length > 0 && existing[0][0] === "Request ID") {
      return NextResponse.json({ message: "Headers already exist", headers: existing[0] });
    }

    // If row 1 has data but wrong headers, we need to insert headers
    // First check if there's any data at all
    const allData = await getSheetData("Bookings!A1:T");
    
    if (!allData || allData.length === 0) {
      // Empty sheet - just write headers
      await updateSheetRow("Bookings!A1:T1", [HEADERS]);
      return NextResponse.json({ message: "Headers written to empty sheet", headers: HEADERS });
    }

    // There's data but no proper headers - the first row is data, not headers
    // We need to shift all data down by 1 row and insert headers at row 1
    // Google Sheets API doesn't have an "insert row" - we need to rewrite
    const newData = [HEADERS, ...allData];
    await updateSheetRow(`Bookings!A1:T${newData.length}`, newData);

    return NextResponse.json({ 
      message: `Headers inserted. ${allData.length} existing rows shifted down.`,
      headers: HEADERS,
      existingRows: allData.length,
    });
  } catch (error) {
    console.error("Error setting up headers:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to set up headers" },
      { status: 500 }
    );
  }
}
