import { NextResponse } from "next/server";
import { getBookings, updateSheetCell } from "../../../../lib/google-sheets";

const COL_MAP: Record<string, string> = {
  "Status": "P",
  "Journey Status": "V",
  "Driver Name": "W",
  "Vehicle Reg": "X",
  "Pickup Timestamp": "Y",
  "Completion Timestamp": "Z",
  "Actual KM Driven": "AA",
  "Actual Duration": "AB",
  "Driver Lat": "AC",
  "Driver Lng": "AD",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requestId, updates, rowIndex: directRowIndex } = body;

    if (!requestId || !updates || typeof updates !== "object") {
      return NextResponse.json(
        { error: "Missing requestId or updates object" },
        { status: 400 }
      );
    }

    let rowIndex: string;

    if (directRowIndex) {
      rowIndex = String(directRowIndex);
    } else {
      const bookings = await getBookings();
      const booking = bookings.find((b) => b["Request ID"] === requestId);
      if (!booking) {
        return NextResponse.json({ error: `Booking ${requestId} not found` }, { status: 404 });
      }
      rowIndex = booking["_rowIndex"];
    }

    // Apply all updates
    const results: Record<string, string> = {};
    for (const [field, value] of Object.entries(updates)) {
      const col = COL_MAP[field];
      if (!col) continue;
      const range = `Bookings!${col}${rowIndex}`;
      await updateSheetCell(range, String(value));
      results[field] = String(value);
    }

    return NextResponse.json({ success: true, requestId, updated: results });
  } catch (error) {
    console.error("Error updating dispatch:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update dispatch" },
      { status: 500 }
    );
  }
}
