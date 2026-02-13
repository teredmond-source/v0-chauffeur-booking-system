import { NextResponse } from "next/server";
import { getBookings, updateSheetCell } from "../../../../lib/google-sheets";

const COL_MAP: Record<string, string> = {
  "Owner Fare": "T",
  "Status": "P",
  "Preferred Reply": "U",
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
    const { requestId, field, value, rowIndex: directRowIndex } = body;

    if (!requestId || !field || value === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: requestId, field, value" },
        { status: 400 }
      );
    }

    const col = COL_MAP[field];
    if (!col) {
      return NextResponse.json(
        { error: `Unknown field: ${field}. Allowed: ${Object.keys(COL_MAP).join(", ")}` },
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
    const range = `Bookings!${col}${rowIndex}`;

    await updateSheetCell(range, value);

    return NextResponse.json({
      success: true,
      requestId,
      field,
      value,
      range,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update booking" },
      { status: 500 }
    );
  }
}
