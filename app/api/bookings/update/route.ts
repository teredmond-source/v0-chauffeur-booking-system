import { NextResponse } from "next/server";
import { getBookings, updateSheetCell } from "../../../../lib/google-sheets";

// Column indices in the Bookings sheet (0-based from the booking API)
// A=Request ID, B=Customer Name, C=Phone, D=Email, E=General Query,
// F=Pickup Eircode, G=Destination Eircode, H=Vehicle Type, I=Date, J=Time,
// K=Pax, L=Distance KM, M=Travel Time, N=NTA Max Fare, O=Adjusted Fare,
// P=Status, Q=Timestamp, R=Origin Address, S=Destination Address,
// T=Owner Fare, U=Assigned Driver

const COL_MAP: Record<string, string> = {
  "Owner Fare": "T",
  "Status": "P",
  "Preferred Reply": "U",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requestId, field, value } = body;

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

    // Find the row for this request ID
    const bookings = await getBookings();
    const booking = bookings.find((b) => b["Request ID"] === requestId);
    if (!booking) {
      return NextResponse.json({ error: `Booking ${requestId} not found` }, { status: 404 });
    }

    const rowIndex = booking["_rowIndex"];
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
